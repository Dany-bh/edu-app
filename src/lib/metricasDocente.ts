// src/lib/metricasDocente.ts
import { MetricasSaludSalon, AlumnoInactivo, DistribucionSalon } from '../types';
import { normalizarIdEnfermedad } from '../data/prePost';

export interface EvaluacionItem {
  usuario_id: number;
  enfermedad_id: string;
  pre_puntaje: number;
  post_puntaje?: number | null;
  mejora?: number | null;
  salon?: string | null;
}

export interface AlumnoItem {
  id: number;
  usuario: string;
  nombre_completo?: string;
  salon?: string | null;
  puntos?: number;
  racha_actual?: number;
  ultimo_dia_activo?: string | null;
  rol?: string;
  estado?: string;
}

export interface ErrorEnfermedadItem {
  enfermedad_id: string;
  salon?: string | null;
}

const NOMBRES_ENFERMEDADES: Record<string, string> = {
  cardiovasculares: 'Salud Cardiovascular',
  cancer: 'Prevención de Cáncer',
  respiratorias: 'Salud Respiratoria',
  diabetes: 'Diabetes y Metabolismo',
  obesidad: 'Nutrición y Peso Saludable',
  'renal-cronica': 'Salud Renal',
  'salud-mental': 'Bienestar Emocional',
};

/**
 * Calcula el promedio aritmético redondeado a 1 decimal.
 */
export function calcularPromedio(valores: number[]): number {
  if (!valores || valores.length === 0) return 0;
  const suma = valores.reduce((acc, curr) => acc + (Number.isFinite(curr) ? curr : 0), 0);
  return Math.round((suma / valores.length) * 10) / 10;
}

/**
 * Calcula la racha media de una lista de alumnos.
 */
export function calcularRachaMedia(alumnos: { racha_actual?: number | null }[]): number {
  if (!alumnos || alumnos.length === 0) return 0;
  const rachas = alumnos.map(a => Math.max(0, a.racha_actual || 0));
  return calcularPromedio(rachas);
}

/**
 * Calcula la mejora y promedios entre pre-test y post-test.
 */
export function calcularMejoraPrePost(evaluaciones: EvaluacionItem[]): {
  mejoraPromedio: number;
  promedioPre: number;
  promedioPost: number;
  totalCompletados: number;
} {
  if (!evaluaciones || evaluaciones.length === 0) {
    return { mejoraPromedio: 0, promedioPre: 0, promedioPost: 0, totalCompletados: 0 };
  }

  const completados = evaluaciones.filter(
    e => e.post_puntaje !== null && e.post_puntaje !== undefined
  );

  const preScores = evaluaciones.map(e => e.pre_puntaje);
  const postScores = completados.map(e => Number(e.post_puntaje));
  const mejoras = completados.map(e => {
    if (typeof e.mejora === 'number') return e.mejora;
    return Number(e.post_puntaje) - e.pre_puntaje;
  });

  return {
    promedioPre: calcularPromedio(preScores),
    promedioPost: calcularPromedio(postScores),
    mejoraPromedio: calcularPromedio(mejoras),
    totalCompletados: completados.length,
  };
}

/**
 * Identifica la enfermedad con mayor número de errores registrados.
 */
export function encontrarEnfermedadConMasErrores(
  errores: ErrorEnfermedadItem[]
): { enfermedadId: string; nombre: string; totalErrores: number } | null {
  if (!errores || errores.length === 0) return null;

  const conteo: Record<string, number> = {};
  for (const err of errores) {
    const idNorm = normalizarIdEnfermedad(err.enfermedad_id);
    conteo[idNorm] = (conteo[idNorm] || 0) + 1;
  }

  let maxId = '';
  let maxCount = -1;

  for (const [id, count] of Object.entries(conteo)) {
    if (count > maxCount) {
      maxCount = count;
      maxId = id;
    }
  }

  if (!maxId || maxCount <= 0) return null;

  return {
    enfermedadId: maxId,
    nombre: NOMBRES_ENFERMEDADES[maxId] || maxId,
    totalErrores: maxCount,
  };
}

/**
 * Filtra los alumnos que llevan 7 o más días sin actividad o nunca han ingresado.
 * No expone conversaciones, ni datos biomédicos personales.
 */
export function filtrarAlumnosInactivos(
  alumnos: AlumnoItem[],
  diasLimite: number = 7,
  fechaReferencia: Date = new Date()
): AlumnoInactivo[] {
  if (!alumnos) return [];

  const msPorDia = 1000 * 60 * 60 * 24;
  const hoyMs = fechaReferencia.getTime();

  return alumnos
    .filter(a => (a.rol === 'estudiante' || !a.rol) && (a.estado === 'activo' || !a.estado))
    .map(a => {
      let diasInactivo: number | null = null;
      if (a.ultimo_dia_activo) {
        const fechaActivo = new Date(a.ultimo_dia_activo).getTime();
        const diffMs = hoyMs - fechaActivo;
        diasInactivo = Math.max(0, Math.floor(diffMs / msPorDia));
      }

      return {
        id: a.id,
        alias: `@${a.usuario}`,
        salon: a.salon ?? null,
        diasInactivo,
        ultimoAcceso: a.ultimo_dia_activo || null,
        racha: a.racha_actual || 0,
        puntos: a.puntos || 0,
      };
    })
    .filter(a => a.diasInactivo === null || a.diasInactivo >= diasLimite)
    .sort((a, b) => {
      if (a.diasInactivo === null) return 1;
      if (b.diasInactivo === null) return -1;
      return b.diasInactivo - a.diasInactivo;
    });
}

/**
 * Calcula la cantidad de alumnos que estuvieron activos en los últimos 7 días.
 */
export function calcularAlumnosActivosSemana(
  alumnos: AlumnoItem[],
  fechaReferencia: Date = new Date()
): number {
  if (!alumnos) return 0;
  const msPorDia = 1000 * 60 * 60 * 24;
  const hoyMs = fechaReferencia.getTime();

  return alumnos.filter(a => {
    if ((a.rol && a.rol !== 'estudiante') || (a.estado && a.estado !== 'activo')) return false;
    if (!a.ultimo_dia_activo) return false;
    const fecha = new Date(a.ultimo_dia_activo).getTime();
    const diffDias = (hoyMs - fecha) / msPorDia;
    return diffDias <= 7;
  }).length;
}

/**
 * Función central de agregación de métricas pedagógicas para docentes.
 * Agrupa y consolida todos los datos según el salón seleccionado.
 */
export function calcularMetricasDocente(
  alumnos: AlumnoItem[],
  evaluaciones: EvaluacionItem[],
  errores: ErrorEnfermedadItem[] = [],
  alertasCount: number = 0,
  salonFiltro?: string | null
): MetricasSaludSalon {
  const alumnosEstudiantes = (alumnos || []).filter(
    a => (a.rol === 'estudiante' || !a.rol) && (a.estado === 'activo' || !a.estado)
  );

  // Filtrar por salón si se especifica y no es "todos"
  const esTodos = !salonFiltro || salonFiltro === 'Todos' || salonFiltro === 'todos';
  const filtroSinAsignar = salonFiltro?.toLowerCase() === 'sin asignar';
  const alumnosFiltrados = esTodos
    ? alumnosEstudiantes
    : alumnosEstudiantes.filter(a =>
        filtroSinAsignar
          ? !a.salon?.trim()
          : a.salon?.trim().toLowerCase() === salonFiltro?.toLowerCase()
      );

  const uidsFiltrados = new Set(alumnosFiltrados.map(a => a.id));

  const evaluacionesFiltradas = esTodos
    ? evaluaciones
    : evaluaciones.filter(e => uidsFiltrados.has(e.usuario_id));

  const erroresFiltrados = esTodos
    ? errores
    : errores.filter(err =>
        filtroSinAsignar
          ? !err.salon?.trim()
          : err.salon?.trim().toLowerCase() === salonFiltro?.toLowerCase()
      );

  // Cálculos principales
  const { promedioPre, promedioPost, mejoraPromedio } = calcularMejoraPrePost(evaluacionesFiltradas);
  const puntosArray = alumnosFiltrados.map(a => a.puntos || 0);
  const promedioPuntos = calcularPromedio(puntosArray);
  const rachaMedia = calcularRachaMedia(alumnosFiltrados);
  const alumnosActivosSemana = calcularAlumnosActivosSemana(alumnosFiltrados);
  const enfermedadMasErrores = encontrarEnfermedadConMasErrores(erroresFiltrados);
  const inactivos = filtrarAlumnosInactivos(alumnosFiltrados, 7);

  // Distribución por salón
  const mapaSalones: Record<string, { alumnos: AlumnoItem[]; evaluaciones: EvaluacionItem[] }> = {};
  for (const al of alumnosEstudiantes) {
    const s = al.salon?.trim() || 'Sin asignar';
    if (!mapaSalones[s]) mapaSalones[s] = { alumnos: [], evaluaciones: [] };
    mapaSalones[s].alumnos.push(al);
  }

  for (const ev of evaluaciones) {
    const al = alumnosEstudiantes.find(a => a.id === ev.usuario_id);
    const s = al?.salon?.trim() || 'Sin asignar';
    if (mapaSalones[s]) {
      mapaSalones[s].evaluaciones.push(ev);
    }
  }

  const distribucionSalones: DistribucionSalon[] = Object.entries(mapaSalones).map(([salon, data]) => {
    const mejoraInfo = calcularMejoraPrePost(data.evaluaciones);
    const pts = data.alumnos.map(a => a.puntos || 0);
    return {
      salon,
      totalAlumnos: data.alumnos.length,
      promedio: calcularPromedio(pts),
      mejora: mejoraInfo.mejoraPromedio,
      alumnosActivos: calcularAlumnosActivosSemana(data.alumnos),
    };
  });

  // Comparativa Pre vs Post por enfermedad para gráficos
  const enfermedadesKeys = ['cardiovasculares', 'cancer', 'respiratorias', 'diabetes', 'obesidad', 'renal-cronica', 'salud-mental'];
  const comparativaEnfermedades = enfermedadesKeys.map(eid => {
    const evs = evaluacionesFiltradas.filter(e => normalizarIdEnfermedad(e.enfermedad_id) === eid);
    const res = calcularMejoraPrePost(evs);
    return {
      enfermedadId: eid,
      nombre: NOMBRES_ENFERMEDADES[eid] || eid,
      promedioPre: res.promedioPre,
      promedioPost: res.promedioPost,
      mejora: res.mejoraPromedio,
    };
  });

  return {
    salon: esTodos ? 'Todos los salones' : (salonFiltro || 'Todos los salones'),
    totalAlumnos: alumnosFiltrados.length,
    alumnosActivosSemana,
    rachaMedia,
    promedioPuntos,
    promedioPreTest: promedioPre,
    promedioPostTest: promedioPost,
    mejoraPromedio,
    enfermedadMasErrores,
    alertasSeguridadConteo: alertasCount,
    alumnosInactivos: inactivos,
    distribucionSalones,
    comparativaEnfermedades,
  };
}
