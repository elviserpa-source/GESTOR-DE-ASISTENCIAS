/**
 * SENA Ficha Closure Official PDF Generator
 * Genera el Informe Oficial de Cierre de Ficha de Formación previo a su eliminación.
 * Incluye:
 * 1. Encabezado institucional SENA y caracterización de la ficha.
 * 2. Cuadro de mando ejecutivo con las métricas consolidadas del grupo.
 * 3. Tabla detallada con nombres y fechas exactas de las inasistencias injustificadas registradas.
 * 4. Firmas de responsabilidad institucional de cierre y entrega académica.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ficha, Aprendiz, RegistroAsistencia, FormatoGFPI176Item, FormatoDesercionItem } from '../types/attendance';
import { InstructorConfig } from '../db/senaDatabase';
import { calculateAprendizSummary } from './attendanceLogic';

export interface FichaClosurePDFOptions {
  ficha: Ficha;
  aprendices: Aprendiz[];
  asistencias: RegistroAsistencia[];
  gfpiRecords: FormatoGFPI176Item[];
  desercionRecords: FormatoDesercionItem[];
  instructorConfig: InstructorConfig;
}

export const generateFichaClosurePDF = ({
  ficha,
  aprendices,
  asistencias,
  gfpiRecords,
  desercionRecords,
  instructorConfig
}: FichaClosurePDFOptions): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // SENA Institutional Brand Palette
  const senaNavy = [0, 50, 77] as const;      // #00324D
  const senaGreen = [57, 169, 0] as const;    // #39A900
  const slateDark = [30, 41, 59] as const;    // #1E293B
  const slateMuted = [100, 116, 139] as const;// #64748B
  const roseRed = [225, 29, 72] as const;     // #E11D48

  // Filter records specifically for this ficha
  const fichaAprendices = aprendices.filter(a => a.fichaId === ficha.id);
  const fichaAsistencias = asistencias.filter(r => r.fichaId === ficha.id);
  const fichaGfpi = gfpiRecords.filter(r => r.fichaId === ficha.id);
  const fichaDesercion = desercionRecords.filter(r => r.fichaId === ficha.id);

  // Compute metrics
  const totalAprendices = fichaAprendices.length;
  const activeLearners = fichaAprendices.filter(a => {
    const estado = (a.estadoSena || '').toUpperCase();
    return estado === 'EN FORMACION' || estado === 'EN FORMACIÓN' || estado === '';
  });

  // Distinct dates evaluated
  const distinctDates = Array.from(new Set(fichaAsistencias.map(r => r.fecha))).sort();
  const totalSesiones = distinctDates.length;

  const totalP = fichaAsistencias.filter(r => r.estado === 'P').length;
  const totalR = fichaAsistencias.filter(r => r.estado === 'R').length;
  const totalNA = fichaAsistencias.filter(r => r.estado === 'NA').length;
  const totalJ = fichaAsistencias.filter(r => r.estado === 'J').length;
  const totalRegistros = fichaAsistencias.length;

  const pctAsistenciaGlobal = totalRegistros > 0 
    ? Math.round(((totalP + totalR + totalJ) / totalRegistros) * 100) 
    : 100;
  const pctInasistenciaInjustificada = totalRegistros > 0 
    ? Math.round((totalNA / totalRegistros) * 100) 
    : 0;

  // Unjustified absences map: studentId -> list of dates
  const unjustifiedAbsencesByStudent: Record<string, string[]> = {};
  fichaAsistencias
    .filter(r => r.estado === 'NA')
    .forEach(r => {
      if (!unjustifiedAbsencesByStudent[r.aprendizId]) {
        unjustifiedAbsencesByStudent[r.aprendizId] = [];
      }
      unjustifiedAbsencesByStudent[r.aprendizId].push(r.fecha);
    });

  // Sort absence dates for each learner
  Object.keys(unjustifiedAbsencesByStudent).forEach(id => {
    unjustifiedAbsencesByStudent[id].sort();
  });

  // Build rows for the unjustified absences table
  const studentsWithAbsences = fichaAprendices
    .filter(a => (unjustifiedAbsencesByStudent[a.id]?.length || 0) > 0)
    .sort((a, b) => (unjustifiedAbsencesByStudent[b.id]?.length || 0) - (unjustifiedAbsencesByStudent[a.id]?.length || 0));

  let y = margin;

  // ==========================================
  // 1. INSTITUTIONAL HEADER
  // ==========================================
  // Top green institutional accent line
  doc.setFillColor(...senaGreen);
  doc.rect(margin, y, contentWidth, 2, 'F');
  y += 5;

  // SENA Badge Icon Box
  doc.setFillColor(...senaNavy);
  doc.roundedRect(margin, y, 12, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('SENA', margin + 6, y + 7.5, { align: 'center' });

  // Main Header Texts
  doc.setTextColor(...senaNavy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICIO NACIONAL DE APRENDIZAJE - SENA', margin + 15, y + 4);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateDark);
  doc.text(
    `${instructorConfig.centroFormacion || ficha.centroFormacion} — ${instructorConfig.regional || ficha.regional}`,
    margin + 15,
    y + 8
  );

  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text(
    'DIRECCIÓN DE FORMACIÓN PROFESIONAL INTEGRAL • PROTOCOLO GFPI-PR-001 & ACUERDO 09 DE 2024',
    margin + 15,
    y + 11.5
  );

  // Right-aligned report code and timestamp
  const now = new Date();
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...roseRed);
  doc.text('INFORME DE CIERRE', pageWidth - margin, y + 4, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateMuted);
  doc.text(`Fecha: ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, y + 8, { align: 'right' });
  doc.text('Estado: Cierre y Archivo Definitivo', pageWidth - margin, y + 11.5, { align: 'right' });

  y += 15;

  // Header separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Document Title Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...senaNavy);
  doc.text(
    `ACTA DE CIERRE ACADÉMICO Y REPORTE CONSOLIDADO DE INASISTENCIAS • FICHA ${ficha.codigo}`,
    pageWidth / 2,
    y + 5.2,
    { align: 'center' }
  );
  y += 11;

  // ==========================================
  // 2. FICHA CHARACTERIZATION BLOCK
  // ==========================================
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text('1. INFORMACIÓN GENERAL DE LA FICHA DE FORMACIÓN', margin, y);
  y += 3;

  const colW = contentWidth / 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'D');

  doc.setFontSize(7.5);
  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slateDark);
  doc.text('Programa de Formación:', margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  const progLines = doc.splitTextToSize(ficha.programa, colW - 35);
  doc.text(progLines, margin + 38, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Código de Ficha:', margin + 3, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.codigo} (${ficha.nivel})`, margin + 38, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Jornada / Horario:', margin + 3, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.jornada} — ${ficha.horario}`, margin + 38, y + 19);

  // Column 2
  const col2X = margin + colW + 3;
  doc.setFont('helvetica', 'bold');
  doc.text('Instructor Líder:', col2X, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${instructorConfig.nombre} (C.C. ${instructorConfig.documentoCc})`, col2X + 32, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Correo Institucional:', col2X, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(instructorConfig.correoInstitucional, col2X + 32, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Período de Formación:', col2X, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.fechaInicio || 'Inicio'} al ${ficha.fechaFin || 'Cierre'}`, col2X + 32, y + 19);

  y += 27;

  // ==========================================
  // 3. EXECUTIVE METRICS SCORECARD
  // ==========================================
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text('2. CONSOLIDADO DE MÉTRICAS Y CONTROL DE ASISTENCIA', margin, y);
  y += 3;

  const cardW = (contentWidth - 6) / 4;
  const cardH = 14;

  const metricCards = [
    {
      title: 'APRENDICES TOTAL',
      value: `${totalAprendices}`,
      sub: `${activeLearners.length} en formación`,
      color: senaNavy
    },
    {
      title: 'SESIONES REGISTRADAS',
      value: `${totalSesiones}`,
      sub: `${totalRegistros} marcaciones`,
      color: senaNavy
    },
    {
      title: 'ASISTENCIA EFECTIVA',
      value: `${pctAsistenciaGlobal}%`,
      sub: `${totalP} Presentes • ${totalR} Ret.`,
      color: senaGreen
    },
    {
      title: 'INASISTENCIAS (NA)',
      value: `${totalNA}`,
      sub: `${pctInasistenciaInjustificada}% sin justificación`,
      color: roseRed
    }
  ];

  metricCards.forEach((card, i) => {
    const cardX = margin + i * (cardW + 2);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cardX, y, cardW, cardH, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardW, cardH, 1.5, 1.5, 'D');

    // Title
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...slateMuted);
    doc.text(card.title, cardX + 3, y + 4);

    // Value
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, cardX + 3, y + 9.5);

    // Subtitle
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateDark);
    doc.text(card.sub, cardX + 3, y + 12.5);
  });

  y += cardH + 4;

  // Secondary indicators row
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'D');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slateDark);
  doc.text(
    `Resumen Regulatorio: Inasistencias Justificadas (Art. 22): ${totalJ} | Alertas Preventivas (GFPI-F-176): ${fichaGfpi.length} | Casos Deserción Reportados (Art. 30): ${fichaDesercion.length} | Aprendices con Faltas Injustificadas: ${studentsWithAbsences.length} de ${totalAprendices}`,
    margin + 3,
    y + 4.5
  );

  y += 10;

  // ==========================================
  // 4. DETAILED UNJUSTIFIED ABSENCES TABLE
  // ==========================================
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text(
    `3. TABLA DETALLADA DE APRENDICES Y FECHAS DE INASISTENCIAS INJUSTIFICADAS (${studentsWithAbsences.length} Aprendices Registrados)`,
    margin,
    y
  );
  y += 2.5;

  const tableBody = studentsWithAbsences.length > 0
    ? studentsWithAbsences.map((aprendiz, idx) => {
        const dates = unjustifiedAbsencesByStudent[aprendiz.id] || [];
        const summary = calculateAprendizSummary(aprendiz, ficha, fichaAsistencias, fichaGfpi, fichaDesercion);
        const datesText = dates.join(', ');

        let estadoRiesgo = 'Normal';
        if (summary.estadoCalculado === 'DESERCION_3_MAS') {
          estadoRiesgo = 'Causal Deserción (≥3 faltas)';
        } else if (summary.estadoCalculado === 'ALERTA_PREVENTIVA_1_2') {
          estadoRiesgo = 'Alerta GFPI-176 (1-2 faltas)';
        } else if (summary.estadoCalculado === 'JUSTIFICADA') {
          estadoRiesgo = 'Justificada (Art. 22)';
        }

        return [
          String(idx + 1),
          `${aprendiz.tipoDocumento} ${aprendiz.documento}`,
          `${aprendiz.nombres} ${aprendiz.apellidos}`,
          String(dates.length),
          datesText,
          summary.inasistenciasConsecutivas > 0 ? `${summary.inasistenciasConsecutivas} consec.` : '0',
          `${summary.tasaAsistencia}%`,
          estadoRiesgo
        ];
      })
    : [
        [
          '-',
          '-',
          'La ficha no registró inasistencias injustificadas durante el proceso formativo.',
          '0',
          'Sin inasistencias injustificadas registradas.',
          '0',
          '100%',
          'Cumplimiento Total'
        ]
      ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      'No.',
      'Documento',
      'Nombres y Apellidos del Aprendiz',
      'Total Faltas',
      'Fechas de Inasistencias Injustificadas Registradas',
      'Racha',
      '% Asist.',
      'Diagnóstico Final'
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 50, 77],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      valign: 'middle',
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 38 },
      3: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 52 },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // ==========================================
  // 5. SIGNATURES & CLOSURE CERTIFICATION
  // ==========================================
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  
  // Check if signatures fit on current page or need a new page
  let sigY = finalY + 12;
  if (sigY + 35 > pageHeight - margin) {
    doc.addPage();
    sigY = margin + 15;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...senaNavy);
  doc.text('4. CONSTANCIA INSTITUCIONAL DE CIERRE Y ARCHIVO ACADÉMICO', margin, sigY);
  sigY += 4;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...slateMuted);
  doc.text(
    'Se certifica que la información consignada corresponde fielmente al registro histórico de asistencia, prevenciones GFPI-PR-001 y reportes de deserción formalizados durante el período de formación.',
    margin,
    sigY
  );
  sigY += 12;

  // Signatures Lines
  const sigW = (contentWidth - 20) / 2;
  const sig1X = margin + 5;
  const sig2X = margin + sigW + 15;

  // Signature 1: Instructor
  doc.setDrawColor(...slateDark);
  doc.setLineWidth(0.4);
  doc.line(sig1X, sigY, sig1X + sigW, sigY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...slateDark);
  doc.text('FIRMA INSTRUCTOR(A) RESPONSABLE', sig1X + sigW / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`${instructorConfig.nombre}`, sig1X + sigW / 2, sigY + 8, { align: 'center' });
  doc.text(`C.C. ${instructorConfig.documentoCc}`, sig1X + sigW / 2, sigY + 11.5, { align: 'center' });
  doc.text(`Instructor(a) SENA — ${ficha.codigo}`, sig1X + sigW / 2, sigY + 15, { align: 'center' });

  // Signature 2: Academic Coordination
  doc.line(sig2X, sigY, sig2X + sigW, sigY);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA COORDINACIÓN ACADÉMICA', sig2X + sigW / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(instructorConfig.centroFormacion || 'Centro CCIT', sig2X + sigW / 2, sigY + 8, { align: 'center' });
  doc.text(`SENA ${instructorConfig.regional || 'Regional Córdoba'}`, sig2X + sigW / 2, sigY + 11.5, { align: 'center' });
  doc.text('Revisión y Cierre Curricular', sig2X + sigW / 2, sigY + 15, { align: 'center' });

  // Save the document
  const fileName = `Informe_Cierre_Ficha_${ficha.codigo}_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
