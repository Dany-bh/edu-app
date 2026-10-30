// src/lib/carneSalud.ts

export interface EvaluacionCarneItem {
  enfermedad: string;
  preAciertos: number;
  postAciertos: number;
  mejoraPorcentaje: number;
}

export interface DatosCarneSalud {
  nombreEstudiante: string;
  usuario: string;
  salon?: string | null;
  genero: string;
  fechaEmision: string;
  puntosXP: number;
  nivel: number;
  rango: string;
  rachaDias: number;
  imc?: number;
  categoriaImc?: string;
  evaluaciones?: EvaluacionCarneItem[];
  totalLogros: number;
}

/**
 * Genera el documento HTML completo y auto-contenido, optimizado para impresión A4/PDF
 * del Carné Escolar de Salud Preventiva en Enfermedades No Transmisibles.
 */
export function generarHtmlCarneSalud(datos: DatosCarneSalud): string {
  const evaluacionesHtml = (datos.evaluaciones && datos.evaluaciones.length > 0)
    ? datos.evaluaciones.map(ev => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600; text-transform: capitalize;">${ev.enfermedad}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: center;">${ev.preAciertos}/5</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #0F766E; font-weight: bold;">${ev.postAciertos}/5</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #16A34A; font-weight: bold;">+${ev.mejoraPorcentaje}%</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="4" style="padding: 12px; text-align: center; color: #64748B; font-style: italic;">
          Evaluaciones en curso. Continúa completando las fichas para registrar tus progresos.
        </td>
      </tr>
    `;

  const imcTexto = datos.imc ? `${datos.imc.toFixed(1)} kg/m²` : 'No registrado';
  const categoriaImcTexto = datos.categoriaImc || 'Pendiente de evaluación';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Carné Escolar de Salud Preventiva - ${datos.nombreEstudiante}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 3px solid #0F766E;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-titles h1 {
      font-size: 18px;
      color: #0F766E;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-titles h2 {
      font-size: 13px;
      color: #475569;
      margin: 3px 0 0 0;
      font-weight: 500;
    }
    .badge-oficial {
      background: #0F766E;
      color: #FFFFFF;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: bold;
      text-align: right;
    }
    .section-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #0F766E;
      margin-top: 0;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 6px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .info-item {
      margin-bottom: 6px;
    }
    .info-label {
      font-size: 10px;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 600;
    }
    .info-value {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
    }
    .stat-kpi {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
    }
    .stat-kpi-val {
      font-size: 18px;
      font-weight: bold;
      color: #0F766E;
      margin: 0;
    }
    .stat-kpi-lbl {
      font-size: 10px;
      color: #64748B;
      margin: 2px 0 0 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #E2E8F0;
      color: #334155;
      padding: 8px 12px;
      text-align: left;
      font-weight: 700;
    }
    .decalogo-list {
      margin: 0;
      padding-left: 18px;
      font-size: 11.5px;
      color: #334155;
    }
    .decalogo-list li {
      margin-bottom: 4px;
    }
    .footer-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 30px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px dashed #64748B;
      padding-top: 6px;
      font-size: 11px;
      color: #475569;
    }
  </style>
</head>
<body>

  <!-- Encabezado Oficial -->
  <div class="header">
    <div class="header-titles">
      <h1>Carné Escolar de Salud Preventiva</h1>
      <h2>Educación preventiva para adolescentes · Enfermedades No Transmisibles (ENT)</h2>
      <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748B;">
        MINSA / MINEDU · Estrategia Sanitaria Nacional de Prevención y Control de Daños No Transmisibles
      </p>
    </div>
    <div class="badge-oficial">
      PROYECTO EDUSALUD<br>
      <span style="font-size: 10px; font-weight: normal;">Emitido: ${datos.fechaEmision}</span>
    </div>
  </div>

  <!-- Ficha del Estudiante -->
  <div class="section-card">
    <h3 class="section-title">👤 Datos del Estudiante</h3>
    <div class="grid-4">
      <div class="info-item">
        <div class="info-label">Estudiante</div>
        <div class="info-value">${datos.nombreEstudiante}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Usuario / Código</div>
        <div class="info-value">@${datos.usuario}</div>
      </div>
      ${datos.salon?.trim() ? `
      <div class="info-item">
        <div class="info-label">Grado y Sección</div>
        <div class="info-value">${datos.salon}</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="info-label">Género</div>
        <div class="info-value">${datos.genero || 'Masculino'}</div>
      </div>
    </div>
  </div>

  <!-- Estado de Gamificación e Indicadores -->
  <div class="section-card">
    <h3 class="section-title">🏆 Constancia y Rendimiento en EduSalud</h3>
    <div class="grid-4">
      <div class="stat-kpi">
        <div class="stat-kpi-val">${datos.nivel}</div>
        <div class="stat-kpi-lbl">Nivel Actual</div>
      </div>
      <div class="stat-kpi">
        <div class="stat-kpi-val">${datos.puntosXP} XP</div>
        <div class="stat-kpi-lbl">Puntos Acumulados</div>
      </div>
      <div class="stat-kpi">
        <div class="stat-kpi-val">${datos.rachaDias} días 🔥</div>
        <div class="stat-kpi-lbl">Racha Activa</div>
      </div>
      <div class="stat-kpi">
        <div class="stat-kpi-val">${datos.totalLogros}/16 🏅</div>
        <div class="stat-kpi-lbl">Insignias Logradas</div>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 12px; color: #475569;">
      <strong>Rango de Salud Alcanzado:</strong> <span style="color: #0F766E; font-weight: bold;">${datos.rango}</span>
    </div>
  </div>

  <!-- Diagnóstico Antropométrico y Hábitos -->
  <div class="section-card">
    <h3 class="section-title">⚖️ Diagnóstico Antropométrico (Referencia OMS 2007)</h3>
    <div class="grid-2">
      <div>
        <div class="info-item">
          <div class="info-label">Índice de Masa Corporal (IMC)</div>
          <div class="info-value" style="font-size: 16px; color: #0F766E;">${imcTexto}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Clasificación Nutricional</div>
          <div class="info-value">${categoriaImcTexto}</div>
        </div>
      </div>
      <div style="font-size: 11.5px; color: #475569; background: #FFFFFF; padding: 10px; border-radius: 6px; border: 1px solid #E2E8F0;">
        <strong>Orientación Preventiva:</strong> En la adolescencia, el IMC se evalúa en percentiles según edad y sexo. Mantener un peso corporal adecuado protege el corazón y disminuye en 80% el riesgo de diabetes tipo 2 e hígado graso en la vida adulta.
      </div>
    </div>
  </div>

  <!-- Aprendizaje Clínico: Pre-Test vs Post-Test -->
  <div class="section-card">
    <h3 class="section-title">📊 Evidencia de Aprendizaje en Prevención de ENT</h3>
    <table>
      <thead>
        <tr>
          <th>Eje Temático</th>
          <th style="text-align: center;">Diagnóstico Inicial (Pre)</th>
          <th style="text-align: center;">Evaluación Final (Post)</th>
          <th style="text-align: center;">Incremento Cognitivo</th>
        </tr>
      </thead>
      <tbody>
        ${evaluacionesHtml}
      </tbody>
    </table>
  </div>

  <!-- Compromiso de Salud Preventiva del Estudiante -->
  <div class="section-card" style="margin-bottom: 0;">
    <h3 class="section-title">✍️ Compromisos de Vida Saludable</h3>
    <ol class="decalogo-list">
      <li><strong>Hidratación limpia:</strong> Priorizar agua natural y evitar gaseosas o bebidas con octógonos de "Alto en Azúcar".</li>
      <li><strong>Actividad diaria:</strong> Realizar 60 minutos de ejercicio aeróbico o deporte recreativo al día.</li>
      <li><strong>Alimentación viva:</strong> Incluir al menos 2 porciones de frutas y verduras frescas en el plato diario.</li>
      <li><strong>Protección vascular:</strong> Decir NO al consumo de vapeadores, tabaco y bebidas alcohólicas.</li>
      <li><strong>Descanso regenerativo:</strong> Respetar de 8 a 9 horas de sueño nocturno para cuidar el metabolismo.</li>
    </ol>
  </div>

  <!-- Firmas de Validación -->
  <div class="footer-signatures">
    <div>
      <div style="height: 35px;"></div>
      <div class="signature-line">
        <strong>${datos.nombreEstudiante}</strong><br>
        Firma del Estudiante · Compromiso Asumido
      </div>
    </div>
    <div>
      <div style="height: 35px;"></div>
      <div class="signature-line">
        <strong>Docente / Tutor de Aula</strong><br>
        Área de Ciencia y Tecnología / Educación Física
      </div>
    </div>
  </div>

</body>
</html>
  `.trim();
}
