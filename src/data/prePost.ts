// src/data/prePost.ts
import { PrePostPregunta } from '../types';

export const PRE_POST_DATA: Record<string, PrePostPregunta[]> = {
  cardiovasculares: [
    {
      id: 'cardio_1',
      pregunta: '¿Cuál es el valor considerado normal para la presión arterial en reposo en un adolescente o adulto?',
      opciones: [
        'Menor a 120/80 mmHg',
        '140/90 mmHg o superior',
        '160/100 mmHg constante',
        '80/40 mmHg en cualquier momento',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Según el MINSA y la OMS, una presión arterial óptima en reposo se sitúa por debajo de 120/80 mmHg.',
    },
    {
      id: 'cardio_2',
      pregunta: '¿Cuál de los siguientes es el principal factor de riesgo modificable para un infarto de miocardio?',
      opciones: [
        'Consumo excesivo de sodio, grasas saturadas y sedentarismo',
        'Beber agua pura antes de dormir',
        'Realizar caminatas diarias de 30 minutos',
        'El grupo sanguíneo de la persona',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La dieta alta en sal, grasas saturadas y la falta de actividad física aceleran el depósito de placas de ateroma en las arterias coronarias.',
    },
    {
      id: 'cardio_3',
      pregunta: 'Si una persona presenta dolor opresivo en el pecho irradiado al brazo izquierdo y dificultad para respirar, ¿qué se debe hacer?',
      opciones: [
        'Darle café cargado y esperar una hora',
        'Llamar de inmediato a emergencias (106 SAMU) o acudir al centro de salud',
        'Hacer que realice ejercicio intenso para abrir el pecho',
        'Acostarla boca abajo sin vigilarla',
      ],
      respuestaCorrecta: 1,
      explicacion: 'El dolor torácico opresivo es un signo de alarma de síndrome coronario agudo; el tiempo es vital para salvar músculo cardíaco.',
    },
    {
      id: 'cardio_4',
      pregunta: '¿Por qué a la hipertensión arterial se le conoce frecuentemente como el "asesino silencioso"?',
      opciones: [
        'Porque casi siempre avanza sin causar síntomas notorios hasta provocar una complicación grave',
        'Porque solo afecta a personas que duermen poco de noche',
        'Porque únicamente produce tos seca pasajera',
        'Porque desaparece espontáneamente sin tratamiento',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La hipertensión suele ser asintomática durante años mientras daña silenciosamente el corazón, cerebro y riñones.',
    },
    {
      id: 'cardio_5',
      pregunta: '¿Cuántos minutos semanales de actividad física aeróbica moderada recomienda la OMS para proteger el corazón?',
      opciones: [
        'Al menos 150 a 300 minutos semanales',
        'Solo 10 minutos al mes',
        '4 horas continuas una sola vez a la semana',
        'Ninguno, el reposo total es más beneficioso',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La OMS recomienda entre 150 y 300 minutos de ejercicio moderado a la semana para mantener vasos sanguíneos elásticos y saludables.',
    },
  ],

  cancer: [
    {
      id: 'cancer_1',
      pregunta: '¿Qué es el cáncer a nivel biológico celular?',
      opciones: [
        'Una multiplicación descontrolada y anómala de células que pueden invadir tejidos vecinos',
        'Una infección bacteriana pasajera provocada por cambios de clima',
        'Una deficiencia exclusiva de vitamina C en la sangre',
        'Una alergia hereditaria a los lácteos',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El cáncer se origina por mutaciones genéticas que alteran los mecanismos celulares de control de crecimiento y muerte programada.',
    },
    {
      id: 'cancer_2',
      pregunta: '¿Cuál es la medida de prevención primaria más efectiva contra el cáncer de cuello uterino?',
      opciones: [
        'La vacunación contra el Virus del Papiloma Humano (VPH)',
        'Tomar infusiones calientes en invierno',
        'Evitar el consumo de carbohidratos complejos',
        'Uso exclusivo de protector solar facial',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La vacuna contra el VPH aplicada en la etapa escolar previene las cepas de alto riesgo oncogénico responsables de la gran mayoría de casos.',
    },
    {
      id: 'cancer_3',
      pregunta: 'En la regla mnemotécnica "ABCDE" para evaluar lunares y prevenir melanoma, ¿qué significa la "A"?',
      opciones: [
        'Asimetría (una mitad del lunar no coincide con la otra)',
        'Antigüedad (edad del paciente en años)',
        'Área urbana de residencia',
        'Alergia a cosméticos',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La regla ABCDE evalúa Asimetría, Bordes irregulares, Color disparejo, Diámetro mayor a 6 mm y Evolución.',
    },
    {
      id: 'cancer_4',
      pregunta: '¿Qué porcentaje aproximado de las muertes por cáncer están vinculadas al consumo de tabaco y humo ajeno?',
      opciones: [
        'Cerca del 25% al 30% a nivel global',
        'Menos del 0.5%',
        'Exactamente el 100% de todos los tipos',
        'Ninguno, el tabaco no se asocia al cáncer',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El tabaco contiene decenas de carcinógenos comprobados y es el factor de riesgo evitable más letal para múltiples cánceres.',
    },
    {
      id: 'cancer_5',
      pregunta: '¿Cuál es la importancia del tamizaje y detección temprana del cáncer?',
      opciones: [
        'Permite detectar lesiones premalignas o etapas iniciales cuando el tratamiento es curativo y menos invasivo',
        'Sirve para reemplazar las vacunas obligatorias',
        'Garantiza que la persona nunca vuelva a enfermar de nada',
        'Solo se realiza cuando el paciente ya no tiene ninguna molestia',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Identificar el cáncer en etapas tempranas incrementa drásticamente las tasas de supervivencia y preserva la calidad de vida.',
    },
  ],

  respiratorias: [
    {
      id: 'resp_1',
      pregunta: '¿Cuál es la principal característica del asma bronquial?',
      opciones: [
        'Inflamación crónica de las vías respiratorias con hiperreactividad e hiperreactividad bronquial reversible',
        'Destrucción irreversible e instantánea de los alvéolos pulmonares',
        'Una infección por parásitos transmitida por el agua',
        'Rigidez en los músculos del cuello y mandíbula',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El asma causa inflamación, espasmo muscular y exceso de moco en los bronquios, provocando sibilancias y disnea.',
    },
    {
      id: 'resp_2',
      pregunta: '¿Cuál de los siguientes es el factor causante número uno de la Enfermedad Pulmonar Obstructiva Crónica (EPOC)?',
      opciones: [
        'El humo de tabaco y la exposición a humo de biomasa (leña)',
        'Consumir bebidas muy frías en verano',
        'La práctica de natación recreativa',
        'Dormir con las ventanas abiertas',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El humo del tabaco y la combustión de leña en cocinas sin ventilación dañan progresivamente el epitelio respiratorio.',
    },
    {
      id: 'resp_3',
      pregunta: '¿Qué sonido característico suele escucharse durante una crisis asmática cuando el aire pasa con dificultad?',
      opciones: [
        'Silbidos agudos o sibilancias al exhalar',
        'Chasquidos en las rodillas',
        'Latidos en el abdomen',
        'Un eco en los oídos sin respirar',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Las sibilancias son el sonido agudo producido por la turbulencia del aire al pasar por bronquios estrechados por broncoespasmo.',
    },
    {
      id: 'resp_4',
      pregunta: 'Durante una crisis de asma, ¿cuál es el medicamento de rescate de acción rápida más utilizado?',
      opciones: [
        'Broncodilatador de acción corta inhalado (como salbutamol)',
        'Antibióticos orales durante un mes',
        'Antiinflamatorios como el paracetamol en gotas',
        'Antihistamínicos para dormir',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El salbutamol inhalado relaja el músculo liso bronquial en pocos minutos aliviando la sensación de ahogo.',
    },
    {
      id: 'resp_5',
      pregunta: '¿Qué medida ambiental escolar disminuye los desencadenantes de crisis respiratorias en adolescentes?',
      opciones: [
        'Mantener aulas ventiladas, libres de polvo acumulado y sin humo de tabaco o aerosoles fuertes',
        'Pintar las paredes del salón con solventes durante las clases',
        'Cerrar herméticamente todas las puertas y ventanas del colegio',
        'Eliminar la educación física para todos los alumnos',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La ventilación adecuada y evitar alérgenos e irritantes químicos previene el desencadenamiento de crisis bronquiales.',
    },
  ],

  diabetes: [
    {
      id: 'diab_1',
      pregunta: '¿Qué hormona producida por el páncreas es la responsable de permitir que la glucosa ingrese a las células?',
      opciones: [
        'Insulina',
        'Adrenalina',
        'Tiroxina',
        'Melatonina',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La insulina es la llave biológica que abre los receptores celulares para que la glucosa sanguínea sea aprovechada como energía.',
    },
    {
      id: 'diab_2',
      pregunta: '¿Cuál es la tríada clásica de síntomas ("las 3 P") que sugiere hiperglucemia o diabetes no diagnosticada?',
      opciones: [
        'Poliuria (orinar mucho), polidipsia (mucha sed) y polifagia (hambre excesiva)',
        'Palpitaciones, picazón y pesadez en piernas',
        'Parálisis, palidez y picadura de insectos',
        'Pérdida de voz, pecho frío y presión baja',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El exceso de glucosa arrastra agua a la orina provocando deshidratación (sed intensa) y desnutrición celular (hambre y pérdida de peso).',
    },
    {
      id: 'diab_3',
      pregunta: 'En un análisis de glucosa en ayunas, ¿a partir de qué valor se considera diagnóstico presuntivo de diabetes?',
      opciones: [
        '126 mg/dL o superior en dos tomas diferentes',
        'Menor a 90 mg/dL',
        'Exactamente 70 mg/dL',
        'Más de 500 mg/dL únicamente',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El criterio internacional establece que una glucemia en ayunas >= 126 mg/dL confirmada en dos ocasiones diagnostica diabetes mellitus.',
    },
    {
      id: 'diab_4',
      pregunta: '¿Cuál es la diferencia principal entre la diabetes tipo 1 y la tipo 2?',
      opciones: [
        'La tipo 1 es autoinmune con déficit absoluto de insulina; la tipo 2 se asocia a resistencia a la insulina y estilo de vida',
        'La tipo 1 solo afecta a ancianos y la tipo 2 a bebés',
        'La tipo 1 se cura con agua y la tipo 2 con antibióticos',
        'No hay diferencia, son idénticas en causas y tratamiento',
      ],
      respuestaCorrecta: 0,
      explicacion: 'En la DM1 el sistema inmune destruye las células beta del páncreas; en la DM2 el cuerpo produce insulina pero las células son resistentes.',
    },
    {
      id: 'diab_5',
      pregunta: '¿Cuál es el mejor enfoque preventivo para evitar la diabetes tipo 2 en adolescentes?',
      opciones: [
        'Alimentación rica en fibra, reducción de ultraprocesados y al menos 60 minutos diarios de actividad física',
        'Consumir suplementos azucarados antes de dormir',
        'Pasar más de 6 horas continuas frente a pantallas de videojuegos',
        'Tomar jugos envasados en lugar de agua natural',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Mantener un peso adecuado mediante ejercicio regular y alimentos naturales previene la resistencia periférica a la insulina.',
    },
  ],

  obesidad: [
    {
      id: 'obes_1',
      pregunta: '¿Cómo define la Organización Mundial de la Salud (OMS) al sobrepeso y la obesidad?',
      opciones: [
        'Una acumulación anormal o excesiva de grasa corporal que representa un riesgo para la salud',
        'Tener músculos muy desarrollados por hacer pesas',
        'Una condición estética sin ninguna repercusión orgánica',
        'Retención temporal de líquidos durante el verano',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La obesidad es una enfermedad metabólica crónica caracterizada por el exceso de tejido adiposo y un estado inflamatorio de bajo grado.',
    },
    {
      id: 'obes_2',
      pregunta: 'En adultos, ¿qué valor de Índice de Masa Corporal (IMC) marca el inicio del rango de obesidad grado 1?',
      opciones: [
        '30.0 kg/m² o más',
        '18.5 kg/m²',
        '22.0 kg/m²',
        '15.0 kg/m²',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Un IMC de 25.0 a 29.9 se clasifica como sobrepeso, y a partir de 30.0 kg/m² se clasifica formalmente como obesidad.',
    },
    {
      id: 'obes_3',
      pregunta: '¿Por qué la grasa visceral (alrededor del abdomen) es más peligrosa que la grasa subcutánea?',
      opciones: [
        'Porque libera citoquinas inflamatorias y ácidos grasos directos al hígado, aumentando riesgo cardiovascular y metabólico',
        'Porque hace que la ropa quede más ajustada únicamente',
        'Porque bloquea los oídos y produce mareos al caminar',
        'Porque disminuye la memoria a corto plazo inmediatamente',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El tejido adiposo visceral es metabólicamente activo y secreta sustancias proinflamatorias que dañan arterias y órganos vitales.',
    },
    {
      id: 'obes_4',
      pregunta: '¿Qué son los alimentos "ultraprocesados" y por qué se relacionan con el sobrepeso?',
      opciones: [
        'Formulaciones industriales con alto contenido de azúcares añadidos, grasas saturadas, sodio y bajo valor nutricional',
        'Alimentos frescos cosechados en el día sin químicos',
        'Frutas y verduras lavadas antes de comer',
        'Granos andinos como quinua y kiwicha cocidos en casa',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Los ultraprocesados estimulan un consumo excesivo por su hiperpalatabilidad mientras aportan calorías vacías y nula saciedad.',
    },
    {
      id: 'obes_5',
      pregunta: '¿Cuál es la estrategia más saludable y sostenible para controlar el peso corporal en la adolescencia?',
      opciones: [
        'Adoptar hábitos saludables integrales: comida real, actividad física divertida, buen descanso y apoyo emocional sin dietas extremas',
        'Saltarse el desayuno y almorzar solo una manzana al día',
        'Consumir laxantes o pastillas quemagrasas de internet',
        'Pesar los alimentos en cada comida con angustia permanente',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Las dietas restrictivas extremas causan efecto rebote y dañan la relación con la comida; el cambio de estilo de vida familiar es la clave.',
    },
  ],

  'renal-cronica': [
    {
      id: 'renal_1',
      pregunta: '¿Cuál es la función biológica principal de los riñones en el cuerpo humano?',
      opciones: [
        'Filtrar la sangre eliminando desechos y exceso de líquidos, y regular la presión arterial y electrolitos',
        'Almacenar glucógeno para los músculos de las piernas',
        'Producir bilis para la digestión de las grasas',
        'Bombear sangre oxigenada hacia el cerebro',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Las nefronas filtran toxinas como urea y creatinina, controlan el sodio y potasio, y secretan eritropoyetina y renina.',
    },
    {
      id: 'renal_2',
      pregunta: '¿Cuáles son las dos principales causas de Enfermedad Renal Crónica (ERC) a nivel mundial?',
      opciones: [
        'Diabetes mellitus e Hipertensión arterial mal controladas',
        'Beber agua hervida y comer ensaladas frescas',
        'El frío en la espalda y caminar descalzo',
        'El consumo ocasional de frutas cítricas',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La glucosa alta y la presión arterial elevada dañan progresivamente los diminutos capilares glomerulares de filtración.',
    },
    {
      id: 'renal_3',
      pregunta: '¿Qué examen de orina simple permite detectar daño renal incipiente antes de que haya falla avanzada?',
      opciones: [
        'Detección de microalbuminuria o proteinuria (proteínas en orina)',
        'Prueba de aliento con glucosa',
        'Conteo de glóbulos rojos en saliva',
        'Radiografía de tórax',
      ],
      respuestaCorrecta: 0,
      explicacion: 'En condiciones sanas el riñón no deja escapar proteínas; hallar albúmina en orina es la señal temprana de daño glomerular.',
    },
    {
      id: 'renal_4',
      pregunta: '¿Por qué la automedicación frecuente con analgésicos antiinflamatorios (como ibuprofeno o ketorolaco) daña los riñones?',
      opciones: [
        'Porque reducen el flujo sanguíneo renal inhibiendo prostaglandinas protectoras',
        'Porque aumentan el tamaño de la vejiga instantáneamente',
        'Porque impiden la absorción de hierro en la garganta',
        'Porque provocan alergias en la piel únicamente',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El uso crónico e indiscriminado de AINEs disminuye la perfusión glomerular y puede provocar nefritis intersticial y falla renal.',
    },
    {
      id: 'renal_5',
      pregunta: '¿Cuánta agua natural se aconseja consumir al día para mantener una función renal óptima en jóvenes sanos?',
      opciones: [
        'Aproximadamente entre 1.5 y 2 litros al día según el nivel de actividad y clima',
        'Menos de 200 ml al día (un sorbo)',
        'Exactamente 10 litros diarios obligatorios',
        'Solo gaseosas o bebidas energizantes saborizadas',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Una hidratación adecuada facilita la dilución y eliminación de solutos y previene la formación de cálculos renales.',
    },
  ],

  'salud-mental': [
    {
      id: 'mental_1',
      pregunta: '¿Cómo define la OMS a la salud mental?',
      opciones: [
        'Un estado de bienestar mental que permite hacer frente a los momentos de estrés, desarrollar habilidades, aprender y contribuir a la comunidad',
        'La ausencia total de emociones como tristeza, enojo o miedo para siempre',
        'Tener una personalidad extrovertida y sonreír en todo momento',
        'Nunca requerir ayuda ni conversar de lo que uno siente',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La salud mental no es la ausencia de problemas, sino la capacidad adaptativa y el bienestar emocional, psicológico y social.',
    },
    {
      id: 'mental_2',
      pregunta: '¿Cuál es la diferencia entre una tristeza pasajera natural y un episodio depresivo clínico?',
      opciones: [
        'La depresión clínica persiste por más de dos semanas con pérdida de interés (anhedonia), desesperanza y afectación de la vida cotidiana',
        'La depresión se quita escuchando una canción alegre en 5 minutos',
        'La tristeza es una enfermedad bacteriana y la depresión es una fractura',
        'No existe ninguna diferencia; estar deprimido es solo una falta de voluntad',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La depresión es un trastorno médico real con bases neurobiológicas que requiere evaluación y acompañamiento profesional.',
    },
    {
      id: 'mental_3',
      pregunta: '¿Cuál de los siguientes es un síntoma común de ansiedad en adolescentes?',
      opciones: [
        'Preocupación constante excesiva, taquicardia, tensión muscular y dificultad para concentrarse',
        'Fiebre alta con tos productiva y flemas',
        'Manchas rojas en los codos después de comer pescado',
        'Aumento repentino de la estatura en una semana',
      ],
      respuestaCorrecta: 0,
      explicacion: 'La ansiedad activa la respuesta de alarma del sistema nervioso autónomo simpático produciendo síntomas físicos y cognitivos.',
    },
    {
      id: 'mental_4',
      pregunta: 'Si un compañero de colegio manifiesta ideas de no querer vivir o autolesionarse, ¿cuál es la acción correcta?',
      opciones: [
        'Escucharlo con empatía sin juzgar y avisar de inmediato a un tutor, psicólogo escolar o llamar al 113 opción 5',
        'Guardar el secreto para que no se moleste contigo',
        'Burlarse y decirle que solo busca llamar la atención',
        'Dejarlo solo y desconectar el teléfono',
      ],
      respuestaCorrecta: 0,
      explicacion: 'Las expresiones de ideación suicida o autolesión siempre deben tomarse en serio y comunicarse de inmediato a adultos protectores.',
    },
    {
      id: 'mental_5',
      pregunta: '¿Qué hábito protector ha demostrado científicamente fortalecer la resiliencia y el estado de ánimo?',
      opciones: [
        'Dormir 8 a 9 horas, realizar actividad física regular y mantener vínculos de amistad respetuosos',
        'Aislarse en el cuarto con el celular encendido toda la noche',
        'Consumir bebidas con alto contenido de cafeína y azúcar',
        'Guardarse todos los sentimientos sin compartirlos nunca',
      ],
      respuestaCorrecta: 0,
      explicacion: 'El sueño reparador, el ejercicio aeróbico que estimula endorfinas y el soporte social son pilares de la neuroprotección emocional.',
    },
  ],
};

/**
 * Obtiene las 5 preguntas fijas de pre/post test para una enfermedad.
 */
export function obtenerPreguntasPrePost(enfermedadId: string): PrePostPregunta[] {
  const clave = normalizarIdEnfermedad(enfermedadId);
  return PRE_POST_DATA[clave] || PRE_POST_DATA['cardiovasculares'];
}

export function normalizarIdEnfermedad(id: string): string {
  const clean = (id || '').toLowerCase().trim();
  if (clean.includes('cardio') || clean.includes('hipertension')) return 'cardiovasculares';
  if (clean.includes('cancer')) return 'cancer';
  if (clean.includes('respirat') || clean.includes('asma')) return 'respiratorias';
  if (clean.includes('diabet')) return 'diabetes';
  if (clean.includes('obesidad')) return 'obesidad';
  if (clean.includes('renal')) return 'renal-cronica';
  if (clean.includes('mental') || clean.includes('depresion')) return 'salud-mental';
  return 'cardiovasculares';
}
