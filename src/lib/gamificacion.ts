/**
 * src/lib/gamificacion.ts
 * Lógica pura de gamificación y retención para edu-app (Expo SDK 57).
 * Incluye cálculo de nivel, XP, rangos, rachas con día de gracia, anti-farmeo,
 * meta diaria (3 min: 1 mini-reto + 1 ficha), congelador semanal, catálogo de logros
 * y algoritmo Fisher-Yates.
 */

export const XP_POR_NIVEL = 500;
export const XP_BONUS_META_DIARIA = 60;

export const TOPES_DIARIOS_XP = {
  reto_diario: 250, // Máximo 5 preguntas x 50 XP por día
  quiz: 300,
  actividad_educativa: 200,
  meta_diaria: 60,
  default: 500,
} as const;

export type TipoActividad = keyof typeof TOPES_DIARIOS_XP | string;

/**
 * Rangos oficiales con nombre orientados al liderazgo y promoción de la salud en secundaria.
 */
export interface RangoInfo {
  nivelMinimo: number;
  nombre: string;
  descripcion: string;
}

export const RANGOS_SALUD: readonly RangoInfo[] = [
  { nivelMinimo: 1, nombre: 'Aspirante en Salud', descripcion: 'Comenzando a aprender hábitos saludables.' },
  { nivelMinimo: 2, nombre: 'Aprendiz de Bienestar', descripcion: 'Adquiriendo conceptos clave de prevención.' },
  { nivelMinimo: 3, nombre: 'Promotor Comunitario', descripcion: 'Comparte conocimientos en su entorno escolar.' },
  { nivelMinimo: 4, nombre: 'Promotor de Salud', descripcion: 'Domina los factores de riesgo de las DNT.' },
  { nivelMinimo: 5, nombre: 'Guardián de la Salud', descripcion: 'Vigila y promueve estilos de vida activos.' },
  { nivelMinimo: 6, nombre: 'Defensor del Bienestar', descripcion: 'Ejemplo de prevención y constancia escolar.' },
  { nivelMinimo: 7, nombre: 'Embajador Escolar', descripcion: 'Lidera la promoción de la salud en su colegio.' },
  { nivelMinimo: 8, nombre: 'Líder en Salud Escolar', descripcion: 'Referente juvenil en prevención integral.' },
  { nivelMinimo: 9, nombre: 'Especialista en Prevención', descripcion: 'Profundo dominio de salud preventiva.' },
  { nivelMinimo: 10, nombre: 'Maestro de Vida Saludable', descripcion: 'Máximo nivel de conocimiento y compromiso.' },
] as const;

/**
 * Calcula el nivel actual a partir de la experiencia total (XP).
 * Cada 500 XP representa 1 nivel adicional. Nivel mínimo: 1.
 */
export function nivelDesdeXp(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  return Math.floor(xp / XP_POR_NIVEL) + 1;
}

/**
 * Retorna cuántos XP ha acumulado el usuario dentro del nivel actual (0 a 499).
 */
export function xpEnNivel(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 0;
  return xp % XP_POR_NIVEL;
}

/**
 * Retorna los XP restantes requeridos para alcanzar el siguiente nivel.
 */
export function xpParaSiguiente(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return XP_POR_NIVEL;
  const enNivel = xpEnNivel(xp);
  return XP_POR_NIVEL - enNivel;
}

/**
 * Retorna el título o rango honorífico correspondiente al nivel del estudiante.
 * Adaptado con lenguaje motivador para estudiantes de secundaria.
 */
export function rangoDeNivel(nivel: number): string {
  const nivelValido = Math.max(1, Math.floor(Number.isFinite(nivel) ? nivel : 1));
  for (let i = RANGOS_SALUD.length - 1; i >= 0; i--) {
    if (nivelValido >= RANGOS_SALUD[i].nivelMinimo) {
      return RANGOS_SALUD[i].nombre;
    }
  }
  return RANGOS_SALUD[0].nombre;
}

/**
 * Calcula la racha de días activos considerando 1 día de gracia por semana (gap de hasta 48h).
 * Formato esperado de fecha: 'YYYY-MM-DD' o fecha ISO parseable.
 */
export interface ResultadoRacha {
  rachaActual: number;
  rachaMaxima: number;
  usoGracia: boolean;
  esMismoDia: boolean;
  diasDiferencia: number;
}

export function calcularRacha(
  ultimoDia: string | null | undefined,
  hoy: string,
  rachaActual: number = 0,
  rachaMaxima: number = 0
): ResultadoRacha {
  const normalizar = (f: string): string => {
    if (f.includes('T')) return f.split('T')[0];
    return f.trim();
  };

  const hoyNorm = normalizar(hoy);

  if (!ultimoDia) {
    const nuevaRacha = Math.max(1, rachaActual || 1);
    return {
      rachaActual: nuevaRacha,
      rachaMaxima: Math.max(nuevaRacha, rachaMaxima),
      usoGracia: false,
      esMismoDia: false,
      diasDiferencia: 0,
    };
  }

  const ultimoNorm = normalizar(ultimoDia);

  if (ultimoNorm === hoyNorm) {
    const rActual = Math.max(1, rachaActual);
    return {
      rachaActual: rActual,
      rachaMaxima: Math.max(rActual, rachaMaxima),
      usoGracia: false,
      esMismoDia: true,
      diasDiferencia: 0,
    };
  }

  const dUltimo = new Date(`${ultimoNorm}T00:00:00Z`);
  const dHoy = new Date(`${hoyNorm}T00:00:00Z`);
  const diffMs = dHoy.getTime() - dUltimo.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= 0) {
    // Reloj desincronizado o fecha anterior: mantener racha
    const rActual = Math.max(1, rachaActual);
    return {
      rachaActual: rActual,
      rachaMaxima: Math.max(rActual, rachaMaxima),
      usoGracia: false,
      esMismoDia: true,
      diasDiferencia: diffDias,
    };
  }

  if (diffDias === 1) {
    // Día consecutivo exacto
    const nuevaRacha = (rachaActual || 0) + 1;
    return {
      rachaActual: nuevaRacha,
      rachaMaxima: Math.max(nuevaRacha, rachaMaxima),
      usoGracia: false,
      esMismoDia: false,
      diasDiferencia: 1,
    };
  }

  if (diffDias === 2) {
    // Saltó 1 día: se aplica el día de gracia semanal (la racha no se pierde y suma el nuevo día)
    const nuevaRacha = (rachaActual || 0) + 1;
    return {
      rachaActual: nuevaRacha,
      rachaMaxima: Math.max(nuevaRacha, rachaMaxima),
      usoGracia: true,
      esMismoDia: false,
      diasDiferencia: 2,
    };
  }

  // Saltó 2 o más días: se rompe la racha y se reinicia en 1
  return {
    rachaActual: 1,
    rachaMaxima: Math.max(1, rachaMaxima),
    usoGracia: false,
    esMismoDia: false,
    diasDiferencia: diffDias,
  };
}

/**
 * Verifica si corresponde mostrar el aviso de peligro de racha.
 */
export interface EstadoRachaConAviso {
  rachaActual: number;
  rachaMaxima: number;
  metaDiariaCumplidaHoy: boolean;
  congeladoresDisponibles: number;
}

export function verificarAvisoRacha(estado: EstadoRachaConAviso): {
  mostrarAviso: boolean;
  mensajeAviso?: string;
} {
  if (estado.rachaActual > 0 && !estado.metaDiariaCumplidaHoy) {
    return {
      mostrarAviso: true,
      mensajeAviso: 'Tu racha vence esta noche. ¡Cumple tu meta de 3 minutos para mantenerla activa!',
    };
  }
  return { mostrarAviso: false };
}

/**
 * Evalúa el congelador semanal (1 disponible por semana; se recarga 7 días tras el último uso).
 */
export function evaluarCongeladorSemanal(
  congeladoresActuales: number,
  ultimoUso: string | null | undefined,
  fechaHoy: string
): {
  congeladoresDisponibles: number;
  seRecargo: boolean;
} {
  if (congeladoresActuales > 0) {
    return { congeladoresDisponibles: 1, seRecargo: false };
  }
  if (!ultimoUso) {
    return { congeladoresDisponibles: 1, seRecargo: true };
  }
  const norm = (f: string) => (f.includes('T') ? f.split('T')[0] : f.trim());
  const dUso = new Date(`${norm(ultimoUso)}T00:00:00Z`).getTime();
  const dHoy = new Date(`${norm(fechaHoy)}T00:00:00Z`).getTime();
  const diffDias = Math.floor((dHoy - dUso) / (1000 * 60 * 60 * 24));
  if (diffDias >= 7) {
    return { congeladoresDisponibles: 1, seRecargo: true };
  }
  return { congeladoresDisponibles: 0, seRecargo: false };
}

/**
 * Evaluación de la meta diaria de 3 minutos ("1 mini-reto + 1 ficha leída").
 */
export interface EstadoMetaDiaria {
  retosHoy: number;
  fichasLeidasHoy: number;
  fechaUltimaCompletada?: string | null;
  fechaHoy: string;
}

export interface ResultadoMetaDiaria {
  retoCompletado: boolean;
  fichaCompletada: boolean;
  pasosCompletados: number; // 0, 1, 2
  totalPasos: number; // 2
  progresoFraccion: number; // 0, 0.5, 1.0
  cumplida: boolean;
  yaPremiadaHoy: boolean;
  debePremiar: boolean;
  xpOtorgar: number;
}

export function evaluarMetaDiaria(estado: EstadoMetaDiaria): ResultadoMetaDiaria {
  const retoCompletado = (estado.retosHoy || 0) >= 1;
  const fichaCompletada = (estado.fichasLeidasHoy || 0) >= 1;
  const pasosCompletados = (retoCompletado ? 1 : 0) + (fichaCompletada ? 1 : 0);
  const cumplida = pasosCompletados >= 2;

  const normalizarFecha = (f?: string | null) => (f ? f.split('T')[0].trim() : null);
  const yaPremiadaHoy = normalizarFecha(estado.fechaUltimaCompletada) === normalizarFecha(estado.fechaHoy);
  const debePremiar = cumplida && !yaPremiadaHoy;

  return {
    retoCompletado,
    fichaCompletada,
    pasosCompletados,
    totalPasos: 2,
    progresoFraccion: pasosCompletados / 2,
    cumplida,
    yaPremiadaHoy,
    debePremiar,
    xpOtorgar: debePremiar ? XP_BONUS_META_DIARIA : 0,
  };
}

/**
 * Evaluación anti-farmeo para preguntas y actividades.
 * Impide recibir XP por la misma pregunta en el mismo día y respeta el tope diario de la actividad.
 */
export interface AntiFarmeoParams {
  preguntaId?: string;
  preguntasRespondidasHoy?: string[];
  xpAcumuladaHoy: number;
  tipoActividad?: TipoActividad;
  puntosPorAcierto?: number;
}

export interface AntiFarmeoResult {
  puedeOtorgar: boolean;
  puntosOtorgados: number;
  motivoBloqueo?: 'pregunta_duplicada_hoy' | 'tope_diario_alcanzado';
}

export function evaluarAntiFarmeo({
  preguntaId,
  preguntasRespondidasHoy = [],
  xpAcumuladaHoy,
  tipoActividad = 'reto_diario',
  puntosPorAcierto = 50,
}: AntiFarmeoParams): AntiFarmeoResult {
  if (preguntaId && preguntasRespondidasHoy.includes(preguntaId)) {
    return {
      puedeOtorgar: false,
      puntosOtorgados: 0,
      motivoBloqueo: 'pregunta_duplicada_hoy',
    };
  }

  const tope =
    TOPES_DIARIOS_XP[tipoActividad as keyof typeof TOPES_DIARIOS_XP] ??
    TOPES_DIARIOS_XP.default;

  const xpDisponible = Math.max(0, tope - xpAcumuladaHoy);

  if (xpDisponible <= 0) {
    return {
      puedeOtorgar: false,
      puntosOtorgados: 0,
      motivoBloqueo: 'tope_diario_alcanzado',
    };
  }

  const puntosOtorgados = Math.min(puntosPorAcierto, xpDisponible);

  return {
    puedeOtorgar: puntosOtorgados > 0,
    puntosOtorgados,
  };
}

/**
 * Catálogo completo de Logros (mínimo 15, aquí 16 logros bien estructurados).
 */
export interface LogroCatalogoItem {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string; // Nombre de icono o emoji ilustrativo
  categoria: 'aprendizaje' | 'constancia' | 'exploracion' | 'maestria';
  xpRecompensa: number;
  orden: number;
}

export const CATALOGO_LOGROS: readonly LogroCatalogoItem[] = [
  {
    id: 'primer_quiz',
    titulo: 'Primer Quiz Resuelto',
    descripcion: 'Completa tu primer cuestionario sobre enfermedades no transmisibles.',
    icono: 'quiz',
    categoria: 'aprendizaje',
    xpRecompensa: 50,
    orden: 1,
  },
  {
    id: 'quiz_perfecto',
    titulo: 'Precisión Quirúrgica',
    descripcion: 'Consigue una calificación perfecta (100% de aciertos) en un quiz.',
    icono: 'star',
    categoria: 'maestria',
    xpRecompensa: 100,
    orden: 2,
  },
  {
    id: 'explorador_total',
    titulo: 'Enciclopedia Viviente',
    descripcion: 'Lee las 7 fichas completas de enfermedades no transmisibles.',
    icono: 'book',
    categoria: 'exploracion',
    xpRecompensa: 150,
    orden: 3,
  },
  {
    id: 'primer_reto',
    titulo: 'Primer Desafío',
    descripcion: 'Responde tu primer mini-reto de salud.',
    icono: 'target',
    categoria: 'aprendizaje',
    xpRecompensa: 40,
    orden: 4,
  },
  {
    id: 'cinco_retos_dia',
    titulo: 'Mente Imparable',
    descripcion: 'Responde 5 retos en un solo día.',
    icono: 'lightning',
    categoria: 'constancia',
    xpRecompensa: 100,
    orden: 5,
  },
  {
    id: 'racha_3',
    titulo: 'Inicio Firme',
    descripcion: 'Mantén una racha activa de 3 días consecutivos.',
    icono: 'flame',
    categoria: 'constancia',
    xpRecompensa: 60,
    orden: 6,
  },
  {
    id: 'racha_7',
    titulo: 'Semana Invicta',
    descripcion: 'Alcanza una racha de 7 días consecutivos aprendiendo salud.',
    icono: 'flame',
    categoria: 'constancia',
    xpRecompensa: 120,
    orden: 7,
  },
  {
    id: 'racha_14',
    titulo: 'Hábito de Hierro',
    descripcion: 'Consigue una racha de 14 días activos ininterrumpidos.',
    icono: 'shield',
    categoria: 'constancia',
    xpRecompensa: 200,
    orden: 8,
  },
  {
    id: 'racha_30',
    titulo: 'Constancia Legendaria',
    descripcion: 'Mantén tu racha durante 30 días seguidos cuidando tu bienestar.',
    icono: 'trophy',
    categoria: 'constancia',
    xpRecompensa: 350,
    orden: 9,
  },
  {
    id: 'asistente_curioso',
    titulo: 'Consulta Médica',
    descripcion: 'Hazle al menos una pregunta al Asistente de Salud Escolar.',
    icono: 'chat',
    categoria: 'exploracion',
    xpRecompensa: 50,
    orden: 10,
  },
  {
    id: 'primera_evaluacion',
    titulo: 'Conociendo mi Salud',
    descripcion: 'Realiza tu primera evaluación orientativa de IMC según OMS.',
    icono: 'heart',
    categoria: 'exploracion',
    xpRecompensa: 75,
    orden: 11,
  },
  {
    id: 'meta_diaria_1',
    titulo: 'Primera Meta de 3 Min',
    descripcion: 'Completa por primera vez tu meta diaria (1 mini-reto + 1 ficha).',
    icono: 'check-circle',
    categoria: 'constancia',
    xpRecompensa: 50,
    orden: 12,
  },
  {
    id: 'meta_diaria_5',
    titulo: 'Ritmo Saludable',
    descripcion: 'Cumple tu meta diaria de 3 minutos en 5 días diferentes.',
    icono: 'award',
    categoria: 'constancia',
    xpRecompensa: 100,
    orden: 13,
  },
  {
    id: 'congelador_salvador',
    titulo: 'Escudo Protector',
    descripcion: 'Utiliza tu congelador semanal para proteger tu racha.',
    icono: 'snowflake',
    categoria: 'constancia',
    xpRecompensa: 50,
    orden: 14,
  },
  {
    id: 'nivel_5',
    titulo: 'Guardián Activo',
    descripcion: 'Alcanza el Nivel 5 y asume el rango de Guardián de la Salud.',
    icono: 'medal',
    categoria: 'maestria',
    xpRecompensa: 150,
    orden: 15,
  },
  {
    id: 'nivel_10',
    titulo: 'Maestro de Vida',
    descripcion: 'Alcanza el prestigioso Nivel 10 como Maestro de Vida Saludable.',
    icono: 'crown',
    categoria: 'maestria',
    xpRecompensa: 300,
    orden: 16,
  },
] as const;

export const TOTAL_ENFERMEDADES_SISTEMA = 7;

/**
 * Estado del usuario necesario para evaluar logros desbloqueables.
 */
export interface EstadoUsuarioParaLogros {
  quizzesCompletados: number;
  tieneQuizPerfecto: boolean;
  enfermedadesLeidasIds: string[];
  totalRetosRespondidos: number;
  retosRespondidosHoy: number;
  rachaActual: number;
  rachaMaxima: number;
  asistenteUsado: boolean;
  evaluacionesCompletadas: number;
  metasDiariasCumplidas: number;
  congeladorUsado: boolean;
  nivel: number;
  logrosYaDesbloqueados: string[]; // IDs de logros que ya posee el usuario
}

/**
 * Función pura que evalúa el estado del usuario y retorna los logros que se desbloquean en esta evaluación.
 */
export function evaluarLogros(estado: EstadoUsuarioParaLogros): LogroCatalogoItem[] {
  const yaDesbloqueadosSet = new Set(estado.logrosYaDesbloqueados || []);
  const nuevos: LogroCatalogoItem[] = [];

  const verificar = (id: string, condicion: boolean) => {
    if (condicion && !yaDesbloqueadosSet.has(id)) {
      const logro = CATALOGO_LOGROS.find((l) => l.id === id);
      if (logro) {
        nuevos.push(logro);
      }
    }
  };

  // 1. Quizzes
  verificar('primer_quiz', (estado.quizzesCompletados || 0) >= 1);
  verificar('quiz_perfecto', Boolean(estado.tieneQuizPerfecto));

  // 2. Exploración (7 enfermedades leídas)
  const enfermedadesUnicas = new Set(estado.enfermedadesLeidasIds || []);
  verificar('explorador_total', enfermedadesUnicas.size >= TOTAL_ENFERMEDADES_SISTEMA);

  // 3. Retos
  verificar('primer_reto', (estado.totalRetosRespondidos || 0) >= 1);
  verificar('cinco_retos_dia', (estado.retosRespondidosHoy || 0) >= 5);

  // 4. Rachas
  const maxRacha = Math.max(estado.rachaActual || 0, estado.rachaMaxima || 0);
  verificar('racha_3', maxRacha >= 3);
  verificar('racha_7', maxRacha >= 7);
  verificar('racha_14', maxRacha >= 14);
  verificar('racha_30', maxRacha >= 30);

  // 5. Asistente y Evaluación
  verificar('asistente_curioso', Boolean(estado.asistenteUsado));
  verificar('primera_evaluacion', (estado.evaluacionesCompletadas || 0) >= 1);

  // 6. Meta diaria
  verificar('meta_diaria_1', (estado.metasDiariasCumplidas || 0) >= 1);
  verificar('meta_diaria_5', (estado.metasDiariasCumplidas || 0) >= 5);

  // 7. Congelador
  verificar('congelador_salvador', Boolean(estado.congeladorUsado));

  // 8. Niveles
  verificar('nivel_5', (estado.nivel || 1) >= 5);
  verificar('nivel_10', (estado.nivel || 1) >= 10);

  return nuevos;
}

/**
 * Algoritmo Fisher-Yates (Knuth) para desordenar arreglos de manera uniforme e imparcial.
 * No muta el arreglo original.
 */
export function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Genera opciones para una pregunta garantizando que los distractores pertenezcan
 * a candidatos válidos, no repitan la respuesta correcta ni entre sí, y se mezclen con Fisher-Yates.
 */
export function generarOpcionesConDistractores<T>(
  correcta: T,
  candidatosDistractores: readonly T[],
  cantidadOpciones: number = 4
): T[] {
  const filtrados = candidatosDistractores.filter((item) => item !== correcta);
  const distractoresUnicos = Array.from(new Set(filtrados));
  const desordenados = fisherYatesShuffle(distractoresUnicos);
  const seleccionados = desordenados.slice(0, Math.max(0, cantidadOpciones - 1));

  return fisherYatesShuffle([correcta, ...seleccionados]);
}
