// src/data/estadisticasENDES.ts
/**
 * Datos estadísticos oficiales de la Encuesta Demográfica y de Salud Familiar (ENDES 2024 - 2025)
 * Instituto Nacional de Estadística e Informática (INEI) y Ministerio de Salud (MINSA) Perú.
 */

export interface IndicadorDNT {
  id: string;
  titulo: string;
  valorNacional: number; // Porcentaje %
  unidad: string;
  tendencia: 'up' | 'down' | 'neutral';
  cambioReciente: string;
  categoria: 'Cardiovascular' | 'Metabólica' | 'Nutrición' | 'Estilo de Vida' | 'Salud Mental';
  descripcion: string;
  metaOMS: string;
  datosRegionales: { region: string; valor: number }[];
  datosEdad: { grupo: string; valor: number }[];
  icono: string;
  color: string;
}

export const INDICADORES_DNT_PERU: IndicadorDNT[] = [
  {
    id: 'hipertension',
    titulo: 'Hipertensión Arterial',
    valorNacional: 22.1,
    unidad: '%',
    tendencia: 'up',
    cambioReciente: '+1.5% respecto a 2019',
    categoria: 'Cardiovascular',
    descripcion: 'Población de 15 y más años de edad con presión arterial alta medida (≥140/90 mmHg) o diagnosticada por médico.',
    metaOMS: '< 15% de prevalencia no controlada',
    datosRegionales: [
      { region: 'Lima Metropolitana', valor: 25.1 },
      { region: 'Resto Costa', valor: 23.8 },
      { region: 'Selva', valor: 19.5 },
      { region: 'Sierra', valor: 18.2 }
    ],
    datosEdad: [
      { grupo: '15 - 19 años', valor: 4.8 },
      { grupo: '20 - 29 años', valor: 11.2 },
      { grupo: '30 - 49 años', valor: 21.6 },
      { grupo: '50+ años', valor: 43.4 }
    ],
    icono: 'heart-pulse',
    color: '#EF4444' // Rojo cardio
  },
  {
    id: 'exceso_peso',
    titulo: 'Exceso de Peso (Sobrepeso + Obesidad)',
    valorNacional: 63.1,
    unidad: '%',
    tendencia: 'up',
    cambioReciente: '+3.2% en última década',
    categoria: 'Nutrición',
    descripcion: 'Personas con Índice de Masa Corporal (IMC) ≥ 25 kg/m². En adolescentes, la tasa de sobrepeso alcanza el 38.4%.',
    metaOMS: 'Frenar el aumento del sobrepeso infantil y adolescente',
    datosRegionales: [
      { region: 'Lima Metropolitana', valor: 67.8 },
      { region: 'Resto Costa', valor: 65.2 },
      { region: 'Selva', valor: 59.4 },
      { region: 'Sierra', valor: 56.1 }
    ],
    datosEdad: [
      { grupo: '12 - 17 años (Adolescentes)', valor: 38.4 },
      { grupo: '18 - 29 años (Jóvenes)', valor: 54.7 },
      { grupo: '30 - 49 años', valor: 69.2 },
      { grupo: '50+ años', valor: 66.8 }
    ],
    icono: 'scale-balance',
    color: '#F59E0B' // Ámbar
  },
  {
    id: 'diabetes',
    titulo: 'Diabetes Mellitus Diagnosticada',
    valorNacional: 5.3,
    unidad: '%',
    tendencia: 'up',
    cambioReciente: '+0.8% respecto a años previos',
    categoria: 'Metabólica',
    descripcion: 'Personas diagnosticadas con diabetes mellitus. El 68.2% de quienes conocen su diagnóstico reciben tratamiento médico.',
    metaOMS: 'Acceso al 100% de tratamiento y control glicémico',
    datosRegionales: [
      { region: 'Lima Metropolitana', valor: 6.4 },
      { region: 'Resto Costa', valor: 5.9 },
      { region: 'Selva', valor: 4.8 },
      { region: 'Sierra', valor: 3.9 }
    ],
    datosEdad: [
      { grupo: '15 - 29 años', valor: 1.4 },
      { grupo: '30 - 49 años', valor: 4.6 },
      { grupo: '50 - 59 años', valor: 9.8 },
      { grupo: '60+ años', valor: 14.2 }
    ],
    icono: 'water-percent',
    color: '#00F5D4' // Neon Mint
  },
  {
    id: 'frutas_verduras',
    titulo: 'Consumo Adecuado de Frutas y Verduras',
    valorNacional: 11.4,
    unidad: '%',
    tendencia: 'down',
    cambioReciente: 'Apenas 1 de cada 10 cumple la meta',
    categoria: 'Nutrición',
    descripcion: 'Personas que consumen diariamente al menos 5 porciones (400 gramos) de frutas y/o ensalada de verduras.',
    metaOMS: 'Consumo mínimo diario de 400g (5 porciones) en el 100% de la población',
    datosRegionales: [
      { region: 'Lima Metropolitana', valor: 13.6 },
      { region: 'Resto Costa', valor: 11.2 },
      { region: 'Sierra', valor: 10.5 },
      { region: 'Selva', valor: 9.8 }
    ],
    datosEdad: [
      { grupo: '15 - 19 años', valor: 9.8 },
      { grupo: '20 - 29 años', valor: 10.4 },
      { grupo: '30 - 49 años', valor: 11.8 },
      { grupo: '50+ años', valor: 12.9 }
    ],
    icono: 'food-apple',
    color: '#10B981' // Esmeralda
  },
  {
    id: 'tabaco_alcohol',
    titulo: 'Consumo de Tabaco y Alcohol de Riesgo',
    valorNacional: 18.5,
    unidad: '%',
    tendencia: 'neutral',
    cambioReciente: 'Tabaquismo: 10.8% | Consumo excesivo alcohol: 18.5%',
    categoria: 'Estilo de Vida',
    descripcion: 'Población con episodios de consumo excesivo de alcohol en el último mes o tabaquismo activo frecuente.',
    metaOMS: 'Reducción del 30% en consumo de tabaco al 2030',
    datosRegionales: [
      { region: 'Lima Metropolitana', valor: 21.4 },
      { region: 'Resto Costa', valor: 18.7 },
      { region: 'Selva', valor: 17.6 },
      { region: 'Sierra', valor: 16.2 }
    ],
    datosEdad: [
      { grupo: '15 - 19 años', valor: 8.9 },
      { grupo: '20 - 29 años', valor: 24.1 },
      { grupo: '30 - 49 años', valor: 20.3 },
      { grupo: '50+ años', valor: 14.5 }
    ],
    icono: 'glass-wine',
    color: '#8B5CF6' // Violeta
  },
  {
    id: 'salud_mental',
    titulo: 'Salud Mental (Síntomas Depresivos)',
    valorNacional: 14.8,
    unidad: '%',
    tendencia: 'up',
    cambioReciente: 'Mayor prevalencia en adolescentes y mujeres',
    categoria: 'Salud Mental',
    descripcion: 'Población que reporta síntomas asociados a episodios depresivos en los últimos 14 días (evaluado con PHQ-9 en ENDES).',
    metaOMS: 'Cobertura universal de salud mental comunitaria y tamizaje 96150',
    datosRegionales: [
      { region: 'Lima Metropolitana', valor: 16.9 },
      { region: 'Resto Costa', valor: 14.2 },
      { region: 'Sierra', valor: 13.8 },
      { region: 'Selva', valor: 13.1 }
    ],
    datosEdad: [
      { grupo: '12 - 17 años (Adolescentes)', valor: 15.6 },
      { grupo: '18 - 29 años (Jóvenes)', valor: 16.8 },
      { grupo: '30 - 49 años', valor: 14.1 },
      { grupo: '50+ años', valor: 13.2 }
    ],
    icono: 'brain',
    color: '#EC4899' // Rosa Neón
  }
];

export const MANUALES_OFICIALES_MINSA = [
  {
    id: 'manual_eva',
    titulo: 'Manual de Salud Integral del Adolescente',
    resolucion: 'NTS N° 157-MINSA/2020/DGIESP',
    entidad: 'Ministerio de Salud del Perú',
    anno: '2020',
    etapa: 'Etapa de Vida Adolescente (12 a 17 años)',
    descripcion: 'Establece los criterios técnicos y procedimientos para la atención integral y diferenciada del adolescente en establecimientos de salud públicos y privados.',
    pilares: [
      'Evaluación del Crecimiento y Estado Nutricional (IMC, Talla, Perímetro Abdominal)',
      'Tamizaje de Riesgo Psicosocial y Salud Mental (Código 96150)',
      'Salud Sexual y Reproductiva + Vacunación VPH (Código 99384)',
      'Salud Bucal y Ocular Integral (Snellen y Fluorización)',
      'Paquete Básico de Atención Integral del Adolescente'
    ],
    color: '#00F5D4'
  },
  {
    id: 'manual_dnt_2025',
    titulo: 'Manual de Componentes de Prevención de DNT',
    resolucion: 'Programa Presupuestal 0018 - MINSA',
    entidad: 'Dirección de Prevención de Enfermedades No Transmisibles',
    anno: '2025',
    etapa: 'Población General, Jóvenes y Adultos',
    descripcion: 'Manual operativo para la detección temprana, tamizaje laboratorial, manejo clínico y control de hipertensión arterial, diabetes mellitus y riesgo cardiovascular en el Perú.',
    pilares: [
      'Tamizaje universal de Presión Arterial en toda consulta (Código R030)',
      'Control de Glucosa en Ayunas y Perfil Lipídico (Sub-producto 5001508)',
      'Guía Clínica de Abordaje del Accidente Cerebrovascular (Escala CAMALEÓN/FAST)',
      'Prevención de Enfermedad Renal Crónica (Tasa de Filtración CKD-EPI)',
      'Promoción de Estilos de Vida Saludables y Nutrición Preventiva'
    ],
    color: '#38BDF8'
  }
];
