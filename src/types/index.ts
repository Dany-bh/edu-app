// src/types/index.ts

export type UserRole = 'estudiante' | 'docente' | 'admin';
export type UserStatus = 'activo' | 'inactivo' | 'pendiente' | 'rechazado';

export interface User {
  id: number;
  nombre_completo: string;
  usuario: string;
  grado?: string | null;
  genero: string;
  rol: UserRole;
  estado?: UserStatus;
  salon?: string | null;
  puntos: number;
  nivel: number;
  fecha_registro?: string;
  racha_actual?: number;
  racha_maxima?: number;
  ultimo_dia_activo?: string | null;
  recordatorio_hora?: string;
  recordatorio_activo?: number | boolean;
  congeladores_disponibles?: number;
  congelador_ultimo_uso?: string | null;
  meta_diaria_completada_fecha?: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  status?: UserStatus;
  error?: string;
}

export interface SolicitudPassword {
  id: number;
  usuario_id: number;
  usuario: string;
  nombre_completo: string;
  estado: 'pendiente' | 'atendido' | 'rechazado';
  nueva_password_temporal?: string;
  fecha_solicitud: string;
  fecha_atencion?: string;
}

export interface UserSession extends User {
  token?: string;
}

export interface ProgressItem {
  id?: number;
  usuario_id: number;
  tipo: string;
  puntos: number;
  fecha?: string;
}

export interface SyncQueueItem {
  id?: number;
  tabla: string;
  registro_id: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  datos: string;
  creado_en?: string;
  intentos?: number;
  estado?: 'pendiente' | 'sincronizado' | 'fallido';
  error_mensaje?: string;
}

export interface LogroUsuarioRow {
  id: number;
  usuario_id: number;
  logro_id: string;
  desbloqueado_en: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp?: number;
}

export interface Disease {
  id: string;
  nombre: string;
  categoria: string;
  icono: string;
  emoji: string;
  queEs: string;
  causas: string[];
  sintomas: string[];
  prevencion: string[];
  cuandoConsultar: string;
  imagenUrl: string;
  estadistica: string;
  estadisticaValor: number;
  fuenteMinsa?: string;
  codigoCIE10?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface PrePostPregunta {
  id: string;
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number; // 0..3
  explicacion: string;
}

export interface EvaluacionPrePost {
  id?: number;
  usuario_id: number;
  enfermedad_id: string;
  pre_puntaje: number;
  pre_fecha: string;
  post_puntaje?: number | null;
  post_fecha?: string | null;
  mejora?: number | null;
}

export interface AlumnoInactivo {
  id: number;
  alias: string;
  salon?: string | null;
  diasInactivo: number | null;
  ultimoAcceso: string | null;
  racha: number;
  puntos: number;
}

export interface DistribucionSalon {
  salon: string;
  totalAlumnos: number;
  promedio: number;
  mejora: number;
  alumnosActivos: number;
}

export interface MetricasSaludSalon {
  salon: string;
  totalAlumnos: number;
  alumnosActivosSemana: number;
  rachaMedia: number;
  promedioPuntos: number;
  promedioPreTest: number;
  promedioPostTest: number;
  mejoraPromedio: number;
  enfermedadMasErrores: {
    enfermedadId: string;
    nombre: string;
    totalErrores: number;
  } | null;
  alertasSeguridadConteo: number;
  alumnosInactivos: AlumnoInactivo[];
  distribucionSalones: DistribucionSalon[];
  comparativaEnfermedades?: {
    enfermedadId: string;
    nombre: string;
    promedioPre: number;
    promedioPost: number;
    mejora: number;
  }[];
}
