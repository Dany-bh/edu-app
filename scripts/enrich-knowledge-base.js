// scripts/enrich-knowledge-base.js
const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'src', 'assets', 'knowledgeBase.json');
let existingKb = [];
if (fs.existsSync(kbPath)) {
  existingKb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
}

console.log(`Knowledge Base actual tiene ${existingKb.length} fragmentos.`);

// Nuevos fragmentos clínicos y estadísticos de alta densidad oficial
const newDNTChunks = [
  {
    id: "dnt_hipertension_clinica",
    source: "Manual Prevención No Transmisibles MINSA 2025 & Documento Técnico DNT",
    category: "Enfermedades No Transmisibles (DNT)",
    page: 29,
    codes: ["I10", "R030", "5001508"],
    keywords: ["hipertensión arterial", "presión alta", "sistólica", "diastólica", "140/90", "minsa", "asesino silencioso", "acv", "infarto", "daño renal", "sal", "sodio"],
    content: "HIPERTENSIÓN ARTERIAL (DNT - MINSA PERÚ):\nDefinición: Enfermedad crónica donde la presión sanguínea en arterias se mantiene elevada de forma sostenida (≥140/90 mmHg en 2 o más tomas en días distintos). Obliga al corazón a mayor esfuerzo y lesiona vasos sanguíneos.\nComplicaciones mayores: Infarto agudo de miocardio, accidente cerebrovascular (ACV), insuficiencia renal crónica (ERC), retinopatía hipertensiva.\nSíntomas: Generalmente asintomática ('asesino silencioso'). En crisis: cefalea occipital pulsátil, mareos, acúfenos (zumbidos), escotomas (visión borrosa), palpitaciones.\nCriterios de Urgencia/Emergencia MINSA: PA Sistólica ≥180 mmHg o Diastólica ≥110 mmHg. Es emergencia si hay daño agudo de órgano blanco (cerebro, corazón, riñón).\nPrevención y Tratamiento: Reducir sal a <5g/día (<2g de sodio), eliminar ultraprocesados, peso saludable (IMC <25), 150 min/semana de ejercicio aeróbico, no fumar, moderar alcohol."
  },
  {
    id: "dnt_diabetes_mellitus_clinica",
    source: "Manual Prevención No Transmisibles MINSA 2025 & Documento Técnico DNT",
    category: "Enfermedades No Transmisibles (DNT)",
    page: 37,
    codes: ["E11", "E10", "E119", "5001508"],
    keywords: ["diabetes mellitus", "glucosa", "insulina", "tipo 2", "tipo 1", "hiperglicemia", "126 mg/dl", "ayunas", "poliuria", "polidipsia", "polifagia", "pie diabético", "retinopatía"],
    content: "DIABETES MELLITUS (DNT - MINSA PERÚ):\nDefinición: Alteración metabólica caracterizada por hiperglucemia crónica debida a defectos en la secreción o acción de la insulina. En adolescentes predomina la Tipo 1 (autoinmune), pero la Tipo 2 se ha incrementado por sobrepeso y sedentarismo.\nCriterios diagnósticos MINSA: Glucosa en ayunas (8h) ≥126 mg/dL en dos ocasiones; o glucosa al azar ≥200 mg/dL con síntomas clásicos; o prueba de tolerancia a la glucosa oral (PTGO) ≥200 mg/dL a las 2 horas; o HbA1c ≥6.5%.\nSíntomas clásicos (4P): Poliuria (orina excesiva), Polidipsia (sed intensa), Polifagia (hambre voraz), Pérdida de peso involuntaria, además de astenia y visión borrosa.\nComplicaciones crónicas: Microvasculares (retinopatía, nefropatía, neuropatía diabética) y Macrovasculares (infarto, ACV, arteriopatía periférica, pie diabético).\nPrevención y Control: Tamizaje anual en personas con sobrepeso o antecedentes; alimentación balanceada con baja carga glucémica y fibra; 60 min diarios de actividad física en jóvenes."
  },
  {
    id: "dnt_acv_cerebrovascular",
    source: "Guía de Práctica Clínica ACV - MINSA & Documento Técnico DNT",
    category: "Enfermedades No Transmisibles (DNT)",
    page: 1,
    codes: ["I64", "I63", "I61"],
    keywords: ["acv", "accidente cerebrovascular", "ataque cerebral", "ictus", "isquémico", "hemorrágico", "fast", "camaleón", "parálisis facial", "debilidad", "4.5 horas", "trombólisis"],
    content: "ATAQUE CEREBROVASCULAR (ACV / ICTUS - MINSA PERÚ):\nDefinición: Emergencia médica causada por la interrupción brusca del flujo sanguíneo a una parte del cerebro (ACV Isquémico, 85%) o por la ruptura de un vaso cerebral (ACV Hemorrágico, 15%), privando a las neuronas de oxígeno.\nSignos de Alarma - Escala Rápida CAMALEÓN / FAST:\n1. CA (Cara caída o asimétrica al sonreír).\n2. MA (Mano o brazo débil, no puede levantarlo).\n3. LE (Lengua trabada o habla incomprensible).\n4. ON (¡Ponerse en acción! Acudir a emergencias de inmediato).\nVentana Terapéutica Crítica: Las primeras 4.5 horas desde el inicio de los síntomas permiten aplicar tratamiento trombolítico en hospital para disolver el coágulo y salvar tejido cerebral.\nFactores de riesgo: Hipertensión arterial (principal causa), diabetes, tabaquismo, fibrilación auricular, dislipidemia y sedentarismo."
  },
  {
    id: "dnt_enfermedad_renal_cronica",
    source: "Manual Prevención No Transmisibles MINSA 2025 & Documento Técnico DNT",
    category: "Enfermedades No Transmisibles (DNT)",
    page: 48,
    codes: ["N18", "N181", "N185", "82565"],
    keywords: ["enfermedad renal crónica", "erc", "riñón", "creatinina", "microalbuminuria", "filtrado glomerular", "ckd-epi", "diálisis", "nefropatía", "hipertensión", "diabetes"],
    content: "ENFERMEDAD RENAL CRÓNICA (ERC - MINSA PERÚ):\nDefinición: Deterioro progresivo e irreversible de la función renal durante más de 3 meses, evidenciado por daño estructural (albuminuria) o disminución de la tasa de filtración glomerular estimada (TFGe <60 mL/min/1.73m²).\nEtiología principal: Diabetes Mellitus (Nefropatía diabética, 40%) e Hipertensión Arterial (Nefroangioesclerosis, 30%).\nEtapas de la ERC (MINSA):\n- Etapa 1: Daño renal con TFGe normal (≥90) [N18.1]\n- Etapa 2: TFGe levemente disminuida (60-89) [N18.2]\n- Etapa 3a/3b: TFGe moderadamente disminuida (30-59) [N18.3]\n- Etapa 4: TFGe severamente disminuida (15-29) [N18.4]\n- Etapa 5: Insuficiencia renal terminal (TFGe <15) que requiere diálisis o trasplante [N18.5].\nTamizaje MINSA: Dosaje anual de Creatinina sérica y Cociente Albúmina/Creatinina en orina en todo paciente con factores de riesgo."
  },
  {
    id: "dnt_alimentacion_saludable_guia",
    source: "Guías Alimentarias para la Población Peruana - INS/MINSA & OMS",
    category: "Prevención y Nutrición DNT",
    page: 1,
    codes: ["99401", "99401.33", "Z713"],
    keywords: ["alimentación saludable", "nutrición", "minsa", "oms", "frutas y verduras", "sodio", "azúcar", "grasas trans", "ultraprocesados", "octógonos", "4 principios", "adecuación", "equilibrio", "moderación", "diversidad"],
    content: "ALIMENTACIÓN SALUDABLE PARA PREVENIR ENFERMEDADES NO TRANSMISIBLES (INS/MINSA/OMS):\nCuatro Principios Fundamentales:\n1. Adecuación: Aportar energía y nutrientes acordes a la edad y requerimiento biológico.\n2. Equilibrio: Proporción balanceada de carbohidratos complejos, proteínas de alto valor y grasas insaturadas.\n3. Moderación: Evitar excesos de calorías, azúcares añadidos, sal y grasas saturadas.\n4. Diversidad: Incluir alimentos de todos los grupos naturales y colores variados.\nReglas de Oro del MINSA:\n- Consumir al menos 5 porciones (400 gramos) al día de frutas y verduras frescas.\n- Reducir el consumo de sal a menos de 5 gramos diarios (1 cucharadita rasante) para prevenir hipertensión.\n- Evitar bebidas azucaradas, gaseosas y comida chatarra con octógonos de advertencia.\n- Preferir grasas saludables: palta, pescado azul (bonito, caballa, jurel con omega-3), frutos secos y aceite de oliva.\n- Mantenerse hidratado con 6 a 8 vasos de agua pura al día."
  },
  {
    id: "dnt_estadisticas_endes_2024_2025",
    source: "INEI - Encuesta Demográfica y de Salud Familiar (ENDES 2024 / Publicación Mayo 2025)",
    category: "Estadísticas Oficiales Perú",
    page: 23,
    codes: ["ENDES-2024", "INEI-DNT"],
    keywords: ["estadísticas", "endes 2024", "endes 2025", "perú", "inei", "prevalencia", "hipertensión", "diabetes", "sobrepeso", "obesidad", "frutas", "verduras", "alcohol", "tabaco", "salud mental", "depresión"],
    content: "PRINCIPALES INDICADORES ESTADÍSTICOS DE DNT EN EL PERÚ (ENDES 2024 - 2025):\n1. Hipertensión Arterial: Afecta al 22.1% de personas de 15 a más años en el Perú (Costa 24.3%, Lima Metropolitana 25.1%, Selva 19.5%, Sierra 18.2%). De ellos, solo el 68% diagnosticado recibe tratamiento regular.\n2. Diabetes Mellitus: Prevalencia diagnosticada de 5.3% en personas de 15 a más años, concentrada principalmente en la Costa (6.1%) y Lima (6.4%).\n3. Exceso de Peso (Sobrepeso + Obesidad): Alcanza al 63.1% de la población peruana de 15 y más años. La obesidad sola alcanza el 26.2%. En adolescentes (12-17 años) el exceso de peso llega al 38.4%.\n4. Consumo de Frutas y Verduras: Solo el 11.4% de peruanos cumple la meta de consumir al menos 5 porciones al día. El promedio nacional de consumo de verduras es de apenas 2.8 días por semana.\n5. Tabaquismo y Alcohol: El 10.8% de personas fuma actualmente cigarrillos. El 18.5% tuvo al menos un episodio de consumo excesivo de alcohol en el último mes.\n6. Salud Mental: 14.8% de adolescentes y jóvenes reportaron haber presentado síntomas de episodio depresivo en los últimos 14 días."
  },
  {
    id: "minsa_paquete_integral_adolescente",
    source: "Manual de Salud de la Etapa de Vida Adolescente (MINSA - NTS N° 157-MINSA/2020/DGIESP)",
    category: "Normas Técnicas MINSA",
    page: 12,
    codes: ["99384", "Z003", "96150", "99401"],
    keywords: ["evaluación integral", "adolescente", "ficha integral", "99384", "z003", "salud psicosocial", "salud bucal", "salud visual", "salud sexual", "vacunas", "anemia"],
    content: "PAQUETE DE ATENCIÓN INTEGRAL DE SALUD DEL ADOLESCENTE (MINSA PERÚ):\nComponentes Obligatorios (12 a 17 años):\n1. Evaluación del Crecimiento y Estado Nutricional: Peso, talla, cálculo de IMC (según tablas percentilares OMS para la edad), perímetro abdominal y despistaje de anemia (dosaje de hemoglobina).\n2. Tamizaje de Salud Mental (Código 96150): Cuestionario de identificación de factores de riesgo psicosocial, tamizaje de violencia familiar, depresión, ansiedad, consumo de sustancias e ideación suicida.\n3. Evaluación de Salud Sexual y Reproductiva: Orientación y consejería diferenciada, vacuna contra el Virus del Papiloma Humano (VPH), prevención de embarazo no planificado e ITS.\n4. Evaluación de Salud Ocular y Bucal: Agudeza visual con cartilla de Snellen, odontograma y fluorización.\n5. Vacunación Completa del Adolescente: dT (Difteria/Tétanos), Hepatitis B, Influenza y VPH."
  }
];

// Unir asegurando que no se dupliquen IDs
const existingIds = new Set(existingKb.map(k => k.id));
let addedCount = 0;

for (const chunk of newDNTChunks) {
  if (!existingIds.has(chunk.id)) {
    existingKb.push(chunk);
    existingIds.add(chunk.id);
    addedCount++;
  } else {
    // Actualizar contenido existente
    const idx = existingKb.findIndex(k => k.id === chunk.id);
    if (idx !== -1) {
      existingKb[idx] = chunk;
    }
  }
}

fs.writeFileSync(kbPath, JSON.stringify(existingKb, null, 2), 'utf8');
console.log(`Knowledge Base enriquecida: ${addedCount} fragmentos nuevos agregados. Total ahora: ${existingKb.length} fragmentos.`);
