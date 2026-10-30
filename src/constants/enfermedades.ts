// src/constants/enfermedades.ts

export interface MitoVerdad {
  mito: string;
  verdad: string;
}

export interface GuiaNutricional {
  recomendado: string[];
  evitar: string[];
  consejoClave: string;
}

export interface PlanPrimerosAuxilios {
  titulo: string;
  pasos: string[];
  recomendacionUrgente: string;
}

export interface TratamientoManejo {
  enfoque: string[];
  metasControl: string[];
}

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export interface CasoClinicoEducativo {
  paciente: string;
  edad: string;
  motivoConsulta: string;
  evolucionYTratamiento: string;
  mensajeEducativo: string;
}

export interface EscalaRiesgo {
  nombre: string;
  paraQueSirve: string;
  parametrosClave: string[];
  interpretacion: string;
}

export interface SaludMentalImpacto {
  desafioEmocional: string;
  estigma: string;
  estrategiaAfrontamiento: string[];
}

export interface Enfermedad {
  id: string;
  nombre: string;
  categoria: string;
  subtitulo?: string;
  icono: string; 
  emoji: string;
  queEs: string;
  fisiopatologia?: string;
  causas: string[];
  sintomas: string[];
  sintomasAlarma?: string[];
  diagnostico?: string[];
  complicaciones?: string[];
  tratamiento?: TratamientoManejo;
  primerosAuxilios?: PlanPrimerosAuxilios;
  casoClinico?: CasoClinicoEducativo;
  escalaRiesgo?: EscalaRiesgo;
  saludMental?: SaludMentalImpacto;
  preguntasFrecuentes?: PreguntaFrecuente[];
  mitosYVerdades?: MitoVerdad[];
  guiaNutricional?: GuiaNutricional;
  prevencion: string[];
  cuandoConsultar: string;
  imagenUrl: string;
  estadistica: string;
  estadisticaValor: number;
  fuenteMinsa?: string;
  codigoCIE10?: string;
  nivelRiesgo?: 'Alto' | 'Moderado' | 'Preventivo';
  factoresRiesgo?: string[];
  indicadorPeru?: string;
  colorAcento?: string;
}

export const CATEGORIAS = [
  'Todas',
  'Enfermedades No Transmisibles (DNT)',
];

/**
 * Principales Enfermedades No Transmisibles (ENT / DNT)
 * según la Organización Mundial de la Salud (OMS) y el Ministerio de Salud del Perú (MINSA).
 */
export const ENFERMEDADES: Enfermedad[] = [
  {
    id: 'cardiovasculares',
    nombre: 'Enfermedades Cardiovasculares',
    subtitulo: 'Hipertensión Arterial, Infarto y Accidente Cerebrovascular (ACV)',
    categoria: 'Enfermedades No Transmisibles (DNT)',
    icono: 'pulse-outline',
    emoji: '❤️',
    nivelRiesgo: 'Alto',
    colorAcento: '#EF4444',
    indicadorPeru: '1ª causa de mortalidad (HTA afecta al 22.1% en Perú · ENDES)',
    factoresRiesgo: [
      'Consumo excesivo de sodio (más de 5g sal/día)',
      'Hipertensión arterial no controlada',
      'Sedentarismo y falta de ejercicio aeróbico',
      'Consumo de tabaco y vapeadores',
      'Colesterol LDL elevado y triglicéridos altos',
      'Estrés crónico y falta de descanso',
      'Sobrepeso y obesidad abdominal'
    ],
    queEs: 'Grupo de trastornos que afectan al músculo cardíaco y a los vasos sanguíneos coronarios y periféricos. Es la principal causa de muerte por ENT a nivel global. Abarca la Hipertensión Arterial Sistémica (CIE-10 I10), la Cardiopatía Isquémica e Infarto Agudo de Miocardio (CIE-10 I21) y los Accidentes Cerebrovasculares (ACV / Derrame Cerebral, CIE-10 I64).',
    fisiopatologia: 'El daño vascular comienza con la disfunción endotelial inducida por presiones intraluminales elevadas y acumulación de partículas lipídicas (colesterol LDL oxidado). Con el tiempo, se forman placas de ateroma en las arterias coronarias y cerebrales (aterosclerosis), provocando rigidez arterial, hipertrofia ventricular izquierda y eventual ruptura de placa con trombosis u oclusión arterial aguda.',
    causas: [
      'Presión arterial elevada sostenida sin tratamiento farmacológico ni cambios de estilo de vida',
      'Consumo excesivo de sodio en alimentos procesados, embutidos y comida rápida',
      'Tabaquismo activo o pasivo: el monóxido de carbono y la nicotina deterioran el endotelio vascular y aumentan la rigidez arterial',
      'Sedentarismo prolongado: menos de 150 minutos de actividad moderada a la semana',
      'Dislipidemia: concentraciones elevadas de colesterol LDL, colesterol total y triglicéridos en sangre',
      'Factores hereditarios y antecedentes familiares de infarto o ACV a edades tempranas',
      'Consumo nocivo y repetitivo de bebidas alcohólicas'
    ],
    sintomas: [
      'En fases iniciales suele ser completamente asintomática ("el asesino silencioso")',
      'Cefalea intensa matutina, predominantemente en la región de la nuca (occipital)',
      'Acúfenos (sensación de pitidos, zumbidos o silbidos en los oídos)',
      'Fosfenos (visión de puntos brillantes o destellos de luz)',
      'Mareos, vértigo transitorio y sensación de inestabilidad al levantarse',
      'Palpitaciones rápidas o sensación de latidos fuertes en el tórax',
      'Fatiga muscular desproporcionada ante pequeños esfuerzos habituales'
    ],
    sintomasAlarma: [
      'Dolor torácico opresivo ("sensación de pata de elefante sobre el pecho") con irradiación al brazo izquierdo, cuello o espalda por más de 5 minutos',
      'Signos de ACV agudo (Protocolo CAMALEÓN): Cara caída o asimétrica, Mano o brazo sin fuerza, Lengua o habla trabada e incomprensible',
      'Dificultad súbita y severa para respirar (disnea paroxística en reposo)',
      'Cifras de presión arterial iguales o superiores a 180/110 mmHg (Crisis Hipertensiva)',
      'Pérdida súbita del conocimiento o desmayo repentino (síncope)'
    ],
    diagnostico: [
      'Toma protocolizada de presión arterial con tensiómetro validado (al menos en 2 consultas independientes)',
      'Monitoreo Ambulatorio de Presión Arterial (MAPA / Holter de 24 horas)',
      'Perfil lipídico completo en ayunas (Colesterol Total, LDL, HDL, Triglicéridos)',
      'Electrocardiograma (ECG de 12 derivaciones) para evaluar ritmo y signos de sobrecarga ventricular',
      'Ecocardiograma transtorácico para medir función sistólica y grosor de paredes ventriculares',
      'Evaluación de fondo de ojo por oftalmología para descartar retinopatía hipertensiva'
    ],
    complicaciones: [
      'Infarto Agudo de Miocardio por oclusión total de arterias coronarias',
      'Accidente Cerebrovascular isquémico o hemorrágico con parálisis permanente',
      'Insuficiencia Cardíaca Congestiva con congestión pulmonar y edemas en miembros inferiores',
      'Enfermedad Renal Crónica avanzada por nefroangioesclerosis',
      'Aneurisma de aorta torácica o abdominal y riesgo de disección',
      'Deterioro cognitivo vascular y demencia por microinfartos cerebrales silenciosos'
    ],
    tratamiento: {
      enfoque: [
        'Cambios terapéuticos en el estilo de vida (dieta hiposódica DASH y ejercicio aeróbico regular)',
        'Farmacoterapia antihipertensiva protocolizada MINSA/HEARTS: IECA o ARA-II (ej. Enalapril o Losartán) + Calcioantagonistas (Amlodipino)',
        'Estatinas de alta intensidad (Atorvastatina) para reducir colesterol LDL y estabilizar placas ateromatosas',
        'Antiagregantes plaquetarios (Aspirina 100 mg) en prevención secundaria tras infarto o ACV bajo indicación médica'
      ],
      metasControl: [
        'Presión Arterial en consulta: menor a 130/80 mmHg en adultos y jóvenes',
        'Colesterol LDL: menor a 70 mg/dL en pacientes con riesgo cardiovascular alto',
        'Consumo de sodio: menor a 2 g diarios (< 5 g de sal)',
        'Circunferencia de cintura: menor a 90 cm en varones y 80 cm en mujeres'
      ]
    },
    primerosAuxilios: {
      titulo: 'Protocolo de Emergencia ante Sospecha de Infarto o ACV',
      pasos: [
        '1. Mantén la calma y sienta o recuesta a la persona con el torso semi-incorporado (a 45°).',
        '2. Llama inmediatamente al SAMU (Línea 106) o a los Bomberos (Línea 116). Informa la hora exacta en que iniciaron los síntomas.',
        '3. Si sospechas de ACV, aplica el test CAMALEÓN: pídele que sonría, que levante ambos brazos y que repita una frase sencilla.',
        '4. Afloja prendas apretadas (cuello de camisa, corbata, cinturón). Garantiza que haya aire fresco.',
        '5. NO le des alimentos, café ni automediques pastillas sublinguales si no conoces su presión con precisión.',
        '6. Si la persona pierde el conocimiento y no respira, inicia compresiones torácicas (RCP) de inmediato (100 a 120 por minuto).'
      ],
      recomendacionUrgente: 'El tiempo es músculo y cerebro. Cada minuto transcurrido salva millones de neuronas o células cardíacas.'
    },
    casoClinico: {
      paciente: 'Carlos M.',
      edad: '24 años (Universitario)',
      motivoConsulta: 'Acudió por zumbidos de oídos y dolor de nuca tras varias noches de desvelo consumiendo bebidas energizantes.',
      evolucionYTratamiento: 'En triaje presentó presión de 155/98 mmHg. El médico confirmó prehipertensión asociada a cafeína sintética, salchipapas de quiosco y estrés de exámenes. Al retirar energizantes y reducir sodio, su presión bajó a 120/78 mmHg.',
      mensajeEducativo: 'Los jóvenes no son inmunes: las bebidas energizantes con cafeína y la comida chatarra están generando crisis hipertensivas a edades muy tempranas.'
    },
    escalaRiesgo: {
      nombre: 'Calculadora de Riesgo Cardiovascular HEARTS / OPS Perú',
      paraQueSirve: 'Estima la probabilidad de sufrir un infarto o derrame cerebral en los próximos 10 años.',
      parametrosClave: ['Edad y sexo', 'Cifras de Presión Arterial Sistólica', 'Tabaquismo activo', 'Nivel de Colesterol Total o Glucosa en sangre', 'Presencia de Diabetes'],
      interpretacion: 'Riesgo Bajo (<10%), Moderado (10-20%), Alto (>20%). Permite iniciar tratamiento preventivo antes de que ocurra una catástrofe vascular.'
    },
    saludMental: {
      desafioEmocional: 'El estrés crónico activa el eje hipotálamo-hipófisis-suprarrenal, liberando cortisol y adrenalina que contraen las arterias día y noche.',
      estigma: 'Creer que "la presión alta solo le da a los abuelos enojones" retrasa el diagnóstico en jóvenes y adolescentes.',
      estrategiaAfrontamiento: [
        'Practicar respiración diafragmática profunda 10 minutos al día para activar el tono vagal relajante',
        'Desconexión digital al menos 1 hora antes de dormir para reducir la sobreestimulación simpática',
        'Paseos al aire libre en áreas verdes escolares o parques comunitarios'
      ]
    },
    preguntasFrecuentes: [
      {
        pregunta: '¿Puedo suspender la pastilla de la presión si ya me siento bien?',
        respuesta: 'No. La presión está normal precisamente porque el medicamento está funcionando. Suspenderla bruscamente puede causar un rebote hipertensivo peligroso y un infarto.'
      },
      {
        pregunta: '¿El café eleva la presión de manera peligrosa?',
        respuesta: 'El consumo moderado de café (1 a 2 tazas) genera una elevación muy leve y transitoria. Sin embargo, las bebidas energizantes con cafeína sintética concentrada y taurina sí representan un riesgo serio en adolescentes.'
      },
      {
        pregunta: '¿Cuál es la diferencia entre un infarto y un paro cardíaco?',
        respuesta: 'El infarto es un problema de "tubería" (una arteria que se tapa y falta oxígeno al músculo); el paro cardíaco es un problema "eléctrico" donde el corazón deja de bombear súbitamente.'
      }
    ],
    mitosYVerdades: [
      {
        mito: 'Si no siento mareos ni dolor de cabeza, mi presión arterial está normal.',
        verdad: 'Falso. La hipertensión arterial es habitualmente silenciosa durante años; la única forma de saberlo con certeza es medírsela periódicamente con un tensiómetro.'
      },
      {
        mito: 'Los jóvenes y adolescentes no sufren de presión alta ni de infartos.',
        verdad: 'Falso. El aumento del sobrepeso, el sedentarismo y las bebidas energizantes con alta cafeína han incrementado los casos de prehipertensión en escolares peruanos.'
      },
      {
        mito: 'La sal marina o rosada del Himalaya se puede consumir libremente porque es natural.',
        verdad: 'Falso. Químicamente contienen casi el mismo porcentaje de cloruro de sodio que la sal refinada y tienen el mismo efecto perjudicial en la presión.'
      }
    ],
    guiaNutricional: {
      recomendado: [
        'Pescados azules ricos en Omega-3 (bonito, caballa, jurel, anchoveta) al menos 2 veces por semana',
        'Verduras de hojas verdes ricas en potasio y magnesio (espinaca, acelga, brócoli)',
        'Frutas frescas enteras (plátano, manzana, naranja, fresas)',
        'Cereales andinos integrales con fibra (quinua, kiwicha, avena en grano)',
        'Consumir abundante agua natural (mínimo 2 litros diarios)'
      ],
      evitar: [
        'Embutidos procesados (hot dog, jamonada, tocino, salchichas) con alto contenido de sodio',
        'Sopas instantáneas, cubitos de caldo concentrado y sazonadores artificiales',
        'Snacks salados, papas fritas embolsadas y galletas con grasas trans',
        'Bebidas alcohólicas y refrescos azucarados embotellados'
      ],
      consejoClave: 'Adopta la regla de menos de 1 cucharadita rasa de sal al día (< 5 gramos) para toda tu comida familiar.'
    },
    prevencion: [
      'Reducir el consumo diario de sodio a menos de 2 gramos (equivalente a 5 gramos de sal de mesa)',
      'Realizar al menos 150 a 300 minutos semanales de actividad física aeróbica moderada (caminar rápido, correr, bailar, nadar o bicicleta)',
      'Eliminar totalmente el consumo de tabaco y mantenerse en espacios 100% libres de humo',
      'Mantener un Índice de Masa Corporal (IMC) saludable entre 18.5 y 24.9 kg/m²',
      'Monitorear la presión arterial de rutina en postas o centros MINSA al menos una vez al año',
      'Aprender técnicas de manejo del estrés y asegurar de 7 a 8 horas de sueño reparador cada noche'
    ],
    cuandoConsultar: 'Dolor opresivo en el pecho de más de 5 minutos, parálisis facial o debilidad repentina en un brazo o pierna, o presión mayor a 180/110 mmHg exige traslado inmediato a Emergencias.',
    imagenUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    estadistica: 'Causan 17.9 millones de muertes al año a nivel mundial (OMS). En el Perú, más de 5.5 millones de personas padecen de hipertensión arterial.',
    estadisticaValor: 22,
    fuenteMinsa: 'Guía de Práctica Clínica HTA y Riesgo Cardiovascular · MINSA 2025 · Iniciativa HEARTS Perú',
    codigoCIE10: 'I10 - I25, I64'
  },
  {
    id: 'cancer',
    nombre: 'Cáncer y Neoplasias',
    subtitulo: 'Cuello Uterino, Mama, Estómago, Próstata y Pulmón',
    categoria: 'Enfermedades No Transmisibles (DNT)',
    icono: 'ribbon-outline',
    emoji: '🎗️',
    nivelRiesgo: 'Alto',
    colorAcento: '#A855F7',
    indicadorPeru: '2ª causa de muerte en el Perú (+66,000 nuevos casos anuales · INEN)',
    factoresRiesgo: [
      'Consumo activo o pasivo de tabaco',
      'Infección por Virus del Papiloma Humano (VPH)',
      'Infección gástrica crónica por Helicobacter pylori',
      'Exposición solar excesiva a rayos ultravioleta (UV)',
      'Dieta pobre en fibra vegetal y rica en carnes ultraprocesadas',
      'Consumo regular y excesivo de alcohol',
      'Antecedentes oncológicos en familiares directos'
    ],
    queEs: 'Grupo amplio de enfermedades caracterizadas por la multiplicación acelerada y descontrolada de células anómalas que superan sus límites habituales, invadiendo tejidos adyacentes y propagándose a otros órganos mediante metástasis. Entre el 30% y el 50% de las neoplasias malignas son prevenibles mediante estilos de vida saludables, vacunas y chequeos tempranos.',
    fisiopatologia: 'Ocurre por acumulación de mutaciones genéticas y epigenéticas en protooncogenes y genes supresores de tumores (como p53). Estas mutaciones otorgan a las células la capacidad de evadir la apoptosis (muerte celular programada), inducir angiogénesis propia para nutrirse, eludir el sistema inmunitario y desarrollar potencial de invasión a través de la membrana basal vascular.',
    causas: [
      'Carcinógenos químicos: hidrocarburos aromáticos policíclicos presentes en el humo de tabaco y humo de leña',
      'Agentes infecciosos oncogénicos: VPH (cepas 16 y 18 causantes de cáncer de cuello uterino), Helicobacter pylori (cáncer de estómago) y virus de Hepatitis B y C',
      'Radiaciones ionizantes y no ionizantes: radiación solar ultravioleta sin fotoprotección adecuada (melanoma y carcinomas cutáneos)',
      'Dieta nociva con alto contenido de carnes curadas, embutidos ricos en nitrosaminas y consumo muy escaso de vegetales frescos',
      'Consumo frecuente de alcohol: el acetaldehído daña directamente el material genético celular',
      'Sobrepeso persistente y sedentarismo: generan un estado inflamatorio sistémico y aumento de factores de crecimiento como IGF-1'
    ],
    sintomas: [
      'Pérdida de peso involuntaria, notoria y rápida sin causa aparente (>5 kg en pocos meses)',
      'Cansancio extremo y fatiga persistente que no cede con el reposo (astenia neoplásica)',
      'Aparición de nódulos, masas o bultos palpables e indoloros en mamas, cuello, axilas o ingles',
      'Cambios sospechosos en lunares previos según la regla ABCDE (Asimetría, Bordes irregulares, Color no homogéneo, Diámetro >6mm, Evolución rápida)',
      'Tos persistente o ronquera de más de 3 a 4 semanas sin cuadro gripal previo',
      'Dificultad o dolor al tragar alimentos (disfagia progresiva)',
      'Alteraciones prolongadas en el ritmo intestinal (estreñimiento o diarrea alternantes) o en la micción'
    ],
    sintomasAlarma: [
      'Tos con expectoración sanguinolenta (hemoptisis)',
      'Hemorragia o sangrado vaginal fuera del periodo menstrual o posterior a la menopausia',
      'Heces oscuras alquitranadas con sangre digerida (melena) o sangrado rectal franco',
      'Presencia de una úlcera o herida en la piel, labios o mucosa bucal que no cicatriza tras 3 semanas',
      'Ganglio linfático pétreo, fijo a planos profundos y de crecimiento progresivo',
      'Dolor óseo focalizado profundo de aparición nocturna'
    ],
    diagnostico: [
      'Papanicolaou (PAP) y prueba molecular de detección de ADN del Virus del Papiloma Humano (VPH)',
      'Mamografía digital bilateral a partir de los 40-50 años y ecografía mamaria complementaria',
      'Endoscopía digestiva alta para detección temprana de lesiones premalignas y cáncer gástrico',
      'Dosaje de Antígeno Prostático Específico (PSA) en sangre y examen clínico prostático anual en varones',
      'Biopsia tisular con estudio anatomopatológico e inmunohistoquímica (estándar de oro confirmatorio)',
      'Tomografía axial computarizada (TAC), resonancia magnética o PET-CT para estadiaje tumoral'
    ],
    complicaciones: [
      'Metástasis a distancia en órganos vitales (hígado, pulmón, esqueleto óseo y sistema nervioso central)',
      'Caquexia tumoral con consunción muscular severa y desnutrición avanzada',
      'Insuficiencia de médula ósea (anemia severa, plaquetopenia con hemorragias, neutropenia infecciosa)',
      'Compresión de estructuras vitales (médula espinal, vías biliares, vía aérea superior)',
      'Trombosis venosa profunda y tromboembolismo pulmonar paraneoplásico'
    ],
    tratamiento: {
      enfoque: [
        'Comité multidisciplinario oncológico (Oncología médica, Cirugía oncológica y Radioterapia)',
        'Cirugía oncológica resectiva con márgenes libres y vaciamiento ganglionar protocolizado',
        'Quimioterapia sistémica adyuvante o neoadyuvante según estirpe histológica',
        'Radioterapia tridimensional o conformada para control local tumoral',
        'Terapias dirigidas, inmunoterapia (inhibidores de checkpoint) y terapia hormonal (tamoxifeno, etc.)',
        'Cuidados paliativos y manejo integral del dolor crónico oncológico desde etapas tempranas'
      ],
      metasControl: [
        'Resección quirúrgica R0 (sin células tumorales residuales en bordes microscópicos)',
        'Remisión completa clínica e imagenológica evaluada por criterios RECIST',
        'Control estricto de sintomatología y calidad de vida integral del paciente',
        'Seguimiento oncológico estricto cada 3 a 6 meses los primeros 5 años'
      ]
    },
    primerosAuxilios: {
      titulo: 'Manejo Inicial ante Complicaciones Oncológicas Agudas',
      pasos: [
        '1. Si un paciente en quimioterapia presenta fiebre ≥ 38°C, se trata de una Neutropenia Febril: trasládalo de inmediato a Emergencias (riesgo de sepsis grave).',
        '2. En caso de sangrado activo por boca o apósito quirúrgico, aplica presión firme con gasa estéril y acude al centro médico.',
        '3. Si manifiesta debilidad súbita en piernas o pérdida de control de esfínteres, sospecha de compresión medular y evita manipular la columna.',
        '4. Mantén al paciente cómodo, en un ambiente higiénico y aislado de personas con infecciones respiratorias.',
        '5. Ten a la mano la libreta de citas, informe anatomopatológico y último hemograma.'
      ],
      recomendacionUrgente: 'La fiebre en un paciente con quimioterapia es una emergencia médica absoluta que no puede esperar.'
    },
    casoClinico: {
      paciente: 'Valeria R.',
      edad: '14 años (Colegial en Junín)',
      motivoConsulta: 'Campaña de vacunación escolar MINSA contra el VPH; sus padres dudaban por mitos de internet.',
      evolucionYTratamiento: 'El médico del centro de salud explicó con evidencia científica que la vacuna previene el 90% de cánceres de cuello uterino y verrugas genitales. Valeria recibió su dosis sin efectos secundarios.',
      mensajeEducativo: 'La prevención del cáncer empieza en la adolescencia con la vacuna contra el VPH: es la única vacuna del mundo que previene directamente un cáncer.'
    },
    escalaRiesgo: {
      nombre: 'Regla Nemotécnica ABCDE del Melanoma Cutáneo',
      paraQueSirve: 'Diferencia lunares benignos comunes de neoplasias cutáneas malignas.',
      parametrosClave: [
        'A: Asimetría (una mitad no concuerda con la otra)',
        'B: Bordes (irregulares, festoneados o mal definidos)',
        'C: Color (no homogéneo: marrón, negro, rojo, blanco o azul)',
        'D: Diámetro (mayor a 6 milímetros, como el borrador de un lápiz)',
        'E: Evolución (cambio rápido de tamaño, forma o sangrado espontáneo)'
      ],
      interpretacion: 'La presencia de 2 o más criterios exige evaluación dermatológica urgente con dermatoscopía y biopsia.'
    },
    saludMental: {
      desafioEmocional: 'El impacto psicológico de la palabra "cáncer" genera frecuentemente angustia existencial, depresión reactiva y miedo a la desfiguración.',
      estigma: 'El falso mito de que "el cáncer es contagioso" o "un castigo" aísla socialmente a los pacientes en etapa de tratamiento.',
      estrategiaAfrontamiento: [
        'Psicooncología: terapia cognitivo-conductual orientada a la aceptación y regulación del miedo',
        'Grupos de apoyo de pacientes y sobrevivientes que comparten experiencias y resiliencia',
        'Comunicación asertiva con el equipo médico para disipar falsas expectativas'
      ]
    },
    preguntasFrecuentes: [
      {
        pregunta: '¿El cáncer es una enfermedad contagiosa?',
        respuesta: 'No. El cáncer nunca se contagia de persona a persona por contacto físico, abrazos, saliva ni compartir utensilios. Solo algunos virus que aumentan su riesgo (como el VPH) se transmiten por vía sexual.'
      },
      {
        pregunta: '¿El uso de desodorantes o sostenes con varilla causa cáncer de mama?',
        respuesta: 'No existe evidencia científica alguna que respalde esa creencia. Son mitos populares desmentidos por la OMS y los institutos oncológicos internacionales.'
      },
      {
        pregunta: '¿Por qué la quimioterapia hace que se caiga el cabello?',
        respuesta: 'Porque los medicamentos quimioterapéuticos atacan a todas las células de división rápida (como las tumorales) y temporalmente afectan los folículos pilosos. El cabello vuelve a crecer tras culminar el tratamiento.'
      }
    ],
    mitosYVerdades: [
      {
        mito: 'Un diagnóstico de cáncer equivale a una sentencia inevitable e inmediata de muerte.',
        verdad: 'Falso. Cuando se detecta a tiempo en estadios iniciales (I o in situ), más del 90% de los casos de cáncer de mama, cuello uterino y próstata se curan por completo.'
      },
      {
        mito: 'La vacuna contra el VPH solo es necesaria para mujeres adultas.',
        verdad: 'Falso. El MINSA vacuna gratuitamente a niñas y niños en edad escolar (a partir de los 9 años); previene el cáncer de cuello uterino, de pene, ano y garganta antes del inicio de la vida sexual.'
      },
      {
        mito: 'Si me hago una biopsia, el tumor "se va a regar o despertar" por todo el cuerpo.',
        verdad: 'Falso. La biopsia es un procedimiento médico seguro y el único método científico que permite saber el tipo exacto de tumor para iniciar el tratamiento correcto a tiempo.'
      }
    ],
    guiaNutricional: {
      recomendado: [
        'Consumir al menos 5 porciones al día entre frutas frescas y vegetales variados y coloridos',
        'Crucíferas ricas en sulforafano (brócoli, coliflor, coles de Bruselas)',
        'Alimentos ricos en licopeno y carotenos (tomates cocidos, zanahoria, camote amarillo)',
        'Cereales enteros y legumbres con abundante fibra prebiótica (lentejas, frijoles, avena)',
        'Uso culinario de cúrcuma natural, ajo y cebolla ricos en compuestos fitoquímicos'
      ],
      evitar: [
        'Carnes procesadas y embutidos con nitritos y nitratos (clasificados por OMS como carcinógenos del Grupo 1)',
        'Carnes muy carbonizadas o asadas directamente sobre brasas a temperaturas extremas',
        'Bebidas alcohólicas de cualquier graduación',
        'Comidas excesivamente saladas, ahumadas o fermentadas con mohos'
      ],
      consejoClave: 'La fibra vegetal acelera el tránsito digestivo reduciendo el contacto de carcinógenos con la mucosa del colon.'
    },
    prevencion: [
      'Vacunarse oportunamente contra el Virus del Papiloma Humano (VPH) en colegios o establecimientos MINSA',
      'No fumar y evitar exponerse al humo ajeno de tabaco o cigarrillos electrónicos',
      'Aplicar protector solar diario con FPS 50+, usando sombrero de ala ancha y lentes con filtro UV',
      'Acudir puntualmente a despistajes preventivos anuales (PAP, mamografía, endoscopía según edad)',
      'Mantener un peso adecuado y realizar ejercicio regular para reducir hormonas e inflamación pro-tumoral',
      'Limitar al máximo el consumo de alimentos ultraprocesados y carnes ahumadas'
    ],
    cuandoConsultar: 'La presencia de cualquier bulto o nódulo nuevo palpable, un lunar que cambia de forma o sangra, o una herida que no cicatriza en 3 semanas exige valoración médica inmediata.',
    imagenUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    estadistica: 'En estadios tempranos, más del 90% de los casos de cáncer más frecuentes son curables (INEN / MINSA). Más del 40% de casos se prevendrían cambiando hábitos.',
    estadisticaValor: 40,
    fuenteMinsa: 'Plan Nacional de Prevención y Control del Cáncer · MINSA 2024-2026 · INEN',
    codigoCIE10: 'C00 - C97'
  },
  {
    id: 'respiratorias',
    nombre: 'Enf. Respiratorias Crónicas',
    subtitulo: 'Asma Bronquial y Enfermedad Pulmonar Obstructiva Crónica (EPOC)',
    categoria: 'Enfermedades No Transmisibles (DNT)',
    icono: 'fitness-outline',
    emoji: '🫁',
    nivelRiesgo: 'Moderado',
    colorAcento: '#00F5D4',
    indicadorPeru: 'Alta prevalencia de asma en la Costa peruana (>15% en escolares · MINSA)',
    factoresRiesgo: [
      'Humo de tabaco directo e inhalación pasiva',
      'Inhalación de humo de biomasa (leña o carbón en cocinas rurales)',
      'Humedad relativa superior al 80% (proliferación de ácaros y mohos)',
      'Contaminación ambiental y partículas PM2.5 en avenidas urbanas',
      'Historial de atopia personal (rinitis alérgica, dermatitis atópica)',
      'Infecciones virales respiratorias recurrentes durante la infancia'
    ],
    queEs: 'Afecciones crónicas que comprometen las vías respiratorias y el parénquima pulmonar. Las principales son el Asma Bronquial (enfermedad inflamatoria crónica caracterizada por hiperreactividad bronquial y obstrucción reversible al flujo aéreo) y la Enfermedad Pulmonar Obstructiva Crónica - EPOC (destrucción alveolar y limitación permanente no reversible del flujo aéreo).',
    fisiopatologia: 'En el asma, la exposición a alérgenos o irritantes desencadena una cascada inmunológica de tipo Th2 con liberación de interleucinas (IL-4, IL-5, IL-13), desgranulación de mastocitos e infiltración eosinofílica, provocando edema de la mucosa bronquial, hipersecreción de moco espeso y broncoespasmo muscular. En la EPOC, el humo produce estrés oxidativo crónico con lisis de fibras elásticas alveolares (enfisema) y bronquiolitis obliterante.',
    causas: [
      'Exposición continua a aeroalérgenos domésticos: ácaros microscópicos del polvo (Dermatophagoides), descamación de mascotas y esporas de hongos',
      'Humo de tabaco: principal causa de la EPOC y agravante mayor de crisis asmáticas en niños expuestos al humo de padres fumadores',
      'Contaminación del aire en interiores por combustión de leña, bosta o carbón sin chimenea en zonas andinas y rurales',
      'Polución atmosférica en ciudades: dióxido de nitrógeno, ozono ambiental y material particulado fino proveniente del transporte vehicular',
      'Predisposición genética familiar a la atopia y antecedentes de rinitis o eccema infantil',
      'Cambios climáticos bruscos, aire frío y niveles elevados de humedad costera'
    ],
    sintomas: [
      'Sibilancias espiratorias: silbidos o pitidos audibles en el pecho al expulsar el aire',
      'Disnea de esfuerzo o sensación de ahogo y falta de aire al caminar o subir escaleras',
      'Tos recurrente seca o con flema blanquecina, que empeora por las noches o en las primeras horas de la madrugada',
      'Sensación de pesadez u opresión en la caja torácica ("pecho cerrado")',
      'Fatiga rápida al realizar actividades físicas habituales o juegos escolares',
      'Carraspera y congestión nasal matutina constante'
    ],
    sintomasAlarma: [
      'Dificultad respiratoria extrema que no permite pronunciar frases completas de corrido sin detenerse a jadear',
      'Tiraje intercostal evidente: se hunde la piel entre las costillas y por encima de la clavícula al intentar inhalar aire',
      'Coloración azulada o violácea en labios, mucosa oral o lecho de las uñas (cianosis periférica/central)',
      'Saturación de oxígeno por pulsioxímetro menor a 92% a nivel del mar',
      'Falta de alivio o empeoramiento tras la aplicación de 2 a 4 disparos de salbutamol con aerocámara',
      'Somnolencia, confusión o sensación de agotamiento muscular respiratorio'
    ],
    diagnostico: [
      'Espirometría forzada con prueba broncodilatadora (evalúa si la obstrucción es reversible con salbutamol)',
      'Flujometría seriada con medidor de flujo espiratorio máximo (Peak Flow Meter) para control domiciliario',
      'Radiografía simple de tórax (PA y lateral) para descartar neumonías, atelectasias o signos de hiperinsuflación pulmonar',
      'Tomografía computarizada de tórax de alta resolución (TACAR) en sospecha de EPOC o bronquiectasias',
      'Pruebas cutáneas de sensibilización alérgica (Prick Test)',
      'Oximetría de pulso y gasometría arterial en situaciones de descompensación aguda'
    ],
    complicaciones: [
      'Crisis asmática severa con riesgo de paro cardiorrespiratorio (Status Asthmaticus)',
      'Insuficiencia respiratoria crónica con dependencia de oxigenoterapia domiciliaria',
      'Cor Pulmonale: sobrecarga e hipertrofia del ventrículo derecho del corazón secundaria a hipertensión pulmonar',
      'Neumonías e infecciones respiratorias bacterianas sobreagregadas frecuentes',
      'Pérdida acelerada e irreversible de la función pulmonar con limitación física permanente'
    ],
    tratamiento: {
      enfoque: [
        'Manejo escalonado GINA / MINSA: Terapia de mantenimiento con corticoides inhalados (Budesonida o Fluticasona) + LABA (Formoterol)',
        'Inhalador de rescate para alivio rápido de broncoespasmo (Salbutamol o combinación ICS-Formoterol)',
        'Uso indispensable y correcto de aerocámara espaciadora con válvula para optimizar depósito pulmonar',
        'Rehabilitación pulmonar y ejercicios de fisioterapia respiratoria para desahogo diafragmático',
        'Cese total e irrestricto del consumo de tabaco y vapeadores'
      ],
      metasControl: [
        'Ausencia de síntomas diurnos (menos de 2 veces por semana)',
        'Cero despertares nocturnos por tos o silbido en el pecho',
        'Capacidad plena para hacer educación física y deportes sin limitaciones',
        'Saturación de oxígeno basal superior al 95% a nivel del mar'
      ]
    },
    primerosAuxilios: {
      titulo: 'Plan de Acción Inmediato ante Crisis de Asma Escolar',
      pasos: [
        '1. Mantén la calma del estudiante; haz que se siente erguido con los brazos apoyados en las rodillas (NO acostarlo).',
        '2. Agita el inhalador de rescate (Salbutamol) y conéctalo a la aerocámara.',
        '3. Aplica 2 disparos (puffs) separados: 1 disparo, pide que respire lentamente 5 a 6 veces por la aerocámara; espera 1 minuto y aplica el segundo disparo.',
        '4. Si no mejora notablemente en 10 a 15 minutos, repite 2 disparos adicionales.',
        '5. Si el estudiante tiene tiraje (se le hunden las costillas), labios morados o no puede hablar, llama al 106 SAMU o trasládalo de urgencia con oxígeno continuo.'
      ],
      recomendacionUrgente: 'Nunca dejes solo al alumno con crisis asmática; la aerocámara es obligatoria para que el medicamento ingrese a los pulmones.'
    },
    casoClinico: {
      paciente: 'Mateo P.',
      edad: '11 años (Estudiante de Primaria en Callao)',
      motivoConsulta: 'Crisis reiteradas de silbidos en el pecho tras correr en el recreo; usaba el salbutamol directamente sin aerocámara.',
      evolucionYTratamiento: 'El neumólogo pediatra del hospital le enseñó la técnica con aerocámara espaciadora e inició corticoide inhalado de control (budesonida). A las 4 semanas Mateo volvió a jugar fútbol sin asfixia.',
      mensajeEducativo: 'El inhalador sin aerocámara pierde el 80% de su dosis en la boca; con aerocámara el fármaco llega directo al fondo de los pulmones.'
    },
    escalaRiesgo: {
      nombre: 'Cuestionario de Control del Asma (Test ACT - Asthma Control Test)',
      paraQueSirve: 'Evalúa el nivel de control del asma en las últimas 4 semanas mediante 5 preguntas breves.',
      parametrosClave: [
        '¿Cuánto tiempo el asma te impidió rendir en la escuela o trabajo?',
        '¿Con qué frecuencia tuviste falta de aire?',
        '¿Cuántas veces te despertaron los silbidos o la tos de noche?',
        '¿Cuántas veces a la semana usaste el inhalador de rescate?',
        '¿Cómo calificarías tu control del asma?'
      ],
      interpretacion: 'Puntaje de 5 a 19: Asma no controlada (requiere ajuste médico urgente). 20 a 24: Bien controlada. 25: Asma totalmente controlada.'
    },
    saludMental: {
      desafioEmocional: 'La sensación súbita de asfixia genera ataques de pánico y ansiedad anticipatoria que pueden agravar el espasmo bronquial.',
      estigma: 'Vergüenza de usar el inhalador y la aerocámara frente a los compañeros en el aula escolar por temor a burlas.',
      estrategiaAfrontamiento: [
        'Normalizar el uso de inhaladores en el colegio mediante charlas educativas de salud escolar',
        'Enseñar a los compañeros del aula cómo auxiliar a un amigo en crisis respiratoria',
        'Técnicas de relajación con exhalación con labios fruncidos para prevenir la hiperventilación'
      ]
    },
    preguntasFrecuentes: [
      {
        pregunta: '¿Por qué es indispensable usar aerocámara?',
        respuesta: 'Sin aerocámara, el 80% del aerosol se queda pegado en la lengua y garganta y solo el 20% llega al pulmón. Con aerocámara, más del 70% del fármaco ingresa profundamente a los bronquios.'
      },
      {
        pregunta: '¿El asma infantil se cura cuando el niño crece?',
        respuesta: 'Muchos niños experimentan una remisión clínica prolongada en la adolescencia debido al crecimiento de sus vías aéreas, pero la hiperreactividad bronquial puede reaparecer en la adultez ante estímulos ambientales intensos.'
      },
      {
        pregunta: '¿Puedo usar antibióticos si tengo una crisis asmática?',
        respuesta: 'No. El asma es una inflamación alérgica, no una infección bacteriana. Tomar antibióticos sin indicación médica no alivia el broncoespasmo y genera resistencia microbiana.'
      }
    ],
    mitosYVerdades: [
      {
        mito: 'Los inhaladores son adictivos, dañan el corazón de los niños y se deben usar solo en emergencias extremas.',
        verdad: 'Falso. Los inhaladores aplican microdosis directas a los pulmones sin causar dependencia. Los corticoides inhalados son la base para desinflamar la vía aérea y salvar vidas.'
      },
      {
        mito: 'Un niño o adolescente con asma no debe correr ni practicar ningún deporte.',
        verdad: 'Falso. Con la enfermedad controlada y un calentamiento adecuado, la natación y los deportes aeróbicos fortalecen la capacidad pulmonar (múltiples medallistas olímpicos compiten con asma).'
      },
      {
        mito: 'El asma se cura definitivamente con pócimas caseras de hierbas o tomando agua helada.',
        verdad: 'Falso. El asma es una condición respiratoria crónica; se controla eficazmente con tratamiento médico preventivo y control ambiental, no con brebajes milagrosos.'
      }
    ],
    guiaNutricional: {
      recomendado: [
        'Frutas ricas en vitamina C natural (camu camu, naranja, mandarina, kiwi, maracuyá)',
        'Alimentos ricos en ácidos grasos omega-3 por su comprobado efecto antiinflamatorio (pescados azules, semillas de chía y linaza)',
        'Hortalizas ricas en betacarotenos y vitamina A para la protección del epitelio respiratorio (zanahorias, espinacas)',
        'Mantener una hidratación generosa con agua tibia o templada (>2 litros diarios) para fluidificar las secreciones bronquiales'
      ],
      evitar: [
        'Bebidas excesivamente heladas o con hielo si el paciente reconoce que son su detonante de broncoespasmo',
        'Alimentos que contienen sulfitos agregados (frutos secos tratados químicamente, conservas comerciales)',
        'Snacks con colorantes sintéticos como la tartrazina (amarillo N° 5), que puede inducir reacciones alérgicas bronquiales',
        'Comidas abundantes y copiosas antes de acostarse para evitar el reflujo gastroesofágico que irrita la laringe'
      ],
      consejoClave: 'La hidratación constante es el mejor expectorante fisiológico para mantener secreciones fluidas.'
    },
    prevencion: [
      'Mantener habitaciones ventiladas e iluminadas naturalmente, evitando alfombras, peluches acumuladores de ácaros y cortinas pesadas',
      'Lavar las sábanas y fundas de almohada semanalmente con agua caliente para erradicar ácaros',
      'Cero humo de tabaco: no permitir que nadie fume ni vapee dentro del hogar ni en el automóvil',
      'Instalar chimeneas o cocinas mejoradas en viviendas rurales que utilizan leña para cocinar',
      'Vacunarse anualmente contra el virus de la influenza y recibir la vacuna antineumocócica según calendario MINSA',
      'Usar siempre aerocámara limpia con los inhaladores para asegurar que el medicamento llegue al fondo de los bronquios'
    ],
    cuandoConsultar: 'Dificultad respiratoria que impide hablar con fluidez, hundimiento de costillas (tiraje), coloración azulada en labios o saturación de oxígeno menor a 92% exige traslado de urgencia a un hospital.',
    imagenUrl: 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=600&q=80',
    estadistica: 'El asma afecta a más del 15% de los escolares en la costa peruana debido a la alta humedad. La EPOC es la 3ª causa de muerte en el mundo según la OMS.',
    estadisticaValor: 15,
    fuenteMinsa: 'Guía Técnica MINSA · Manejo de Enfermedades Respiratorias Crónicas 2024 · GINA International',
    codigoCIE10: 'J44 - J45'
  },
  {
    id: 'diabetes',
    nombre: 'Diabetes Mellitus',
    subtitulo: 'Diabetes Tipo 2, Tipo 1 y Resistencia a la Insulina',
    categoria: 'Enfermedades No Transmisibles (DNT)',
    icono: 'nutrition-outline',
    emoji: '🩸',
    nivelRiesgo: 'Alto',
    colorAcento: '#F59E0B',
    indicadorPeru: '5.4% de prevalencia confirmada en Perú (subregistro supera el 10% · ENDES)',
    factoresRiesgo: [
      'Sobrepeso u obesidad (IMC ≥ 25, perímetro abdominal elevado)',
      'Inactividad física y sedentarismo extremo',
      'Consumo habitual de bebidas azucaradas y gaseosas',
      'Familiar de primer grado (padres o hermanos) con diabetes',
      'Antecedente de diabetes gestacional o peso del recién nacido >4 kg',
      'Presión arterial alta (≥ 140/90 mmHg) y triglicéridos > 250 mg/dL'
    ],
    queEs: 'Enfermedad metabólica crónica y multisistémica caracterizada por hiperglucemia persistente en sangre. Ocurre cuando el páncreas endocrino no produce suficiente insulina (Diabetes Tipo 1) o cuando las células del organismo desarrollan resistencia a la insulina combinada con un déficit secretor progresivo (Diabetes Tipo 2, que representa más del 95% de los casos en el Perú).',
    fisiopatologia: 'El exceso crónico de calorías y grasa visceral produce lipotoxicidad celular e inflamación en músculo esquelético y hepatocitos, bloqueando los transportadores GLUT-4 de glucosa. El páncreas responde inicialmente con hiperinsulinismo compensatorio; sin embargo, con el tiempo las células beta pancreáticas se agotan y mueren, perdiendo el control glucémico y permitiendo daño micro y macrovascular mediado por productos finales de glicación avanzada (AGEs).',
    causas: [
      'Resistencia a la insulina detonada por grasa visceral en abdomen y falta de masa muscular activa',
      'Dieta hipercalórica basada en carbohidratos refinados, azúcares simples añadidos y alimentos ultraprocesados',
      'Inactividad física prolongada: el músculo esquelético inactivo disminuye drásticamente su sensibilidad a la glucosa',
      'Herencia genética poligénica y susceptibilidad familiar directa',
      'Estrés crónico sostenido con elevación permanente de cortisol y catecolaminas hiperglucemiantes',
      'Alteraciones en el descanso nocturno y síndrome de apnea obstructiva del sueño'
    ],
    sintomas: [
      'Poliuria: aumento notable en la frecuencia y volumen al orinar (incluso levantarse varias veces de noche)',
      'Polidipsia: sed intensa, constante e insaciable durante todo el día',
      'Polifagia: hambre excesiva a pesar de haber comido recientemente',
      'Pérdida de peso involuntaria y paradójica a pesar de comer en cantidades normales o aumentadas',
      'Visión borrosa fluctuante por cambios osmóticos en el cristalino del ojo',
      'Cansancio y fatiga crónica desproporcionada',
      'Cicatrización lenta o tórpida de pequeñas heridas, rasguños o cortes en la piel',
      'Sensación de hormigueo, entumecimiento o quemazón en pies y manos (parestesias)'
    ],
    sintomasAlarma: [
      'Respiración rápida y profunda con olor dulce a fruta madura (Respiración de Kussmaul en Cetoacidosis Diabética)',
      'Nivel de glucosa capilar superior a 300 mg/dL con náuseas, vómitos repetitivos y dolor abdominal',
      'Confusión mental, mareo severo, desorientación o pérdida de conciencia (Estado Hiperosmolar o Hipoglucemia Severa)',
      'Aparición de úlcera, ampolla o zona enrojecida e indolora en la planta o dedos de los pies (Pie Diabético)',
      'Sudoración fría profusa con temblor distal intenso por bajón de azúcar (Hipoglucemia < 70 mg/dL)'
    ],
    diagnostico: [
      'Glucemia plasmática en ayunas ≥ 126 mg/dL (7.0 mmol/L) confirmada en 2 tomas independientes',
      'Prueba de Tolerancia Oral a la Glucosa (PTOG con carga de 75g) con valor ≥ 200 mg/dL a las 2 horas',
      'Hemoglobina Glicosilada (HbA1c) ≥ 6.5% mediante método estandarizado NGSP',
      'Glucemia al azar ≥ 200 mg/dL en un paciente con síntomas cardinales clásicos (las 4 "P")',
      'Microalbuminuria en orina de 24 horas o cociente albúmina/creatinina para tamizaje de nefropatía',
      'Evaluación podológica especializada del pie diabético (sensibilidad con monofilamento de Semmes-Weinstein)'
    ],
    complicaciones: [
      'Retinopatía diabética con desprendimiento de retina y ceguera irreversible',
      'Nefropatía diabética: principal causa de ingreso a hemodiálisis y trasplante renal',
      'Neuropatía diabética periférica con pérdida de la sensibilidad protectora del pie',
      'Pie diabético con úlceras profundas, osteomielitis y alto riesgo de amputación menor o mayor',
      'Aterosclerosis acelerada: riesgo 2 a 4 veces mayor de infarto agudo de miocardio y derrame cerebral'
    ],
    tratamiento: {
      enfoque: [
        'Educación diabetológica continuada y plan de alimentación personalizado por nutricionista',
        'Fármaco de primera línea oral según MINSA/ADA: Metformina (sensibilizador periférico de insulina)',
        'Nuevos fármacos cardioprotectores y nefroprotectores: Inhibidores SGLT2 (Empagliflozina) y Agonistas GLP-1',
        'Terapia insulínica basal y prandial (Insulina NPH, Glargina, Rápida) en DM1 y DM2 con déficit secretor avanzado',
        'Automonitoreo domiciliario de glucosa con glucómetro digital y registro en libreta'
      ],
      metasControl: [
        'Hemoglobina Glicosilada (HbA1c): menor a 7.0% en la mayoría de adultos (menor a 6.5% en jóvenes)',
        'Glucosa capilar en ayunas: entre 80 y 130 mg/dL',
        'Glucosa postprandial (2 horas después de comer): menor a 180 mg/dL',
        'Presión arterial: menor a 130/80 mmHg y perfil lipídico controlado'
      ]
    },
    primerosAuxilios: {
      titulo: 'Regla del 15 ante Crisis de Hipoglucemia (Glucosa < 70 mg/dL)',
      pasos: [
        '1. Reconoce los síntomas de bajón de azúcar: temblores, palidez, sudoración fría, palpitaciones y hambre voraz.',
        '2. Si la persona está consciente, dale 15 gramos de carbohidratos de acción rápida (1/2 vaso de jugo de fruta, 3 caramelos masticables o 1 cucharada de azúcar disuelta en agua).',
        '3. Espera 15 minutos en reposo absoluto y vuelve a medir su glucosa con glucómetro.',
        '4. Si continúa por debajo de 70 mg/dL, repite la toma de 15 gramos de azúcar.',
        '5. Si la persona está inconsciente o convulsionando, NUNCA introduzcas líquidos en su boca (riesgo de asfixia); colócala de lado y trasládala a Emergencias de inmediato.'
      ],
      recomendacionUrgente: 'La hipoglucemia severa daña neuronas en minutos; actúa con rapidez usando azúcar rápida.'
    },
    casoClinico: {
      paciente: 'Rosa G.',
      edad: '17 años (Escolar de Secundaria en Trujillo)',
      motivoConsulta: 'Fatiga continua, manchas negras en el cuello (acantosis nigricans) y sed insaciable; consumía gaseosas a diario.',
      evolucionYTratamiento: 'El tamizaje de glucosa en ayunas arrojó 118 mg/dL (Prediabetes) e hiperinsulinemia de 28 uUI/mL. El programa de salud escolar reemplazó las gaseosas por agua e inició caminatas diarias de 45 minutos. Su glucosa bajó a 88 mg/dL y revirtió la prediabetes.',
      mensajeEducativo: 'La prediabetes es 100% reversible si se detecta a tiempo eliminando las bebidas azucaradas y haciendo ejercicio.'
    },
    escalaRiesgo: {
      nombre: 'Test FINDRISC (Finnish Diabetes Risk Score - MINSA Perú)',
      paraQueSirve: 'Calcula el riesgo individual de desarrollar Diabetes Tipo 2 en los próximos 10 años.',
      parametrosClave: [
        'Edad del paciente',
        'Índice de Masa Corporal (IMC)',
        'Perímetro de la cintura abdominal',
        'Actividad física diaria (mínimo 30 minutos)',
        'Frecuencia de consumo de verduras y frutas',
        'Uso previo de antihipertensivos',
        'Antecedentes de glucosa alta o familiares con diabetes'
      ],
      interpretacion: '<7 puntos: Riesgo bajo (1%). 7-11: Riesgo ligeramente elevado (4%). 12-14: Riesgo moderado (17%). 15-20: Riesgo alto (33%). >20: Riesgo muy alto (50%).'
    },
    saludMental: {
      desafioEmocional: 'El "distrés por diabetes" o fatiga por el tratamiento surge del cansancio de medir glucosa a diario, planear cada comida y el temor a inyecciones de insulina.',
      estigma: 'Culpar al paciente diciéndole "te dio diabetes porque eres descuidado o comilón", ignorando la predisposición genética.',
      estrategiaAfrontamiento: [
        'Enfoque de autocuidado compasivo: celebrar pequeñas metas semanales en vez de obsesionarse con la perfección',
        'Involucrar a toda la familia en la alimentación sana para que el paciente no se sienta castigado comiendo diferente',
        'Acompañamiento psicológico para el miedo a las hipoglucemias y fobia a las agujas'
      ]
    },
    preguntasFrecuentes: [
      {
        pregunta: '¿La persona con diabetes puede comer fruta dulce como el plátano o uva?',
        respuesta: 'Sí, pero con moderación y en su estado natural entero (nunca en jugo colado). La fibra de la fruta entera ralentiza la absorción del azúcar.'
      },
      {
        pregunta: '¿Es verdad que los productos "light" o "diet" no suben la glucosa?',
        respuesta: 'No te confíes. Muchos productos etiquetados como "sin azúcar añadida" contienen harinas refinadas y carbohidratos que elevan la glucemia notablemente.'
      },
      {
        pregunta: '¿Por qué las personas con diabetes deben revisar sus pies todos los días?',
        respuesta: 'Porque pierden la sensibilidad al dolor por neuropatía. Pueden pisar una tachuela o tener una herida grave sin sentir dolor, la cual puede infectarse y llevar a amputación.'
      }
    ],
    mitosYVerdades: [
      {
        mito: 'La insulina es el último recurso antes de morir y deja ciego al paciente.',
        verdad: 'Falso. La insulina es una hormona natural idéntica a la que produce el cuerpo humano. La ceguera es causada por los años de glucosa alta dañando la retina, no por la insulina.'
      },
      {
        mito: 'Si tengo diabetes puedo comer toda la miel, pan integral y frutas que quiera porque no son azúcar refinada.',
        verdad: 'Falso. La miel y los carbohidratos complejos también se convierten en glucosa en sangre y deben ser consumidos en porciones calculadas según el plan alimentario.'
      },
      {
        mito: 'La diabetes se origina exclusivamente por un susto fuerte o una cólera intensa.',
        verdad: 'Falso. El susto o estrés libera adrenalina que eleva momentáneamente el azúcar y hace evidente una diabetes que ya venía desarrollándose en silencio durante años.'
      }
    ],
    guiaNutricional: {
      recomendado: [
        'Aplicar el método del plato MINSA: 1/2 plato con ensalada de verduras crudas, 1/4 con proteínas magras y 1/4 con carbohidratos ricos en fibra',
        'Granos integrales y menestras de bajo índice glucémico (lentejas, frijoles, garbanzos, quinua)',
        'Proteínas magras de alto valor biológico (pechuga de pollo, pescado, huevo sancochado, queso fresco bajo en sal)',
        'Grasas cardiosaludables en porciones moderadas (palta, nueces, aceite de oliva virgen extra)',
        'Consumo exclusivo de agua pura e infusiones naturales sin azúcar añadida'
      ],
      evitar: [
        'Gaseosas, bebidas energizantes, jugos envasados y néctares comerciales azucarados',
        'Azúcar de mesa, panela, jarabes de maíz ricos en fructosa y miel de caña',
        'Harinas refinadas, pan blanco en exceso, pasteles, galletas dulces y postres industriales',
        'Frituras en aceites reutilizados y productos de comida rápida ultraprocesada'
      ],
      consejoClave: 'Reemplaza todas las bebidas azucaradas por agua natural. Una sola gaseosa de 500 ml contiene el equivalente a 12 cucharaditas de azúcar.'
    },
    prevencion: [
      'Mantener un plan de alimentación balanceado basado en comida real y no en productos ultraprocesados',
      'Eliminar por completo las gaseosas, refrescos azucarados y néctares de la dieta habitual',
      'Acumular un mínimo de 30 a 60 minutos diarios de ejercicio físico regular mixto (aeróbico y de fuerza muscular)',
      'Mantener el peso en rango adecuado y reducir el perímetro de cintura por debajo de 90 cm en varones y 80 cm en mujeres',
      'Realizarse un examen de glucosa en ayunas al menos una vez al año en centros de salud MINSA',
      'Evitar el tabaco, ya que la nicotina empeora de manera directa la resistencia periférica a la insulina'
    ],
    cuandoConsultar: 'Niveles de glucosa en ayunas superiores a 126 mg/dL, confusión con somnolencia, o cualquier corte, ampolla o llaga en los pies que no cicatrice debe evaluarse sin demora en el centro de salud.',
    imagenUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
    estadistica: 'En el Perú, más del 40% de las personas con diabetes desconocen su diagnóstico. El control glucémico temprano evita la ceguera y la insuficiencia renal.',
    estadisticaValor: 5,
    fuenteMinsa: 'Norma Técnica de Salud para la Vigilancia y Control de la Diabetes Mellitus · MINSA 2025',
    codigoCIE10: 'E10 - E14'
  },
  {
    id: 'obesidad',
    nombre: 'Obesidad y Trastornos Metabólicos',
    subtitulo: 'Sobrepeso, Obesidad Juvenil y Síndrome Metabólico',
    categoria: 'Enfermedades No Transmisibles (DNT)',
    icono: 'body-outline',
    emoji: '⚖️',
    nivelRiesgo: 'Alto',
    colorAcento: '#EC4899',
    indicadorPeru: '37.8% de sobrepeso y obesidad en adolescentes peruanos (ENDES / MINSA)',
    factoresRiesgo: [
      'Dieta hipercalórica rica en comida chatarra y ultraprocesados con octógonos',
      'Sedentarismo digital (>4 horas diarias frente a pantallas de celular o TV)',
      'Falta de actividad física vigorosa en la escuela y el hogar',
      'Hábitos familiares de alimentación poco saludable',
      'Falta de sueño reparador (<7 horas en adolescentes)',
      'Consumo crónico de bebidas azucaradas y snacks de quioscos escolares'
    ],
    queEs: 'Enfermedad crónica, compleja y recidivante caracterizada por una acumulación anormal o excesiva de tejido adiposo que perjudica gravemente la salud. Es la puerta de entrada principal para el desarrollo prematuro de diabetes mellitus, hipertensión arterial, dislipidemias, esteatosis hepática (hígado graso) y problemas articulares en adolescentes y jóvenes.',
    fisiopatologia: 'El balance energético positivo prolongado conduce a hipertrofia e hiperplasia de los adipocitos viscerales. Al sobrepasar su capacidad de almacenamiento, el tejido adiposo libera citocinas proinflamatorias (TNF-alfa, IL-6) y leptina en exceso mientras disminuye la adiponectina. Esto induce resistencia generalizada a la insulina, inflamación vascular endotelial y esteatosis ectópica en hígado y músculo.',
    causas: [
      'Desequilibrio energético sostenido: ingesta calórica significativamente superior al gasto calórico diario',
      'Patrón alimentario dominado por ultraprocesados con altos niveles de azúcar, grasas saturadas y sodio (octógonos)',
      'Disminución del juego libre activo y aumento del tiempo sedentario frente a pantallas electrónicas',
      'Ambiente obesogénico: alta disponibilidad y bajo costo de golosinas y comida rápida en quioscos y calles',
      'Factores hormonales, genéticos y microbiota intestinal alterada por dietas pobres en fibra',
      'Estrés psicológico, ansiedad y alimentación emocional'
    ],
    sintomas: [
      'Aumento visible del perímetro abdominal y volumen corporal general',
      'Fatiga temprana y sensación de ahogo ante esfuerzos físicos cotidianos como subir gradas',
      'Acantosis nigricans: oscurecimiento aterciopelado de la piel en pliegues del cuello, axilas y nudillos (signo clínico de alta resistencia a la insulina)',
      'Dolores osteoarticulares frecuentes en rodillas, caderas y columna lumbar por sobrecarga mecánica',
      'Somnolencia diurna y ronquidos nocturnos frecuentes por apnea del sueño',
      'Estrías rojizas o violáceas en abdomen, muslos y brazos',
      'Baja autoestima y aislamiento social en el entorno escolar'
    ],
    sintomasAlarma: [
      'Dificultad respiratoria severa que interrumpe el sueño con despertares bruscos por ahogo (Apnea Obstructiva)',
      'Dolor torácico opresivo con palpitaciones ante mínimos esfuerzos físicos',
      'Cifras de presión arterial elevadas para la edad en consultas escolares',
      'Cefalea intensa persistente matutina con visión borrosa (posible pseudotumor cerebral por obesidad)',
      'Coloración amarilla en ojos o piel (ictericia) o dolor sordo en cuadrante superior derecho abdominal por esteatohepatitis'
    ],
    diagnostico: [
      'Evaluación antropométrica completa: Peso, Talla, Índice de Masa Corporal (IMC) y Tablas de Percentiles OMS para la edad',
      'Medición protocolizada del perímetro de cintura con cinta métrica inextensible',
      'Perfil lipídico: colesterol total, triglicéridos, HDL y LDL en ayunas',
      'Glucemia basal e índice HOMA-IR para calcular el grado de resistencia a la insulina',
      'Dosaje de transaminasas (TGO, TGP) y ecografía abdominal para descartar hígado graso no alcohólico',
      'Monitoreo clínico de la presión arterial con manguito del tamaño apropiado para la contextura'
    ],
    complicaciones: [
      'Desarrollo precoz de Diabetes Mellitus Tipo 2 e Hipertensión Arterial en la juventud',
      'Hígado graso no alcohólico (EHNA) con progresión a fibrosis y cirrosis hepática',
      'Síndrome metabólico completo con riesgo cardiovascular muy elevado',
      'Deformidades ortopédicas y artrosis precoz de rodillas (genu valgo)',
      'Apnea obstructiva del sueño con hipoxemia nocturna y bajo rendimiento académico',
      'Problemas psicológicos: depresión, ansiedad y afectación de la autoestima escolar'
    ],
    tratamiento: {
      enfoque: [
        'Terapia de cambio de conducta alimentaria y familiar (intervención no culpabilizadora)',
        'Prescripción de ejercicio físico estructurado: mínimo 60 minutos diarios combinando aeróbico y fuerza',
        'Apoyo psicológico para el manejo de la ansiedad, comedores emocionales y ciberacoso escolar',
        'Abordaje médico multidisciplinario (Pediatría/Medicina Interna, Nutrición y Psicología)',
        'Farmacoterapia o cirugía bariátrica solo en casos seleccionados de obesidad mórbida con comorbilidades graves'
      ],
      metasControl: [
        'Reducción progresiva y sostenida del 5% al 10% del peso corporal inicial en 6 meses',
        'Disminución del perímetro de cintura y normalización de la presión arterial',
        'Reversión de la esteatosis hepática y mejora del perfil lipídico',
        'Recuperación de la vitalidad física y autoestima personal'
      ]
    },
    primerosAuxilios: {
      titulo: 'Intervención ante Crisis Respiratoria o Descompensación en Adolescentes con Obesidad',
      pasos: [
        '1. Ante fatiga extrema o sensación de desmayo durante la clase de educación física, suspende la actividad inmediatamente.',
        '2. Sienta al estudiante en un lugar con sombra y ventilado; no permitas que la multitud lo sofoque.',
        '3. Ofrécele agua fresca a pequeños sorbos; no le des gaseosas ni bebidas energizantes azucaradas.',
        '4. Si manifiesta dolor en el pecho, palpitaciones descontroladas o dificultad para recuperar el aire, avisa al tópico escolar o trasládalo al centro de salud.',
        '5. Promueve un clima escolar de respeto absoluto: erradica burlas o comentarios sobre el peso corporal.'
      ],
      recomendacionUrgente: 'La salud física va de la mano con la salud mental; nunca ridiculices a un estudiante con sobrepeso.'
    },
    casoClinico: {
      paciente: 'Diego S.',
      edad: '16 años (Escolar en Arequipa)',
      motivoConsulta: 'Dolor continuo en rodillas al subir escaleras y dificultad para mantenerse despierto en clases de la mañana.',
      evolucionYTratamiento: 'Presentó IMC de 32 (Obesidad Grado I), perímetro abdominal de 98 cm y esteatosis hepática moderada en ecografía. Con apoyo de su familia, reemplazaron videojuegos por natación 3 veces por semana y eliminaron las frituras nocturnas. Perdió 8 kilos en 5 meses y el dolor de rodillas desapareció.',
      mensajeEducativo: 'El sobrepeso en la adolescencia daña articulaciones y el hígado; el apoyo familiar es el factor #1 de éxito para cambiar hábitos.'
    },
    escalaRiesgo: {
      nombre: 'Criterios de Diagnóstico de Síndrome Metabólico (IDF / ATP III Pediátrico)',
      paraQueSirve: 'Identifica la coexistencia de múltiples factores de riesgo metabólico que multiplican el riesgo de infarto precoz.',
      parametrosClave: [
        'Obesidad Abdominal (Cintura ≥ percentil 90 para edad y sexo)',
        'Triglicéridos elevados (≥ 150 mg/dL o ≥ 1.7 mmol/L)',
        'Colesterol HDL bajo (< 40 mg/dL)',
        'Presión Arterial elevada (Sistólica ≥ 130 mmHg o Diastólica ≥ 85 mmHg)',
        'Glucosa plasmática alterada en ayunas (≥ 100 mg/dL)'
      ],
      interpretacion: 'Tener 3 o más criterios confirma Síndrome Metabólico y exige un plan de intervención intensivo multidisciplinario.'
    },
    saludMental: {
      desafioEmocional: 'El bullying escolar ("gordofobia") genera cuadros severos de depresión, aislamiento y trastorno por atracón como mecanismo de escape.',
      estigma: 'Asociar la contextura física con flojera o falta de voluntad cuando se trata de una patología neuroendocrina compleja.',
      estrategiaAfrontamiento: [
        'Cero tolerancia al acoso escolar por apariencia física en colegios',
        'Fomentar deportes de equipo inclusivos donde no importe el peso sino la participación activa',
        'Terapia psicológica para fortalecer el autoconcepto positivo y la asertividad'
      ]
    },
    preguntasFrecuentes: [
      {
        pregunta: '¿Saltarse el desayuno ayuda a adelgazar más rápido?',
        respuesta: 'Falso. Saltarse el desayuno ralentiza el metabolismo y genera picos intensos de ansiedad y hambre descontrolada al mediodía, llevando a comer el doble de calorías.'
      },
      {
        pregunta: '¿Las fajas térmicas o plásticos en el abdomen queman grasa?',
        respuesta: 'No. Solo hacen perder agua y sales minerales por sudoración, deshidratando el cuerpo. La grasa se oxida mediante ejercicio muscular y déficit calórico, no sudándola.'
      },
      {
        pregunta: '¿Qué significa la mancha oscura en el cuello de mi hijo?',
        respuesta: 'Se llama Acantosis Nigricans y no es suciedad ni falta de higiene; es un signo médico que indica que el páncreas está trabajando forzado por resistencia a la insulina.'
      }
    ],
    mitosYVerdades: [
      {
        mito: 'Un niño o adolescente gordito y cachetón es sinónimo de que está perfectamente sano y bien nutrido.',
        verdad: 'Falso. El sobrepeso oculta frecuentemente malnutrición por exceso de calorías vacías y deficiencias graves de hierro (anemia) y micronutrientes.'
      },
      {
        mito: 'La obesidad se arregla tomando pastillas quemadoras de grasa o fajas reductoras.',
        verdad: 'Falso. Las pastillas milagrosas pueden provocar arritmias cardíacas peligrosas. La única forma saludable y duradera es la reeducación alimentaria y la actividad física constante.'
      },
      {
        mito: 'El ejercicio solo sirve para bajar de peso; si no bajo kilos en la balanza, no vale para nada.',
        verdad: 'Falso. El ejercicio reduce la grasa visceral peligrosa del abdomen, mejora la sensibilidad a la insulina y protege el corazón incluso antes de que la balanza varíe significativamente.'
      }
    ],
    guiaNutricional: {
      recomendado: [
        'Comidas caseras preparadas con ingredientes frescos y naturales (legumbres, hortalizas, tubérculos sancochados)',
        'Consumo de agua hervida o embotellada como bebida principal (mínimo 6 a 8 vasos diarios)',
        'Frutas enteras de estación con su cáscara comestible bien lavada en lugar de jugos colados',
        'Incluir proteínas magras que generan saciedad prolongada (pescado, pavita, huevo, menestras)',
        'Respetar horarios fijos de comidas evitando el picoteo continuo frente a la pantalla'
      ],
      evitar: [
        'Comida chatarra frita (salchipapas, broaster, hamburguesas de quiosco callejero)',
        'Productos ultraprocesados que lleven octógonos de advertencia ("ALTO EN AZÚCAR", "ALTO EN GRASAS SATURADAS")',
        'Gaseosas, refrescos en polvo, jugos artificiales y leches chocolatadas cargadas de azúcar',
        'Consumir alimentos mientras se mira el celular o la televisión, ya que anula la señal cerebral de saciedad'
      ],
      consejoClave: 'Prefiere siempre comida de olla preparada en casa en vez de productos embolsados o delivery rápido.'
    },
    prevencion: [
      'Cumplir al menos 60 minutos diarios de actividad física moderada a vigorosa para escolares y adolescentes',
      'Fomentar loncheras escolares saludables: fruta fresca, agua pura, choclo con queso fresco o pan con huevo',
      'Establecer un límite estricto de máximo 2 horas diarias de tiempo recreativo frente a pantallas (celular, videojuegos, TV)',
      'Cenar al menos 2 horas antes de ir a dormir y asegurar 8 a 9 horas de sueño nocturno continuo',
      'Aprender a leer los octógonos de advertencia en los empaques de alimentos en el supermercado o quiosco',
      'Realizar caminatas familiares y actividades al aire libre los fines de semana'
    ],
    cuandoConsultar: 'Aumento acelerado de peso en pocos meses, ronquidos nocturnos con pausas respiratorias, cuello con marcas negras aterciopeladas (acantosis) o dolor articular continuo exige evaluación médica en el centro de salud.',
    imagenUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    estadistica: 'Casi 4 de cada 10 escolares y adolescentes en el Perú presentan sobrepeso u obesidad (ENDES / MINSA). Es el factor precursor más potente de las demás ENT.',
    estadisticaValor: 38,
    fuenteMinsa: 'Guía de Práctica Clínica para el Diagnóstico y Manejo del Sobrepeso y Obesidad · MINSA / CENAN 2025',
    codigoCIE10: 'E66'
  },
  {
    id: 'renal-cronica',
    nombre: 'Enfermedad Renal Crónica',
    subtitulo: 'Nefropatía Diabética, Daño Hipertensivo y Falla Renal',
    categoria: 'Enfermedades No Transmisibles (DNT)',
    icono: 'water-outline',
    emoji: '💧',
    nivelRiesgo: 'Alto',
    colorAcento: '#06B6D4',
    indicadorPeru: 'Afecta a más del 10% de adultos en el Perú (+3 millones · EsSalud / MINSA)',
    factoresRiesgo: [
      'Diabetes mellitus de larga evolución descontrolada',
      'Hipertensión arterial no controlada',
      'Automedicación con antiinflamatorios (Ibuprofeno, Naproxeno en exceso)',
      'Consumo elevado de sal y deshidratación crónica',
      'Infecciones urinarias a repetición no tratadas adecuadamente',
      'Antecedentes familiares de insuficiencia renal o diálisis'
    ],
    queEs: 'Pérdida progresiva, irreversible e inadvertida de la función filtradora de los riñones durante más de 3 meses. Al deteriorarse las nefronas, el cuerpo pierde la capacidad de eliminar toxinas urémicas, regular el agua corporal, controlar la presión y producir eritropoyetina (causando anemia severa). En estadios avanzados requiere diálisis o trasplante renal para sobrevivir.',
    fisiopatologia: 'La hiperglucemia y la hipertensión generan hiperfiltración glomerular inicial y daño en los podocitos y la membrana basal renal. Esto permite la fuga patológica de proteínas en la orina (microalbuminuria y proteinuria), desencadenando inflamación intersticial crónica, glomeruloesclerosis y fibrosis renal terminal irreversible.',
    causas: [
      'Nefropatía diabética: principal causa de daño renal crónico en el Perú',
      'Nefroangioesclerosis hipertensiva: daño de arteriolas renales por presión alta crónica',
      'Glomerulonefritis primarias o secundarias a enfermedades autoinmunes (Lupus Eritematoso Sistémico)',
      'Abuso crónico y automedicación de analgésicos antiinflamatorios no esteroideos (AINEs)',
      'Enfermedades genéticas renales poliquísticas y uropatías obstructivas (cálculos o próstata)'
    ],
    sintomas: [
      'Silenciosa en etapas iniciales (etapas 1, 2 y 3 no suelen presentar molestias)',
      'Edema o hinchazón progresiva en párpados al despertar, tobillos y piernas',
      'Cambios en la orina: orina espumosa con burbujas persistentes (por pérdida de proteínas) o hematuria',
      'Nicturia: necesidad imperiosa de levantarse varias veces en la noche a orinar',
      'Cansancio extremo, astenia y palidez cutánea por anemia renal',
      'Sabor metálico en la boca, mal aliento urémico y pérdida del apetito',
      'Náuseas matutinas y prurito o picazón persistente y seca en la piel'
    ],
    sintomasAlarma: [
      'Falta de producción de orina en 24 horas (anuria) con aumento drástico de peso por retención hídrica',
      'Disnea severa en reposo al estar acostado por edema agudo de pulmón',
      'Alteración del estado mental: confusión, somnolencia profunda o convulsiones urémicas',
      'Potasio en sangre peligrosamente elevado (hiperpotasemia con arritmias cardíacas)',
      'Hipo persistente que no cede, acompañado de vómitos incontrolables'
    ],
    diagnostico: [
      'Creatinina sérica en sangre y cálculo de la Tasa de Filtración Glomerular Estimada (TFGe)',
      'Examen de orina completo con medición del Cociente Albúmina/Creatinina (CAC en muestra matutina)',
      'Urea sérica y electrolitos en sangre (Sodio, Potasio, Calcio, Fósforo)',
      'Ecografía renal bilateral para medir tamaño renal, diferenciación corticomedular y descartar quistes u obstrucción',
      'Biopsia renal percutánea guiada por ecografía en casos de etiología no determinada'
    ],
    complicaciones: [
      'Enfermedad Renal Terminal que exige inicio de Hemodiálisis o Diálisis Peritoneal continua',
      'Eventos cardiovasculares fatales (infarto y muerte súbita por calcificación vascular)',
      'Anemia normocítica normocrómica severa refractaria',
      'Osteodistrofia renal y fragilidad ósea por alteración del metabolismo fosfocálcico',
      'Hiperpotasemia severa con paro cardíaco súbito'
    ],
    tratamiento: {
      enfoque: [
        'Nefroprotección estricta: Control exhaustivo de presión arterial y glucosa',
        'Fármacos nefroprotectores aprobados: Inhibidores SGLT2 (Dapagliflozina/Empagliflozina) y bloqueadores SRAA (Enalapril/Losartán)',
        'Dieta hipoproteica e hiposódica controlada por nutricionista nefrológico',
        'Tratamiento de la anemia con agentes estimulantes de la eritropoyesis (Eritropoyetina) y hierro endovenoso',
        'Terapia de reemplazo renal (Hemodiálisis, Diálisis peritoneal) o Trasplante Renal de donante vivo/cadavérico'
      ],
      metasControl: [
        'Tasa de Filtración Glomerular estable (frenar la caída anual de TFGe)',
        'Cociente Albúmina/Creatinina menor a 30 mg/g de orina',
        'Presión Arterial menor a 130/80 mmHg sin hipotensión ortostática',
        'Evitar al 100% el uso de nefrotóxicos (AINEs, contrastes radiológicos sin hidratación)'
      ]
    },
    primerosAuxilios: {
      titulo: 'Actuación Inmediata ante Descompensación Renal Aguda',
      pasos: [
        '1. Si un paciente renal presenta ahogo severo y no puede respirar acostado, colócalo sentado con los pies colgando (posición anti-edema).',
        '2. Llama al 106 SAMU o acude de inmediato a su centro de diálisis / hospital.',
        '3. No le des agua ni líquidos abundantes, ya que su riñón no puede orinar y el líquido se va directamente a los pulmones.',
        '4. Si tiene una fístula arteriovenosa en el brazo para hemodiálisis, NUNCA permitas que le tomen la presión ni le saquen sangre de ese brazo.',
        '5. Revisa que la fístula tenga su latido o soplo característico (frémito) palpando suavemente con los dedos.'
      ],
      recomendacionUrgente: 'La retención aguda de líquido con falta de aire es una emergencia que requiere diálisis de urgencia.'
    },
    casoClinico: {
      paciente: 'Jorge L.',
      edad: '52 años (Comerciante en Piura)',
      motivoConsulta: 'Se automedicaba diariamente con 2 pastillas de ibuprofeno por dolores de espalda; empezó a notar los párpados hinchados y orina con espuma.',
      evolucionYTratamiento: 'En el centro MINSA detectaron Creatinina de 2.4 mg/dL y daño renal estadio 3B exacerbado por AINEs. Tras suspender los antiinflamatorios y ajustar su presión con enalapril, la progresión del daño se frenó.',
      mensajeEducativo: 'El abuso silencioso de pastillas para el dolor (ibuprofeno, naproxeno) puede destruir los riñones sin avisar.'
    },
    escalaRiesgo: {
      nombre: 'Estadios de Enfermedad Renal Crónica (Clasificación KDIGO)',
      paraQueSirve: 'Estratifica la gravedad de la pérdida de función renal para definir cuándo referir a diálisis.',
      parametrosClave: [
        'Estadio G1: Función normal o alta (TFGe ≥ 90 mL/min/1.73m² con daño renal)',
        'Estadio G2: Daño leve (TFGe 60-89 mL/min/1.73m²)',
        'Estadio G3a-G3b: Daño moderado (TFGe 30-59 mL/min/1.73m²)',
        'Estadio G4: Daño grave (TFGe 15-29 mL/min/1.73m²)',
        'Estadio G5: Falla renal terminal (TFGe < 15 mL/min/1.73m²)'
      ],
      interpretacion: 'Desde el estadio 3B se requiere evaluación permanente por Nefrólogo y preparación de accesos vasculares.'
    },
    saludMental: {
      desafioEmocional: 'El diagnóstico de diálisis genera pérdida de autonomía, fatiga física y dependencia de una máquina hospitalaria 3 veces por semana.',
      estigma: 'Miedo al trasplante por mitos sobre donación de órganos en el Perú.',
      estrategiaAfrontamiento: [
        'Fomentar la cultura altruista de donación de órganos en el entorno escolar y familiar',
        'Apoyo emocional continuo para aceptar los cambios en la imagen corporal por catéteres o fístulas',
        'Acompañamiento por trabajadora social y psicólogo clínico en unidades de diálisis'
      ]
    },
    preguntasFrecuentes: [
      {
        pregunta: '¿Tomar mucha agua previene la enfermedad renal?',
        respuesta: 'Mantenerse hidratado es saludable para personas con riñones sanos, pero en pacientes con insuficiencia renal avanzada, el consumo de líquidos debe restringirse estrictamente por indicación del nefrólogo.'
      },
      {
        pregunta: '¿Los dolores en la espalda baja siempre son de los riñones?',
        respuesta: 'Casi nunca. Más del 90% de los dolores lumbares son musculares o de columna. Los riñones solo duelen en casos de cálculos que obstruyen o infecciones bacterianas agudas (pielonefritis con fiebre).'
      },
      {
        pregunta: '¿Por qué son tan peligrosos medicamentos como el ibuprofeno para los riñones?',
        respuesta: 'Los AINEs disminuyen bruscamente el flujo de sangre a los glomérulos renales, lo que puede precipitar una falla renal aguda irreversible si se toman de forma frecuente o sin supervisión.'
      }
    ],
    mitosYVerdades: [
      {
        mito: 'Si orino abundante cantidad, significa que mis riñones están 100% sanos y funcionando bien.',
        verdad: 'Falso. En muchas fases del daño renal, el riñón pierde la capacidad de concentrar la orina y la persona orina mucha agua transparente pero sin filtrar las toxinas urémicas de la sangre.'
      },
      {
        mito: 'La hemodiálisis acelera la muerte del paciente.',
        verdad: 'Falso. La hemodiálisis limpia la sangre y sustituye la función vital de los riñones; salva la vida de los pacientes permitiéndoles vivir muchos años.'
      },
      {
        mito: 'Los tés y brebajes de hierbas limpian y curan los riñones dañados.',
        verdad: 'Falso. Muchas hierbas caseras contienen altas concentraciones de potasio y sustancias tóxicas que sobrecargan y aceleran el daño renal irreversible.'
      }
    ],
    guiaNutricional: {
      recomendado: [
        'Agua natural calculada según el balance hídrico indicado por el médico',
        'Verduras y frutas con bajo contenido de potasio (manzana, pera, piña, lechuga, pepino)',
        'Proteínas de muy alta calidad biológica en porciones justas y pesadas (clara de huevo, pechuga)',
        'Aceite de oliva crudo y grasas saludables'
      ],
      evitar: [
        'Consumo excesivo de sal, conservas y alimentos procesados ricos en sodio',
        'Alimentos muy ricos en potasio si hay daño avanzado (plátano, naranja, palta, frutos secos)',
        'Bebidas gaseosas oscuras por su altísimo contenido de aditivos con fósforo inorgánico',
        'Suplementos de proteínas en polvo y creatina de gimnasio sin control nefrológico'
      ],
      consejoClave: 'La mejor protección para los riñones es mantener la presión arterial y la glucosa en valores normales.'
    },
    prevencion: [
      'Mantener un control estricto de la presión arterial (<130/80 mmHg) y de la glucosa en sangre',
      'No automedicarse nunca con antiinflamatorios (ibuprofeno, ketorolaco, naproxeno)',
      'Hacerse una prueba de orina para albúmina y creatinina en sangre una vez al año si tienes hipertensión o diabetes',
      'Mantener un peso adecuado y consumir una dieta baja en sal (<5 g/día)',
      'Evitar el tabaco, ya que duplica la velocidad de progresión del daño renal crónico',
      'Tratar oportunamente cualquier síntoma de infección urinaria con cultivo médico'
    ],
    cuandoConsultar: 'Aparición de orina espumosa con burbujas, hinchazón en párpados o piernas, o pérdida involuntaria de peso con palidez requiere evaluación médica inmediata con examen de orina y creatinina.',
    imagenUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=600&q=80',
    estadistica: 'Más de 3 millones de peruanos presentan algún grado de daño renal. Cerca del 90% lo ignora por ser una afección completamente silenciosa en sus inicios.',
    estadisticaValor: 10,
    fuenteMinsa: 'Guía de Práctica Clínica para el Diagnóstico y Tratamiento de la Enfermedad Renal Crónica · MINSA / EsSalud 2024',
    codigoCIE10: 'N18'
  },
  {
    id: 'salud-mental',
    nombre: 'Salud Mental y Trastornos Afectivos',
    subtitulo: 'Depresión Mayor, Trastornos de Ansiedad y Manejo del Estrés',
    categoria: 'Enfermedades No Transmisibles (DNT)',
    icono: 'happy-outline',
    emoji: '🧠',
    nivelRiesgo: 'Alto',
    colorAcento: '#8B5CF6',
    indicadorPeru: 'Prioridad #1 de salud escolar: más del 20% de adolescentes peruanos (MINSA / INSM)',
    factoresRiesgo: [
      'Acoso escolar (bullying y ciberacoso persistente)',
      'Violencia intrafamiliar o disfunción en el hogar',
      'Uso excesivo y problemático de redes sociales (>5 horas al día)',
      'Presión académica extrema y autoexigencia desmedida',
      'Consumo precoz de alcohol, tabaco o sustancias psicoactivas',
      'Aislamiento social y falta de red de apoyo familiar o de amistades'
    ],
    queEs: 'Afecciones neuropsiquiátricas crónicas caracterizadas por alteraciones sostenidas en el estado de ánimo, pensamiento y conducta que interfieren gravemente con la vida escolar, laboral y social. La OMS y el MINSA las catalogan formalmente como Daños No Transmisibles prioritarios, siendo el Trastorno Depresivo Mayor (CIE-10 F32) y los Trastornos de Ansiedad Generalizada y Pánico (CIE-10 F41) las principales causas de discapacidad en adolescentes.',
    fisiopatologia: 'Disfunción en los circuitos córtico-límbicos cerebrales (amígdala, hipocampo y corteza prefrontal) con desequilibrio en la neurotransmisión de serotonina, noradrenalina y dopamina. El estrés crónico promueve una neuroinflamación mediada por citocinas y reduce el factor neurotrófico derivado del cerebro (BDNF), provocando atrofia dendrítica en áreas reguladoras de las emociones.',
    causas: [
      'Factores biológicos y predisposición genética en el sistema monoaminérgico',
      'Exposición continua a ambientes de estrés psicofisiológico intenso sin mecanismos de afrontamiento',
      'Traumas psicológicos tempranos, negligencia o pérdidas afectivas significativas',
      'Distorsiones cognitivas negativas automáticas ("catastrofismo", "pensamiento todo o nada")',
      'Privación crónica de sueño por pantallas electrónicas hasta altas horas de la madrugada'
    ],
    sintomas: [
      'Tristeza profunda, vacío persistente o irritabilidad extrema en adolescentes casi todos los días',
      'Anhedonia: pérdida total de interés o placer en actividades, hobbies o deportes que antes disfrutaba',
      'Fatiga crónica, falta de energía y sensación de pesadez corporal constante',
      'Alteraciones del sueño: insomnio de conciliación o hipersomnia prolongada',
      'Dificultad marcada para concentrarse, recordar materias escolares o tomar decisiones simples',
      'Sentimientos desproporcionados de inutilidad, culpa excesiva o desesperanza sobre el futuro',
      'Ansiedad con taquicardias, temblores, sensación de nudo en la garganta o estómago'
    ],
    sintomasAlarma: [
      'Ideación suicida activa, pensamientos recurrentes de muerte o deseos explícitos de no despertar',
      'Conductas de autolesión física deliberada (cortes en brazos o piernas, quemaduras)',
      'Crisis de pánico agudas con sensación inminente de asfixia o muerte',
      'Aislamiento total y encierro continuo en la habitación sin querer comer ni comunicarse',
      'Abandono súbito y absoluto del cuidado e higiene personal'
    ],
    diagnostico: [
      'Entrevista clínica psiquiátrica y psicológica estructurada según criterios DSM-5 / CIE-11',
      'Escala de Depresión de Beck (BDI) y Escala de Hamilton para Depresión (HAM-D)',
      'Cuestionario PHQ-9 (Patient Health Questionnaire) validado por el MINSA para tamizaje escolar',
      'Escala de Ansiedad GAD-7 para detección de trastorno de ansiedad generalizada',
      'Descarte de patologías orgánicas subyacentes (hipotiroidismo, anemia severa, deficiencia de vitamina B12)'
    ],
    complicaciones: [
      'Riesgo de suicidio (segunda causa de muerte en adolescentes a nivel mundial)',
      'Deserción escolar y fracaso académico prematuro',
      'Consumo dependiente de sustancias adictivas (alcohol, marihuana, benzodiacepinas)',
      'Deterioro grave de las relaciones familiares e interpersonales',
      'Trastornos somatomorfos y agravamiento de otras ENT como diabetes y enfermedades cardíacas'
    ],
    tratamiento: {
      enfoque: [
        'Centros de Salud Mental Comunitaria (CSMC) del MINSA presentes en todo el Perú',
        'Psicoterapia de primera línea: Terapia Cognitivo-Conductual (TCC) e Interpersonal',
        'Farmacoterapia en casos moderados a severos bajo estricta indicación de psiquiatría (ISRS: Sertralina, Fluoxetina)',
        'Talleres de habilidades sociales, asertividad y regulación emocional escolar',
        'Terapia familiar sistémica para crear un entorno protector en el hogar'
      ],
      metasControl: [
        'Remisión completa de los síntomas depresivos y recuperación del disfrute cotidiano',
        'Cero ideación o conductas de autolesión',
        'Reincorporación plena y satisfactoria a la vida académica y social',
        'Desarrollo de resiliencia personal para enfrentar futuros estresores'
      ]
    },
    primerosAuxilios: {
      titulo: 'Primeros Auxilios Psicológicos (PAP) ante Crisis Emocional o Ansiedad Aguda',
      pasos: [
        '1. Escucha activa sin juzgar: no digas "pon de tu parte" ni "no estés triste"; valida su emoción diciendo "estoy aquí contigo, te escucho".',
        '2. Ante una crisis de pánico, aplica la técnica de respiración 4-7-8 (inhalar en 4 seg, retener 7 seg, exhalar en 8 seg) y la regla 5-4-3-2-1 de conexión sensorial con el presente.',
        '3. Si hay ideación suicida, NUNCA dejes sola a la persona ni guardes el secreto: avisa de inmediato a sus padres o tutores.',
        '4. Llama gratis a la Línea 113 Opción 5 del MINSA (Atención psicológica gratuita las 24 horas del día).',
        '5. Retira objetos peligrosos del alcance inmediato y acompaña con calma y serenidad.'
      ],
      recomendacionUrgente: 'Pedir ayuda para la mente es tan valiente y necesario como ir al médico por una pierna rota.'
    },
    casoClinico: {
      paciente: 'Camila T.',
      edad: '15 años (Estudiante de 4° de Secundaria en Lima)',
      motivoConsulta: 'Bajo rendimiento escolar súbito, crisis de llanto inexplicables y cortes superficiales en el antebrazo.',
      evolucionYTratamiento: 'Fue derivada al Centro de Salud Mental Comunitaria (CSMC) de su distrito. Recibió diagnóstico de Depresión Mayor reactiva a ciberacoso escolar. Inició Terapia Cognitivo-Conductual y la escuela activó el protocolo antibullying. Tras 3 meses, Camila recuperó su sonrisa, dejó las autolesiones y se integró al taller de arte.',
      mensajeEducativo: 'El silencio prolonga el dolor; acudir a un Centro de Salud Mental Comunitaria del MINSA salva vidas.'
    },
    escalaRiesgo: {
      nombre: 'Cuestionario de Salud del Paciente (Test PHQ-9 MINSA)',
      paraQueSirve: 'Tamizaje rápido para clasificar la severidad del episodio depresivo.',
      parametrosClave: [
        'Poco interés o alegría en hacer cosas',
        'Sentirse desanimado, deprimido o sin esperanzas',
        'Problemas para dormir o dormir demasiado',
        'Cansancio o poca energía',
        'Apetito disminuido o comer en exceso',
        'Sentirse mal consigo mismo o que ha decepcionado a su familia',
        'Dificultad para concentrarse',
        'Moverse o hablar muy lento, o estar excesivamente inquieto',
        'Pensamientos de que sería mejor estar muerto o hacerse daño'
      ],
      interpretacion: 'Puntaje 0-4: Mínimo. 5-9: Leve. 10-14: Moderado (requiere psicoterapia). 15-19: Moderadamente grave. 20-27: Depresión grave (urgencia psiquiátrica).'
    },
    saludMental: {
      desafioEmocional: 'La depresión no es una debilidad de carácter ni falta de fuerza de voluntad; es un desbalance neuroquímico real y tratable.',
      estigma: 'El temor a ser calificado de "loco" impide que 8 de cada 10 jóvenes peruanos con sufrimiento emocional reciban atención a tiempo.',
      estrategiaAfrontamiento: [
        'Acudir sin vergüenza al psicólogo o psiquiatra en centros MINSA (Línea 113 opción 5)',
        'Mantener rutinas fijas de sueño, ejercicio físico diario y desconexión de pantallas',
        'Compartir sentimientos con personas de confianza y practicar la autocompasión'
      ]
    },
    preguntasFrecuentes: [
      {
        pregunta: '¿Los antidepresivos cambian la personalidad o crean adicción?',
        respuesta: 'Falso. Los antidepresivos modernos (ISRS) no crean adicción ni dopan a la persona; su función es restaurar los niveles normales de neurotransmisores para que el cerebro vuelva a funcionar adecuadamente.'
      },
      {
        pregunta: '¿Hablar del suicidio incita a que la persona lo haga?',
        respuesta: 'No. Preguntar directamente con empatía "¿Has pensado en hacerte daño o quitarte la vida?" alivia la angustia del estudiante al sentirse escuchado y permite activar la red de protección médica.'
      },
      {
        pregunta: '¿La depresión se cura simplemente "echándole ganas"?',
        respuesta: 'No. Nadie le diría a un paciente con asma o diabetes que "le eche ganas" para curarse. La depresión requiere intervención psicoterapéutica profesional y hábitos saludables.'
      }
    ],
    mitosYVerdades: [
      {
        mito: 'La depresión en los adolescentes es solo una pose o ganas de llamar la atención.',
        verdad: 'Falso. Es una patología neuropsiquiátrica seria con alteraciones biológicas cerebrales demostradas que requiere atención médica profesional.'
      },
      {
        mito: 'Ir al psicólogo o psiquiatra significa que uno está completamente loco.',
        verdad: 'Falso. Los profesionales de la salud mental ayudan a superar crisis, duelos, ansiedad y depresión. Cuidar la mente es tan normal y necesario como cuidar los dientes.'
      },
      {
        mito: 'El ejercicio físico no tiene ningún efecto en la tristeza ni en la mente.',
        verdad: 'Falso. El ejercicio aeróbico libera endorfinas, serotonina y BDNF en el cerebro, actuando como un potente antidepresivo y ansiolítico natural comprobado por la ciencia.'
      }
    ],
    guiaNutricional: {
      recomendado: [
        'Alimentos ricos en triptófano (precursor de la serotonina): plátano, avena, huevo, frutos secos y semillas de girasol',
        'Pescados azules ricos en ácidos grasos Omega-3 (DHA/EPA), fundamentales para la fluidez de las membranas neuronales',
        'Alimentos fermentados y probióticos (yogur natural, kéfir) que protegen el eje intestino-cerebro',
        'Consumo de agua natural para prevenir la fatiga cognitiva por deshidratación leve'
      ],
      evitar: [
        'Bebidas energizantes con altas dosis de cafeína que disparan taquicardias y crisis de pánico',
        'Bebidas alcohólicas (es un depresor del sistema nervioso central que empeora la tristeza al día siguiente)',
        'Exceso de azúcares refinados que producen caídas bruscas de glucemia generando irritabilidad y desánimo'
      ],
      consejoClave: 'El 90% de la serotonina del cuerpo se produce en el intestino; una alimentación rica en fibra protege directamente tu estado de ánimo.'
    },
    prevencion: [
      'Dormir de 8 a 9 horas diarias continuas sin el celular en la cama',
      'Practicar al menos 45 a 60 minutos de actividad física al día (libera endorfinas y dopamina)',
      'Aprender a poner límites saludables al uso recreativo de redes sociales',
      'Cultivar amistades reales cara a cara y participar en actividades culturales o deportivas escolares',
      'Aprender técnicas de relajación, meditación mindfulness o respiración consciente',
      'Acudir al Centro de Salud Mental Comunitaria ante las primeras señales de tristeza persistente'
    ],
    cuandoConsultar: 'Sentimientos de desesperanza continuos por más de 2 semanas, pérdida del deseo de vivir, o si la ansiedad impide asistir al colegio o salir de casa, exige atención inmediata en salud mental (Línea 113 opción 5).',
    imagenUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    estadistica: '1 de cada 5 adolescentes en el Perú presenta un problema de salud mental. La detección oportuna y la terapia salvan vidas.',
    estadisticaValor: 20,
    fuenteMinsa: 'Dirección de Salud Mental · MINSA 2024 · Instituto Nacional de Salud Mental Honorio Delgado - Hideyo Noguchi',
    codigoCIE10: 'F32 - F41'
  }
];

/**
 * Las 4 Principales Enfermedades No Transmisibles oficiales según OMS y MINSA.
 * (Cardiovasculares, Cáncer, Respiratorias Crónicas y Diabetes Mellitus)
 */
export const ENFERMEDADES_PRINCIPALES: Enfermedad[] = ENFERMEDADES.slice(0, 4);

/**
 * Afecciones crónicas y factores de riesgo complementarios para la sección Descubrir.
 * (Obesidad, Enfermedad Renal Crónica, Salud Mental)
 */
export const ENFERMEDADES_COMPLEMENTARIAS: Enfermedad[] = ENFERMEDADES.slice(4);

