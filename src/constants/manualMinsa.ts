export interface TemaManual {
  id: string;
  titulo: string;
  contenido: string;
  subtemas?: TemaManual[];
  codigoHIS?: string; // código del Sistema HIS
}

export const MANUAL_MINSA: TemaManual[] = [
  {
    id: 'presentacion',
    titulo: 'Presentación',
    contenido: 'Este manual (NTS Nº 157-MINSA/2019/DGIESP, R.M. 1001-2019-MINSA) establece los lineamientos técnicos para el registro y codificación de las actividades de atención integral de salud de los adolescentes. Emitido en noviembre 2020 por la Dirección General de Intervenciones Estratégicas en Salud Pública (DGIESP) y la Oficina General de Tecnologías de la Información (OGTI) del MINSA.',
  },
  {
    id: 'actividades_frecuentes',
    titulo: 'Actividades más Frecuentes (Códigos HIS)',
    contenido: 'El sistema HIS registra las atenciones del adolescente con códigos específicos para cada actividad preventiva y de diagnóstico.',
    subtemas: [
      {
        id: 'cod_z003',
        titulo: 'Z003 — Examen del Estado de Desarrollo del Adolescente',
        contenido: 'Código principal para registrar la evaluación del desarrollo integral. Siempre es el primer código en el casillero de atención.',
        codigoHIS: 'Z003',
      },
      {
        id: 'cod_99384',
        titulo: '99384 — Evaluación Integral del Adolescente',
        contenido: 'Evaluación completa de las tres áreas: psicosocial, sexual y física-nutricional. Debe entregarse en mínimo 3 sesiones.',
        codigoHIS: '99384',
      },
      {
        id: 'cod_c8002',
        titulo: 'C8002 — Plan de Atención Integral de Salud',
        contenido: 'Registro del Plan de Atención Integral Individualizado del adolescente, elaborado según sus necesidades y expectativas.',
        codigoHIS: 'C8002',
      },
      {
        id: 'cod_ups',
        titulo: 'UPS 302304 — Servicios Diferenciados para Adolescentes',
        contenido: 'Código obligatorio que identifica todas las actividades realizadas con la población adolescente en el establecimiento de salud.',
        codigoHIS: 'UPS 302304',
      },
    ]
  },
  {
    id: 'instrucciones_generales',
    titulo: 'Instrucciones Generales para el Registro',
    contenido: 'Normas para el correcto llenado del formato HIS y la codificación de las actividades de atención integral.',
    subtemas: [
      {
        id: 'tipo_diagnostico',
        titulo: 'Tipo de Diagnóstico',
        contenido: '"D" = Diagnóstico Definitivo (primera vez que se establece). "R" = Repetido (en controles siguientes). "P" = Presuntivo (sospecha sin confirmación). El Plan de Atención siempre se marca "D".',
      },
      {
        id: 'campo_lab',
        titulo: 'Campo LAB (Laboratorio)',
        contenido: 'Se usa para registrar: número de sesión (1, 2, 3...), resultados de hemoglobina, glucosa, presión arterial. También valores como "PC" (paciente controlado), "ALT" (alterado), "URG" (urgencia).',
      },
    ]
  },
  {
    id: 'atencion_salud',
    titulo: 'Atención de Salud Integral',
    contenido: 'La atención integral del adolescente debe abordarse siempre anotando el código UPS 302304 del Servicio Diferenciado.',
    subtemas: [
      {
        id: 'plan_iniciado',
        titulo: 'Plan Atención Integral Iniciado',
        contenido: 'Inicio del Plan Individualizado en el establecimiento de salud (E.S.) o institución educativa (I.E.). Registrar: 1º casillero Z003, 2º casillero 99384, 3º diagnóstico motivo de consulta, 4º casillero C8002.',
      },
      {
        id: 'plan_concluido',
        titulo: 'Plan Atención Integral Concluido',
        contenido: 'Culminación exitosa de todas las intervenciones programadas cuando el adolescente ha completado el Paquete de Atención Integral. Puede ser concluido por cualquier integrante del equipo multidisciplinario.',
      },
      {
        id: 'sesiones_minimas',
        titulo: 'Mínimo 3 Sesiones Obligatorias',
        contenido: 'El Paquete de Atención Integral debe entregarse en mínimo 3 sesiones, abarcando las 3 áreas: psicosocial, sexual y física-nutricional. En el campo LAB se registra el número de sesión (1, 2, 3...).',
      }
    ]
  },
  {
    id: 'paquete_basico',
    titulo: 'Paquete Básico de Atención Integral',
    contenido: 'Conjunto de intervenciones esenciales garantizadas para todo adolescente en el sistema de salud del MINSA.',
    subtemas: [
      {
        id: 'area_sexual_basico',
        titulo: 'Área Salud Sexual y Reproductiva',
        contenido: 'Evaluación del Desarrollo Sexual de Tanner (99384.02), Consejería en Salud Sexual y Reproductiva (99402.03), consejería pre y post test de VIH (99401.33 / 99401.34), vacunación VPH (gratuita en colegios del Perú).',
        codigoHIS: '99402.03 · 99401.33 · 99401.34',
      },
      {
        id: 'inmunizaciones',
        titulo: 'Inmunizaciones',
        contenido: 'Vacunación según el esquema nacional vigente: VPH (gratuita en colegios), dT (difteria-tétanos), Hepatitis B. Se registra en el formato HIS con su código correspondiente.',
      },
      {
        id: 'area_psicosocial_basico',
        titulo: 'Área Salud Psicosocial',
        contenido: 'Tamizaje de salud mental (código 96150) que incluye: violencia, depresión y ansiedad, consumo de alcohol y drogas, psicosis e ideación suicida. También: Aplicación de cuestionario de habilidades sociales (96150.05).',
        codigoHIS: '96150 · 96150.05',
      },
      {
        id: 'area_fisica_basico',
        titulo: 'Área Salud Física y Nutricional',
        contenido: 'Peso y talla son OBLIGATORIOS en todas las sesiones. Incluye: Examen médico general (Z000), evaluación postural, agudeza visual y auditiva. En anemia: suplemento de hierro (60 mg) + ácido fólico (400 μg), 2 veces/semana para adolescentes mujeres de 12-17 años.',
        codigoHIS: 'Z000 · 85018',
      }
    ]
  },
  {
    id: 'sesiones_educativas',
    titulo: 'Sesiones Educativas por Áreas',
    contenido: 'Las sesiones educativas se codifican con el número de contenido y las iniciales del área. Se realizan para grupos de 12-14 años y 15-17 años con metodologías participativas.',
    subtemas: [
      {
        id: 'psa',
        titulo: 'PSA — Salud Física Nutricional (Contenidos 1-10)',
        contenido: '1=Actividad Física y Deporte, 2=Alimentación Saludable, 3=Higiene, 4=Prevención Trastornos Posturales, 5=Protección Solar, 6=Salud Bucal, 7=Salud Ocular, 8=Salud Respiratoria y TBC, 9=Cuidado del Medio Ambiente, 10=Prevención de Enfermedades.',
      },
      {
        id: 'ssi',
        titulo: 'SSI — Salud Sexual y Reproductiva (Contenidos 1-5)',
        contenido: 'Contenidos educativos sobre salud sexual y reproductiva para adolescentes, codificados como SSI 1, SSI 2... SSI 5. Se registra en el campo LAB el número de sesión y las iniciales SSI.',
      },
      {
        id: 'psi',
        titulo: 'PSI — Salud Psicosocial (Contenidos 1-10)',
        contenido: '1=Habilidades para la Vida (autoestima, asertividad, toma de decisiones), 2=Proyecto de Vida, 3=Resiliencia, 4=Rol del Adolescente en la Familia, y más. Se registra como PSI 1, PSI 2...',
      },
    ]
  },
  {
    id: 'otras_prestaciones',
    titulo: 'Otras Prestaciones y Actividades Complementarias',
    contenido: 'Actividades complementarias de prevención y promoción en la comunidad, escuela e institución educativa.',
    subtemas: [
      {
        id: 'habilidades_sociales',
        titulo: 'Taller de Habilidades Sociales',
        contenido: 'Aplicación de cuestionario (96150.05) y sesiones de talleres para fortalecer autoestima, asertividad y toma de decisiones. Se registra en el campo HIS con las iniciales PSI y el número de contenido.',
        codigoHIS: '96150.05',
      },
      {
        id: 'educadores_pares',
        titulo: 'C3152 — Formación de Educadores de Pares',
        contenido: 'Entrenamiento de adolescentes líderes para que compartan información de salud con sus compañeros. Código HIS: C3152.',
        codigoHIS: 'C3152',
      },
      {
        id: 'familias_fuertes',
        titulo: 'U1258 — Sesión de Familias Fuertes',
        contenido: 'Intervención familiar para prevenir conductas de riesgo en los adolescentes, fortaleciendo el vínculo afectivo y las competencias parentales.',
        codigoHIS: 'U1258',
      },
      {
        id: 'telemonitoreo',
        titulo: 'Telemedicina y Tele-interconsulta',
        contenido: 'Seguimiento a distancia de pacientes crónicos o de salud mental, e interconsulta con especialistas vía remota. Incluye teleorientación, telemonitoreo y teleinterconsulta.',
      },
    ]
  }
];

export const MANUAL_NO_TRANSMISIBLES: TemaManual[] = [
  {
    id: 'nt_prevencion',
    titulo: 'Prevención y Control — Daños No Transmisibles',
    contenido: 'El Componente de Prevención y Control de Daños No Transmisibles (DENOT-DGIESP-MINSA 2025) abarca actividades de valoración clínica, tamizaje laboratorial, tratamiento y control de enfermedades crónicas. Las intervenciones abarcan todo el curso de vida: niños, adolescentes, jóvenes, adultos y adultos mayores.',
  },
  {
    id: 'nt_valoracion',
    titulo: 'Valoración Clínica y Tamizaje Laboratorial',
    contenido: 'Sub-producto 5001508: Detección temprana de factores de riesgo en personas de 5 años a más. Incluye: a) Cálculo de IMC, b) Medición del perímetro abdominal, c) Valoración de estilos de vida, d) Medición de presión arterial (≥18 años), e) Consejería. Duración aproximada: 25 minutos.',
    subtemas: [
      {
        id: 'nt_val_menores',
        titulo: 'Valoración en Menores de Edad (5-17 años)',
        contenido: 'Evaluación de factores de riesgo: IMC según curvas de crecimiento, perímetro abdominal y valoración de estilos de vida. Tamizaje de glucemia y perfil lipídico cuando se identifican factores de riesgo.',
        codigoHIS: 'Z019',
      },
      {
        id: 'nt_val_jovenes',
        titulo: 'Valoración de 18 a 39 Años con Riesgo Elevado',
        contenido: 'Sub-producto 5001509: Tamizaje laboratorial que incluye dosaje de glucemia en plasma venoso y perfil lipídico completo (colesterol total, HDL, LDL calculado y triglicéridos). Resultado de "ALT" en campo LAB si hay factores de riesgo.',
        codigoHIS: 'Z017 · Z019',
      },
      {
        id: 'nt_val_adultos',
        titulo: 'Valoración de 40 Años a Más (Anual)',
        contenido: 'Sub-producto 5001510: Valoración clínica anual evaluando cambios en el nivel de riesgo. Complementar con tamizaje laboratorial. Estratificación de riesgo cardiovascular con calculadora HEARTS (40-75 años).',
        codigoHIS: 'Z017 · 99199.22 · 99199.23',
      }
    ]
  },
  {
    id: 'nt_hipertension',
    titulo: 'Tratamiento y Control — Hipertensión Arterial (Producto 3000016)',
    contenido: 'Manejo integral de pacientes con HTA. Meta de control: PA < 140/90 mmHg en población general; < 130/80 mmHg en alto riesgo cardiovascular. Paciente controlado = últimos 3 controles dentro de la meta terapéutica.',
    subtemas: [
      {
        id: 'nt_hta_urgencia',
        titulo: 'Urgencia Hipertensiva — R030',
        contenido: 'Urgencia: PA sistólica ≥180 mmHg o diastólica ≥110 mmHg sin daño de órgano blanco. Registrar R030 en primer casillero y "URG" en campo LAB. Emergencia: misma presión CON daño de órgano blanco.',
        codigoHIS: 'R030',
      },
      {
        id: 'nt_hta_riesgo',
        titulo: 'Riesgo Cardiovascular — 99199.23',
        contenido: 'Estratificación usando calculadora HEARTS. Sub-producto 5001608. En campo LAB registrar el valor numérico del riesgo. Evaluación al menos 1 vez al año en personas de 40-75 años.',
        codigoHIS: '99199.23',
      },
      {
        id: 'nt_hta_sindano',
        titulo: 'HTA Sin Daño de Órgano — Sub-producto 5001609',
        contenido: 'Controles de presión arterial por enfermería/técnico. En campo LAB: sistólica en columna 1, diastólica en columna 2. "PC" en LAB 1 = paciente controlado; LAB 2 = meses de tratamiento prescrito (máximo 3).',
        codigoHIS: 'I10X · 99199.22',
      },
      {
        id: 'nt_hta_especializado',
        titulo: 'Tratamiento Especializado (Categorías II-III)',
        contenido: 'Manejo en: UPSS Cardiología, Medicina Interna, Nefrología, Neurología, Rehabilitación y Cirugía Cardiovascular. Consulta médica de 20 min. cada 3 meses. Incluye evaluación de adherencia, efectos adversos y daño de órgano blanco.',
      },
      {
        id: 'nt_hta_educacion',
        titulo: 'Educación al Paciente (Sub-producto 5001605)',
        contenido: 'Sesión Educativa (C0009): máx. 15 personas, 30 min. Sesión Demostrativa (C0010): práctica. Grupo de Ayuda Mutua (C0012): apoyo entre pares. Registrar N° de participantes en campo LAB. APP100 en Historia Clínica.',
        codigoHIS: 'C0009 · C0010 · C0012',
      }
    ]
  },
  {
    id: 'nt_diabetes',
    titulo: 'Tratamiento y Control — Diabetes Mellitus (Producto 3000017)',
    contenido: 'Manejo de pacientes diabéticos. Paciente controlado: cumple 3 condiciones: 1) Sin retinopatía grave, 2) TFG ≥60 ml/min sin proteinuria, 3) Pie diabético Wagner 0 ó 1, 4) Sin antecedente cardiovascular conocido.',
    subtemas: [
      {
        id: 'nt_dm_basico',
        titulo: 'Diabetes Sin Daño de Órgano (Sub-producto 5001708)',
        contenido: 'Seguimiento: "PC" en LAB 1, meses de tratamiento en LAB 2 (máx. 3 meses). Glucosa en ayunas (82947) o Hemoglobina glucosilada (83036) como prueba de elección. Crisis hipo/hiperglucémica: código con 4° dígito "0" si hay coma.',
        codigoHIS: 'E109 · E119 · 82947 · 83036',
      },
      {
        id: 'nt_dm_especializado',
        titulo: 'Tratamiento Especializado (Sub-producto 5001704)',
        contenido: 'Atención en: Endocrinología, Cardiología, Nefrología, Neurología, Oftalmología. Para pacientes con complicaciones micro y macrovasculares. Control metabólico cada 3-6 meses en pacientes en meta terapéutica.',
      },
      {
        id: 'nt_dm_complicaciones',
        titulo: 'Valoración de Complicaciones (Sub-producto 5001705)',
        contenido: 'Al menos 1 vez al año: Retinopatía diabética (H360 / E113), Nefropatía: creatinina (82565) + microalbuminuria (82043/82044) con Tasa de Filtración Glomerular CKD-EPI 2021. Estadios renales: N181 (etapa 1) a N185 (etapa 5). Neuropatía: E104/E114.',
        codigoHIS: 'H360 · N181-N185 · 82565 · 82043',
      },
    ]
  },
  {
    id: 'nt_telemedicina',
    titulo: 'Telemedicina y Seguimiento a Distancia',
    contenido: 'Uso de tecnologías de información para el control remoto de pacientes con enfermedades crónicas. Permite ampliar el acceso oportuno a los servicios de salud.',
    subtemas: [
      {
        id: 'nt_tele_orientacion',
        titulo: 'Teleorientación — 99499.09',
        contenido: 'Evaluación y entrega de resultados a través de medios digitales. Permite resolver consultas sin desplazamiento al establecimiento de salud.',
        codigoHIS: '99499.09',
      },
      {
        id: 'nt_tele_seguimiento',
        titulo: 'Telemonitoreo — Seguimiento Crónico',
        contenido: 'Seguimiento virtual de pacientes con HTA y Diabetes Mellitus. Incluye registro de resultados de presión arterial y glucemia a distancia.',
      },
      {
        id: 'nt_tele_interconsulta',
        titulo: 'Teleinterconsulta — Teleconsultor/Teleconsultante',
        contenido: 'Coordinación entre profesionales de salud (teleconsultor y teleconsultante) para el manejo especializado de casos complejos sin necesidad de derivación física.',
      }
    ]
  }
];
