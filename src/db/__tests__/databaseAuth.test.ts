import { authenticateUser, deactivateStudentAccount, getPendingUsers, reactivateStudentAccount } from '../database';
import { verifyPassword } from '../security';
import { networkSync } from '../../services/networkSync';

const mockSqlite = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => mockSqlite),
}));

jest.mock('../migrations', () => ({
  runMigrations: jest.fn(async () => {}),
}));

jest.mock('../security', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock('../../services/networkSync', () => ({
  networkSync: {
    syncAllLocal: jest.fn(async () => {}),
    fetchNetworkData: jest.fn(async () => null),
    pushStudentStatus: jest.fn(async () => true),
  },
}));

const usuarioDePrueba = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  nombre_completo: 'Alex',
  usuario: 'alex',
  grado: '',
  genero: 'Otro',
  rol: 'estudiante',
  estado: 'activo',
  salon: null,
  password_hash: 'hash-real',
  salt: 'salt-real',
  puntos: 120,
  nivel: 3,
  ...overrides,
});

describe('gestión de estados de cuentas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSqlite.execAsync.mockResolvedValue(undefined);
    mockSqlite.getAllAsync.mockResolvedValue([]);
    mockSqlite.getFirstAsync.mockResolvedValue(usuarioDePrueba());
    mockSqlite.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
    (networkSync.fetchNetworkData as jest.Mock).mockResolvedValue(null);
  });

  it('rechaza a un estudiante inactivo aun con contraseña correcta', async () => {
    mockSqlite.getFirstAsync.mockResolvedValue(usuarioDePrueba({ estado: 'inactivo' }));
    (verifyPassword as jest.Mock).mockResolvedValue({ isValid: true, needsUpgrade: false });

    const result = await authenticateUser('alex', 'clave-correcta');

    expect(result).toEqual({
      success: false,
      status: 'inactivo',
      error: 'Tu cuenta se encuentra desactivada. Contacta al administrador.',
    });
  });

  it('rechaza una cuenta marcada inactiva por el servidor local', async () => {
    (verifyPassword as jest.Mock).mockResolvedValue({ isValid: true, needsUpgrade: false });
    (networkSync.fetchNetworkData as jest.Mock).mockResolvedValue({
      pendingUsers: [],
      activeUsers: [],
      inactiveUsers: [usuarioDePrueba({ usuario: 'alex' })],
      pendingPasswords: [],
      eliminados: [],
    });

    const result = await authenticateUser('alex', 'clave-correcta');

    expect(result.status).toBe('inactivo');
    expect(result.success).toBe(false);
  });

  it('no permite eludir la contraseña por un nombre de usuario especial', async () => {
    mockSqlite.getFirstAsync.mockResolvedValue(usuarioDePrueba({ usuario: 'admin', rol: 'admin' }));
    (verifyPassword as jest.Mock).mockResolvedValue({ isValid: false, needsUpgrade: false });

    const result = await authenticateUser('admin', '123456');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Usuario o contraseña incorrectos');
  });

  it('conserva el rol persistido aunque el usuario se llame dany', async () => {
    mockSqlite.getFirstAsync.mockResolvedValue(usuarioDePrueba({ usuario: 'dany', rol: 'estudiante' }));
    (verifyPassword as jest.Mock).mockResolvedValue({ isValid: true, needsUpgrade: false });

    const result = await authenticateUser('dany', 'clave-correcta');

    expect(result.success).toBe(true);
    expect(result.user?.rol).toBe('estudiante');
  });

  it('consulta exclusivamente cuentas pendientes para la lista de aprobaciones', async () => {
    await getPendingUsers();

    expect(mockSqlite.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE estado = 'pendiente' AND rol IN ('estudiante', 'docente')")
    );
  });

  it('desactiva solo cuentas estudiante y modifica únicamente el estado', async () => {
    await deactivateStudentAccount(42);

    expect(mockSqlite.runAsync).toHaveBeenCalledWith(
      "UPDATE usuarios SET estado = ? WHERE id = ? AND rol = 'estudiante' AND estado = ?;",
      ['inactivo', 42, 'activo']
    );
  });

  it('reactiva una cuenta inactiva sin modificar otros datos', async () => {
    await reactivateStudentAccount(42);

    expect(mockSqlite.runAsync).toHaveBeenCalledWith(
      "UPDATE usuarios SET estado = ? WHERE id = ? AND rol = 'estudiante' AND estado = ?;",
      ['activo', 42, 'inactivo']
    );
  });
});
