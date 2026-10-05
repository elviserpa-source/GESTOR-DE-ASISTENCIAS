/**
 * SENA Analytics Dashboard - Official PDF Report Generator
 * Generates an institutional, high-resolution PDF report containing:
 * - Institutional Header (CCIT, Regional Córdoba, Protocol GFPI-PR-001 & Acuerdo 09 de 2024)
 * - Applied Filters Metadata (Ficha, Jornada, Riesgo, Rango de Fechas, Búsqueda)
 * - KPI Executive Scorecards (Global Attendance, Tardiness, Absences, GFPI-F-176 Alerts, Desertion Cases)
 * - Charts (Temporal Attendance Trend & GFPI-PR-001 Risk Factors Distribution)
 * - Complete Risk Matrix Table (Learners in Alphabetical order matching active filters)
 * - Official Signatures Block
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ficha, AprendizRiesgoSummary } from '../types/attendance';

export interface PDFReportData {
  fichas: Ficha[];
  filterFichaId: string;
  filterJornada: string;
  filterRiesgo: string;
  dateRangePreset: string;
  filterFechaInicio: string;
  filterFechaFin: string;
  searchLearner: string;
  learnerSummaries: AprendizRiesgoSummary[];
  kpis: {
    pctAsistenciaGlobal: number;
    pctRetardos: number;
    pctInasistencia: number;
    countAlertaPreventiva: number;
    countDesercion: number;
    totalP: number;
    totalR: number;
    totalNA: number;
    emailCount: number;
  };
  temporalTrend: Array<{ fecha: string; P: number; R: number; NA: number; total: number }>;
  causalesDistribution: Array<{ categoria: string; count: number; porcentaje: number; color: string }>;
  instructorConfig?: {
    nombre?: string;
    correoInstitucional?: string;
    centroFormacion?: string;
    regional?: string;
  };
}

export const generateDashboardPDF = (data: PDFReportData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Primary Institutional Colors
  const senaNavy = [0, 50, 77] as const;      // #00324D
  const senaGreen = [57, 169, 0] as const;    // #39A900
  const senaDarkGreen = [46, 136, 0] as const;// #2E8800
  const slateDark = [30, 41, 59] as const;    // #1E293B
  const slateMuted = [100, 116, 139] as const;// #64748B
  const bgLight = [248, 250, 252] as const;   // #F8FAFC

  let y = margin;

  // ==========================================
  // 1. INSTITUTIONAL HEADER BAR
  // ==========================================
  doc.setFillColor(...senaNavy);
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Green accent top line
  doc.setFillColor(...senaGreen);
  doc.rect(margin, y, contentWidth, 2, 'F');

  // SENA Mark block
  doc.setFillColor(...senaGreen);
  doc.roundedRect(margin + 3, y + 4.5, 15, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SENA', margin + 10.5, y + 13.5, { align: 'center' });

  // Main Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICIO NACIONAL DE APRENDIZAJE - SENA', margin + 22, y + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${data.instructorConfig?.centroFormacion || 'Centro de Comercio, Industria y Turismo (CCIT)'} — ${data.instructorConfig?.regional || 'Regional Córdoba'}`,
    margin + 22,
    y + 14
  );
  doc.text(
    'Dirección de Formación Profesional • Protocolo GFPI-PR-001 & Acuerdo 09 de 2024',
    margin + 22,
    y + 19
  );

  y += 28;

  // Title & Metadata Strip
  doc.setTextColor(...senaNavy);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME ANALÍTICO DE ASISTENCIA Y GESTIÓN DE DESERCIÓN', margin, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateMuted);
  const nowStr = new Date().toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${nowStr} | Instructor: ${data.instructorConfig?.nombre || 'Instructor Líder'} (${data.instructorConfig?.correoInstitucional || 'instructor@sena.edu.co'})`, margin, y + 4.5);

  y += 9;

  // ==========================================
  // 2. APPLIED FILTERS BOX (Conforme a la vista del Dashboard)
  // ==========================================
  doc.setFillColor(...bgLight);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  // Title of filters
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaDarkGreen);
  doc.text('FILTROS ACTIVOS APLICADOS EN ESTE REPORTE:', margin + 3, y + 4.5);

  // Determine Ficha Name
  const selectedFichaObj = data.fichas.find(f => f.id === data.filterFichaId);
  const fichaLabel = data.filterFichaId === 'ALL' 
    ? `Todas las Fichas (${data.fichas.length} grupos)` 
    : `${selectedFichaObj?.codigo || data.filterFichaId} - ${selectedFichaObj?.programa || ''}`;

  const hasSearch = Boolean(data.searchLearner && data.searchLearner.trim());
  const filterBoxHeight = hasSearch ? 22 : 18;

  doc.setFillColor(...bgLight);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, filterBoxHeight, 2, 2, 'FD');

  // Title of filters
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaDarkGreen);
  doc.text('FILTROS ACTIVOS APLICADOS EN ESTE REPORTE:', margin + 3, y + 4.5);

  // Filter columns
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);

  // Line 1 of filters
  doc.text(`• Ficha / Programa: ${fichaLabel}`, margin + 3, y + 9);
  doc.text(`• Jornada: ${data.filterJornada === 'ALL' ? 'Todas' : data.filterJornada}`, margin + 110, y + 9);

  // Line 2 of filters
  let riesgoText = 'Todos los estados';
  if (data.filterRiesgo === 'DESERCION_3_MAS') riesgoText = 'Causal Deserción (>=3 inasistencias)';
  else if (data.filterRiesgo === 'ALERTA_PREVENTIVA_1_2') riesgoText = 'Alerta Preventiva GFPI-F-176 (1-2 inasistencias)';
  else if (data.filterRiesgo === 'RETARDO') riesgoText = 'Solo con Retardos (R)';
  else if (data.filterRiesgo === 'NORMAL') riesgoText = 'Asistencia Normal (P)';

  let periodoText = 'Todo el Historial';
  if (data.dateRangePreset === '7D') periodoText = 'Últimos 7 días';
  else if (data.dateRangePreset === '30D') periodoText = 'Últimos 30 días';
  else if (data.dateRangePreset === 'CUSTOM') periodoText = `Del ${data.filterFechaInicio} al ${data.filterFechaFin}`;

  doc.text(`• Estado de Riesgo: ${riesgoText}`, margin + 3, y + 14);
  doc.text(`• Período evaluado: ${periodoText}`, margin + 85, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Aprendices Filtrados: ${data.learnerSummaries.length}`, margin + 145, y + 14);

  // Line 3 of filters if search was typed
  if (hasSearch) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(2, 132, 199);
    doc.text(`• Filtro de Búsqueda activo: "${data.searchLearner.trim()}"`, margin + 3, y + 18.5);
  }

  y += filterBoxHeight + 4;

  // ==========================================
  // 3. EXECUTIVE KPI METRICS (6 Box Cards)
  // ==========================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text('1. INDICADORES CLAVE DE ASISTENCIA Y RIESGO (KPIS)', margin, y);
  y += 3;

  const cardGap = 2.5;
  const numCards = 6;
  const cardWidth = (contentWidth - cardGap * (numCards - 1)) / numCards;
  const cardHeight = 16;

  const kpiCards = [
    { title: 'ASISTENCIA', value: `${data.kpis.pctAsistenciaGlobal}%`, sub: `${data.kpis.totalP} sesiones P`, border: [16, 185, 129], bg: [236, 253, 245], text: [4, 120, 87] },
    { title: 'RETARDOS', value: `${data.kpis.pctRetardos}%`, sub: `${data.kpis.totalR} marcaciones R`, border: [245, 158, 11], bg: [254, 243, 199], text: [180, 83, 9] },
    { title: 'INASISTENCIA', value: `${data.kpis.pctInasistencia}%`, sub: `${data.kpis.totalNA} faltas NA`, border: [239, 68, 68], bg: [254, 226, 226], text: [185, 28, 28] },
    { title: 'GFPI-F-176', value: `${data.kpis.countAlertaPreventiva}`, sub: '1-2 inasistencias', border: [249, 115, 22], bg: [255, 237, 213], text: [194, 65, 12] },
    { title: 'DESERCIÓN', value: `${data.kpis.countDesercion}`, sub: 'Art. 30 (>=3 continuas)', border: [225, 29, 72], bg: [255, 228, 230], text: [190, 18, 60] },
    { title: 'CORREOS', value: `${data.kpis.emailCount}`, sub: 'Outlook SENA', border: [59, 130, 246], bg: [239, 246, 255], text: [29, 78, 216] },
  ];

  kpiCards.forEach((kpi, index) => {
    const cardX = margin + index * (cardWidth + cardGap);
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Title
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.text[0], kpi.text[1], kpi.text[2]);
    doc.text(kpi.title, cardX + cardWidth / 2, y + 4, { align: 'center' });

    // Value
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, cardX + cardWidth / 2, y + 9.5, { align: 'center' });

    // Subtitle
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.sub, cardX + cardWidth / 2, y + 13.5, { align: 'center' });
  });

  y += cardHeight + 6;

  // ==========================================
  // 4. CHARTS SECTION (2 Vector Visualizations)
  // ==========================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text('2. GRÁFICAS DE COMPORTAMIENTO Y DISTRIBUCIÓN DE RIESGO', margin, y);
  y += 3;

  const chartBoxWidth = (contentWidth - 4) / 2;
  const chartBoxHeight = 44;

  // --- CHART 1: Temporal Trend Bar Chart ---
  const c1X = margin;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c1X, y, chartBoxWidth, chartBoxHeight, 2, 2, 'FD');

  // Chart 1 Header
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text('Tendencia Diaria de Asistencia (P / R / NA)', c1X + 4, y + 5);

  // Legend
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(57, 169, 0); // P (Green)
  doc.rect(c1X + chartBoxWidth - 36, y + 2.5, 3, 3, 'F');
  doc.setTextColor(...slateDark);
  doc.text('P', c1X + chartBoxWidth - 32, y + 5);

  doc.setFillColor(245, 158, 11); // R (Amber)
  doc.rect(c1X + chartBoxWidth - 25, y + 2.5, 3, 3, 'F');
  doc.text('R', c1X + chartBoxWidth - 21, y + 5);

  doc.setFillColor(239, 68, 68); // NA (Red)
  doc.rect(c1X + chartBoxWidth - 14, y + 2.5, 3, 3, 'F');
  doc.text('NA', c1X + chartBoxWidth - 10, y + 5);

  // Baseline
  const chartBottomY = y + chartBoxHeight - 7;
  const chartPlotHeight = 27;
  doc.setDrawColor(203, 213, 225);
  doc.line(c1X + 8, chartBottomY, c1X + chartBoxWidth - 6, chartBottomY);

  // Render bars for available dates
  const trendSlice = data.temporalTrend.slice(-6); // Last 6 days for clean spacing
  const colWidth = (chartBoxWidth - 18) / Math.max(trendSlice.length, 1);

  trendSlice.forEach((t, i) => {
    const barBaseX = c1X + 10 + i * colWidth;
    const totalDay = t.total || 1;
    const pFrac = t.P / totalDay;
    const rFrac = t.R / totalDay;
    const naFrac = t.NA / totalDay;

    const pHeight = pFrac * chartPlotHeight;
    const rHeight = rFrac * chartPlotHeight;
    const naHeight = naFrac * chartPlotHeight;

    const barW = Math.min(colWidth * 0.65, 8);
    let curY = chartBottomY;

    // Segment P (Green)
    if (pHeight > 0) {
      doc.setFillColor(57, 169, 0);
      doc.rect(barBaseX, curY - pHeight, barW, pHeight, 'F');
      curY -= pHeight;
    }
    // Segment R (Amber)
    if (rHeight > 0) {
      doc.setFillColor(245, 158, 11);
      doc.rect(barBaseX, curY - rHeight, barW, rHeight, 'F');
      curY -= rHeight;
    }
    // Segment NA (Red)
    if (naHeight > 0) {
      doc.setFillColor(239, 68, 68);
      doc.rect(barBaseX, curY - naHeight, barW, naHeight, 'F');
      curY -= naHeight;
    }

    // Date label
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateMuted);
    const shortDate = t.fecha.split('-').slice(1).join('/');
    doc.text(shortDate, barBaseX + barW / 2, chartBottomY + 3.5, { align: 'center' });
  });

  // --- CHART 2: Risk Factors Distribution (Protocol GFPI-PR-001) ---
  const c2X = margin + chartBoxWidth + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c2X, y, chartBoxWidth, chartBoxHeight, 2, 2, 'FD');

  // Chart 2 Header
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text('Distribución Factores de Riesgo (GFPI-PR-001)', c2X + 4, y + 5);

  // Horizontal bar list of risk categories
  const topCausales = data.causalesDistribution.slice(0, 5);
  const maxCount = Math.max(...topCausales.map(c => c.count), 1);
  const barStartY = y + 9;
  const barRowH = 6;
  const maxBarLength = chartBoxWidth - 36;

  topCausales.forEach((cat, idx) => {
    const rowY = barStartY + idx * barRowH;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateDark);
    
    // Category name truncated
    const catLabel = cat.categoria.length > 17 ? cat.categoria.substring(0, 16) + '..' : cat.categoria;
    doc.text(catLabel, c2X + 4, rowY + 3.5);

    // Bar background
    const barStartX = c2X + 26;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barStartX, rowY + 0.8, maxBarLength, 3.5, 0.8, 0.8, 'F');

    // Bar fill
    const fillW = Math.max((cat.count / maxCount) * maxBarLength, cat.count > 0 ? 3 : 0);
    doc.setFillColor(57, 169, 0); // SENA Green
    if (cat.categoria.includes('Económico')) doc.setFillColor(245, 158, 11);
    if (cat.categoria.includes('Laboral') || cat.categoria.includes('Académico')) doc.setFillColor(59, 130, 246);
    if (cat.categoria.includes('Salud') || cat.categoria.includes('Personal')) doc.setFillColor(239, 68, 68);
    
    if (fillW > 0) {
      doc.roundedRect(barStartX, rowY + 0.8, fillW, 3.5, 0.8, 0.8, 'F');
    }

    // Number + percentage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(...slateDark);
    doc.text(`${cat.count} (${cat.porcentaje}%)`, barStartX + maxBarLength + 1.5, rowY + 3.5);
  });

  y += chartBoxHeight + 6;

  // ==========================================
  // 5. APPRENTICE RISK SEMAPHORIC MATRIX TABLE
  // ==========================================
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text(
    `3. MATRIZ SEMAFÓRICA DE SEGUIMIENTO (Orden Alfabético por Nombre) [${data.learnerSummaries.length} Registros]`,
    margin,
    y
  );
  y += 2.5;

  // Build table data rows
  const tableRows = data.learnerSummaries.length > 0 
    ? data.learnerSummaries.map((s, index) => {
        let estadoProtocoloLabel = 'Asistencia Regular';
        if (s.estadoCalculado === 'DESERCION_3_MAS') estadoProtocoloLabel = 'DESERCIÓN (Art. 30)';
        else if (s.estadoCalculado === 'ALERTA_PREVENTIVA_1_2') estadoProtocoloLabel = 'Alerta GFPI-F-176';
        else if (s.estadoCalculado === 'RETARDO') estadoProtocoloLabel = 'Retardos (R)';
        else if (s.estadoCalculado === 'JUSTIFICADA') estadoProtocoloLabel = 'Justificada (Art. 22)';

        let accionRecomendada = 'Registro normal';
        if (s.estadoCalculado === 'DESERCION_3_MAS') accionRecomendada = 'Diligenciar Reporte Deserción Grupal';
        else if (s.estadoCalculado === 'ALERTA_PREVENTIVA_1_2') accionRecomendada = 'Diligenciar Formato GFPI-F-176';
        else if (s.estadoCalculado === 'RETARDO') accionRecomendada = 'Enviar Exhortación Outlook';
        else if (s.estadoCalculado === 'JUSTIFICADA') accionRecomendada = 'Excusa médica / soporte validado';

        return [
          (index + 1).toString(),
          `${s.aprendiz.nombres} ${s.aprendiz.apellidos}`,
          `${s.aprendiz.tipoDocumento} ${s.aprendiz.documento}`,
          s.ficha.codigo,
          s.aprendiz.estadoSena || 'EN FORMACION',
          `${s.tasaAsistencia}%`,
          `${s.totalAsistencias}/${s.totalRetardos}/${s.totalInasistencias}${s.totalInasistenciasJustificadas > 0 ? `/${s.totalInasistenciasJustificadas}J` : ''}`,
          s.inasistenciasConsecutivas.toString(),
          estadoProtocoloLabel,
          accionRecomendada
        ];
      })
    : [
        [
          '-',
          'No se encontraron aprendices con los filtros seleccionados',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          'Sin registros',
          'Modifique o borre los filtros en el dashboard'
        ]
      ];

  autoTable(doc, {
    startY: y,
    head: [[
      'No.',
      'Aprendiz (A-Z)',
      'Documento',
      'Ficha',
      'Estado',
      '% Asist.',
      'P/R/NA',
      'Faltas Seg.',
      'Estado Protocolo',
      'Acción Metodológica'
    ]],
    body: tableRows,
    theme: 'grid',
    margin: { left: margin, right: margin, bottom: 20 },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [0, 50, 77], // SENA Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { fontStyle: 'bold', cellWidth: 35 },
      2: { cellWidth: 20 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 12 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      8: { fontStyle: 'bold', cellWidth: 24 },
      9: { cellWidth: 'auto' }
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        const row = data.row.raw as string[];
        const estado = row[8];
        // Color coding for Protocol status column
        if (data.column.index === 8) {
          if (estado?.includes('DESERCIÓN')) {
            data.cell.styles.textColor = [190, 18, 60];
            data.cell.styles.fillColor = [255, 228, 230];
          } else if (estado?.includes('Alerta')) {
            data.cell.styles.textColor = [194, 65, 12];
            data.cell.styles.fillColor = [255, 237, 213];
          } else if (estado?.includes('Retardos')) {
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fillColor = [254, 243, 199];
          } else {
            data.cell.styles.textColor = [4, 120, 87];
            data.cell.styles.fillColor = [236, 253, 245];
          }
        }
      }
    },
    didDrawPage: function(dataHook) {
      // Footer page numbering on every page
      const str = `Página ${dataHook.pageNumber}`;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `SENA Asiste & Previene • Protocolo GFPI-PR-001 • Regional Córdoba`,
        margin,
        pageHeight - 6
      );
      doc.text(str, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }
  });

  // End of document: Institutional Signatures
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : y + 20;

  // If table ended too close to bottom, add new page for signature block
  if (finalY > pageHeight - 35) {
    doc.addPage();
    finalY = margin + 10;
  }

  // Signature lines
  const sigW = 60;
  const sig1X = margin + 15;
  const sig2X = pageWidth - margin - sigW - 15;

  doc.setDrawColor(100, 116, 139);
  doc.line(sig1X, finalY + 14, sig1X + sigW, finalY + 14);
  doc.line(sig2X, finalY + 14, sig2X + sigW, finalY + 14);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text(data.instructorConfig?.nombre || 'Instructor Responsable', sig1X + sigW / 2, finalY + 18, { align: 'center' });
  doc.text('Coordinador(a) Misional / Académica', sig2X + sigW / 2, finalY + 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...slateMuted);
  doc.text('Equipo Ejecutor de la Formación', sig1X + sigW / 2, finalY + 21.5, { align: 'center' });
  doc.text('Revisión & Trámite Administrativo', sig2X + sigW / 2, finalY + 21.5, { align: 'center' });

  // Generate and download PDF
  const filename = `Reporte_Analitico_SENA_${data.filterFichaId !== 'ALL' ? selectedFichaObj?.codigo || 'Ficha' : 'Consolidado'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
