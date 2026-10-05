/**
 * SENA Official Format Exporter
 * Generates structured Excel (.xlsx) and PDF (.pdf) documents matching
 * the official templates for:
 * 1. Formato GFPI-F-176: Ruta de atención para la prevención de la deserción (Protocolo GFPI-PR-001)
 * 2. Reporte Grupal de Deserción (Acuerdo 09 de 2024 / Art. 30 Reglamento del Aprendiz)
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ficha, FormatoGFPI176Item, FormatoDesercionItem, Aprendiz } from '../types/attendance';
import { InstructorConfig } from '../db/senaDatabase';
import protocoloData from '../data/protocoloRutaDesercion.json';
import reporteDesercionData from '../data/formatoReporteDesercion.json';

// ============================================================================
// 1. FORMATO GFPI-F-176 (EXCEL & PDF)
// ============================================================================

export const exportGFPI176ToExcel = (
  ficha: Ficha,
  records: FormatoGFPI176Item[],
  instructor: InstructorConfig,
  aprendices: Aprendiz[] = []
): void => {
  const fichaRecords = records.filter(r => r.fichaId === ficha.id);
  const rows: any[][] = [];

  // --- BLOQUE 1: ENCABEZADO INSTITUCIONAL ---
  rows.push(['SERVICIO NACIONAL DE APRENDIZAJE - SENA']);
  rows.push(['DIRECCIÓN DE FORMACIÓN PROFESIONAL INTEGRAL']);
  rows.push(['FORMATO RUTA DE ATENCIÓN PARA LA PREVENCIÓN DE LA DESERCIÓN']);
  rows.push(['CÓDIGO: GFPI-F-176  |  VERSIÓN: 01  |  SISTEMA INTEGRADO DE GESTIÓN (COMPROMISO)']);
  rows.push([]);

  // --- BLOQUE 2: CARACTERIZACIÓN DE LA FICHA Y CENTRO ---
  rows.push(['INFORMACIÓN GENERAL DEL PROGRAMA Y FICHA DE CARACTERIZACIÓN']);
  rows.push(['REGIONAL:', instructor.regional || ficha.regional, '', 'CENTRO DE FORMACIÓN:', instructor.centroFormacion || ficha.centroFormacion]);
  rows.push(['PROGRAMA DE FORMACIÓN:', ficha.programa, '', 'NIVEL DE FORMACIÓN:', ficha.nivel]);
  rows.push(['CÓDIGO DE FICHA:', ficha.codigo, '', 'JORNADA / HORARIO:', `${ficha.jornada} (${ficha.horario})`]);
  rows.push(['INSTRUCTOR RESPONSABLE:', `${instructor.nombre} (C.C. ${instructor.documentoCc})`, '', 'CORREO INSTITUCIONAL:', instructor.correoInstitucional]);
  rows.push(['FECHA DE EMISIÓN:', new Date().toLocaleDateString('es-CO'), '', 'ESTADO DE LA FICHA:', ficha.estadoFicha || 'EN EJECUCION']);
  rows.push([]);

  // --- BLOQUE 3: TABLA DE DATOS OFICIAL GFPI-F-176 ---
  rows.push([
    'No.',
    'Fecha de Registro',
    'Tipo Doc.',
    'Número Documento',
    'Nombres y Apellidos del Aprendiz',
    'Descripción de la Situación de Riesgo',
    'Categoría Factor (Tabla 1 GFPI-PR-001)',
    'Causa Específica Identificada (Tabla 1)',
    '¿Escaló Caso?',
    'Instancia a la que se Escaló (Tabla 2)',
    'Acciones y Estrategias Pedagógicas Adelantadas',
    'Estado al Final del Trimestre'
  ]);

  if (fichaRecords.length === 0) {
    rows.push(['-', '-', '-', '-', 'Sin registros en la ruta para esta ficha.', '-', '-', '-', '-', '-', '-', '-']);
  } else {
    fichaRecords.forEach((item, idx) => {
      // Find apprentice for doc type
      const ap = aprendices.find(a => a.id === item.aprendizId);
      rows.push([
        idx + 1,
        item.fechaRegistro,
        ap?.tipoDocumento || 'CC',
        item.documentoAprendiz,
        item.nombreAprendiz,
        item.situacionRiesgo,
        item.categoriaTabla1,
        item.causaTabla1,
        item.escaloCaso ? 'SÍ' : 'NO',
        item.aQuienEscalo || 'No requiere escalamiento',
        item.accionesAdelantadas || 'Seguimiento preventivo',
        item.estadoFinalTrimestre
      ]);
    });
  }

  rows.push([]);
  rows.push([]);

  // --- BLOQUE 4: FIRMAS INSTITUCIONALES ---
  rows.push(['CERTIFICACIÓN Y FIRMAS DE RESPONSABILIDAD:']);
  rows.push([]);
  rows.push([]);
  rows.push([
    '',
    '_______________________________________________',
    '',
    '',
    '',
    '_______________________________________________',
    '',
    '',
    '',
    '_______________________________________________'
  ]);
  rows.push([
    '',
    'FIRMA INSTRUCTOR(A) RESPONSABLE',
    '',
    '',
    '',
    'FIRMA COORDINACIÓN ACADÉMICA',
    '',
    '',
    '',
    'FIRMA BIENESTAR AL APRENDIZ'
  ]);
  rows.push([
    '',
    `Nombre: ${instructor.nombre}`,
    '',
    '',
    '',
    'Centro de Comercio, Industria y Turismo (CCIT)',
    '',
    '',
    '',
    'Líder de Bienestar al Aprendiz'
  ]);
  rows.push([
    '',
    `C.C. ${instructor.documentoCc}`,
    '',
    '',
    '',
    `Regional: ${instructor.regional}`,
    '',
    '',
    '',
    `Sede: Montería`
  ]);

  rows.push([]);

  // --- BLOQUE 5: ANEXO NORMATIVO PROTOCOLO GFPI-PR-001 ---
  rows.push(['ANEXO METODOLÓGICO: TABLA 1 - ELEMENTOS CONCEPTUALES DE LA DESERCIÓN (PROTOCOLO GFPI-PR-001)']);
  protocoloData.tabla_1_elementos_conceptuales.forEach(cat => {
    rows.push([cat.categoria, cat.causas_riesgo.slice(0, 3).join('; ')]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths definition
  worksheet['!cols'] = [
    { wch: 6 },   // No.
    { wch: 14 },  // Fecha
    { wch: 10 },  // Tipo Doc
    { wch: 18 },  // Num Doc
    { wch: 32 },  // Nombre
    { wch: 35 },  // Situación de Riesgo
    { wch: 30 },  // Categoría
    { wch: 35 },  // Causa Específica
    { wch: 14 },  // ¿Escaló?
    { wch: 28 },  // A quién escaló
    { wch: 38 },  // Acciones Adelantadas
    { wch: 24 }   // Estado Final
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Formato GFPI-F-176');
  XLSX.writeFile(workbook, `Formato_GFPI_F_176_Ficha_${ficha.codigo}_Oficial.xlsx`);
};

export const exportGFPI176ToPDF = (
  ficha: Ficha,
  records: FormatoGFPI176Item[],
  instructor: InstructorConfig,
  aprendices: Aprendiz[] = []
): void => {
  const fichaRecords = records.filter(r => r.fichaId === ficha.id);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Colors
  const senaGreen = [57, 169, 0] as const;
  const senaNavy = [0, 50, 77] as const;
  const lightGrey = [248, 250, 252] as const;

  // 1. Header Box
  doc.setFillColor(...senaNavy);
  doc.rect(margin, margin, pageWidth - margin * 2, 18, 'F');

  // SENA Badge
  doc.setFillColor(...senaGreen);
  doc.roundedRect(margin + 3, margin + 2.5, 13, 13, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('S', margin + 7.5, margin + 11.5);

  // Header Title
  doc.setFontSize(10);
  doc.text('SERVICIO NACIONAL DE APRENDIZAJE SENA', margin + 20, margin + 6.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('DIRECCIÓN DE FORMACIÓN PROFESIONAL  •  PROTOCOLO GFPI-PR-001', margin + 20, margin + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FORMATO RUTA DE ATENCIÓN PARA LA PREVENCIÓN DE LA DESERCIÓN', margin + 20, margin + 15.5);

  // Document Code Box
  doc.setFontSize(8);
  doc.text('CÓDIGO: GFPI-F-176', pageWidth - margin - 35, margin + 7);
  doc.text('VERSIÓN: 01', pageWidth - margin - 35, margin + 12);
  doc.text(`FECHA: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - margin - 35, margin + 16);

  // 2. Metadata Grid
  const metaY = margin + 21;
  doc.setFillColor(...lightGrey);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, metaY, pageWidth - margin * 2, 17, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');

  // Col 1
  doc.text('REGIONAL:', margin + 4, metaY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.regional || ficha.regional, margin + 22, metaY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('CENTRO:', margin + 4, metaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.centroFormacion || ficha.centroFormacion, margin + 22, metaY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUCTOR:', margin + 4, metaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${instructor.nombre} (C.C. ${instructor.documentoCc})`, margin + 25, metaY + 15);

  // Col 2
  const col2X = margin + 110;
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAMA:', col2X, metaY + 5);
  doc.setFont('helvetica', 'normal');
  const progText = doc.splitTextToSize(ficha.programa, 80);
  doc.text(progText, col2X + 20, metaY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('CORREO:', col2X, metaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.correoInstitucional, col2X + 20, metaY + 15);

  // Col 3
  const col3X = margin + 200;
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA No.:', col3X, metaY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.codigo} (${ficha.nivel})`, col3X + 18, metaY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('JORNADA:', col3X, metaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.jornada} - ${ficha.horario}`, col3X + 18, metaY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO:', col3X, metaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(ficha.estadoFicha || 'EN EJECUCION', col3X + 18, metaY + 15);

  // 3. Table
  const tableData = fichaRecords.map((r, idx) => {
    const ap = aprendices.find(a => a.id === r.aprendizId);
    return [
      String(idx + 1),
      r.fechaRegistro,
      `${ap?.tipoDocumento || 'CC'} ${r.documentoAprendiz}`,
      r.nombreAprendiz,
      r.situacionRiesgo,
      r.categoriaTabla1,
      r.causaTabla1,
      r.escaloCaso ? 'SÍ' : 'NO',
      r.aQuienEscalo || 'N/A',
      r.accionesAdelantadas || 'Seguimiento pedagógico',
      r.estadoFinalTrimestre
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['-', '-', '-', 'Sin aprendices en la ruta para esta ficha.', '-', '-', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: metaY + 20,
    margin: { left: margin, right: margin },
    head: [[
      'No.',
      'Fecha',
      'Documento',
      'Nombre del Aprendiz',
      'Situación de Riesgo',
      'Categoría (Tabla 1)',
      'Causa Identificada',
      '¿Escaló?',
      '¿A quién escaló?',
      'Acciones Adelantadas',
      'Estado Trimestre'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 50, 77],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      valign: 'middle',
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 32 },
      4: { cellWidth: 35 },
      5: { cellWidth: 26 },
      6: { cellWidth: 32 },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 26 },
      9: { cellWidth: 38 },
      10: { cellWidth: 27, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // 4. Signatures Block
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  const sigY = Math.min(finalY + 12, pageHeight - 32);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const sigCol1 = margin + 15;
  const sigCol2 = margin + 105;
  const sigCol3 = margin + 195;

  doc.line(sigCol1, sigY + 10, sigCol1 + 65, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA INSTRUCTOR RESPONSABLE', sigCol1 + 8, sigY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${instructor.nombre}`, sigCol1 + 8, sigY + 18);
  doc.text(`C.C. ${instructor.documentoCc}`, sigCol1 + 8, sigY + 22);

  doc.line(sigCol2, sigY + 10, sigCol2 + 65, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA COORDINACIÓN ACADÉMICA', sigCol2 + 8, sigY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.centroFormacion || 'Centro CCIT', sigCol2 + 8, sigY + 18);
  doc.text(`Regional: ${instructor.regional}`, sigCol2 + 8, sigY + 22);

  doc.line(sigCol3, sigY + 10, sigCol3 + 65, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA BIENESTAR AL APRENDIZ', sigCol3 + 8, sigY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text('Líder de Bienestar al Aprendiz', sigCol3 + 8, sigY + 18);
  doc.text('SENA Regional Córdoba', sigCol3 + 8, sigY + 22);

  doc.save(`Formato_GFPI_F_176_Ficha_${ficha.codigo}_Oficial.pdf`);
};

// ============================================================================
// 2. REPORTE GRUPAL DE DESERCIÓN (EXCEL & PDF)
// ============================================================================

export const exportDesercionToExcel = (
  ficha: Ficha,
  records: FormatoDesercionItem[],
  instructor: InstructorConfig,
  aprendices: Aprendiz[] = []
): void => {
  const fichaRecords = records.filter(r => r.fichaId === ficha.id);
  const rows: any[][] = [];

  // --- BLOQUE 1: ENCABEZADO INSTITUCIONAL ---
  rows.push(['SERVICIO NACIONAL DE APRENDIZAJE - SENA']);
  rows.push(['DIRECCIÓN DE FORMACIÓN PROFESIONAL']);
  rows.push(['FORMATO REPORTE GRUPAL DE DESERCIÓN']);
  rows.push(['ACUERDO 09 DE 2024 (ARTÍCULO 30: DESERCIÓN DEL PROCESO DE FORMACIÓN)']);
  rows.push([]);

  // --- BLOQUE 2: CARACTERIZACIÓN DE LA FICHA ---
  rows.push(['INFORMACIÓN DE LA FICHA DE CARACTERIZACIÓN Y REPORTE']);
  rows.push(['REGIONAL:', instructor.regional || ficha.regional, '', 'CENTRO DE FORMACIÓN:', instructor.centroFormacion || ficha.centroFormacion]);
  rows.push(['PROGRAMA DE FORMACIÓN:', ficha.programa, '', 'NÚMERO DE FICHA:', ficha.codigo]);
  rows.push(['NIVEL DE FORMACIÓN:', ficha.nivel, '', 'HORARIO Y JORNADA:', `${ficha.horario} (${ficha.jornada})`]);
  rows.push(['INSTRUCTOR LÍDER / RESPONSABLE:', `${instructor.nombre} (C.C. ${instructor.documentoCc})`, '', 'CORREO OUTLOOK SENA:', instructor.correoInstitucional]);
  rows.push(['FECHA DE REPORTE OFICIAL:', ficha.fechaReporte || new Date().toLocaleDateString('es-CO'), '', 'ESTADO FICHA:', ficha.estadoFicha || 'EN EJECUCION']);
  rows.push([]);

  // --- BLOQUE 3: TABLA DE APRENDICES EN DESERCIÓN ---
  rows.push([
    'No.',
    'Tipo Doc.',
    'Número de Documento',
    'Apellidos y Nombres del Aprendiz',
    'Correo Electrónico',
    'Teléfono / Celular',
    'Código Tipo Novedad',
    'Descripción Tipo de Novedad',
    'Código Causa',
    'Descripción Causa de Deserción (Tabla Oficial 23 Causas)',
    'Fecha de Deserción',
    'Observaciones y Trámite Registrado'
  ]);

  if (fichaRecords.length === 0) {
    rows.push(['-', '-', '-', 'No se registran aprendices en reporte de deserción para esta ficha.', '-', '-', '-', '-', '-', '-', '-', '-']);
  } else {
    fichaRecords.forEach((item, idx) => {
      const ap = aprendices.find(a => a.id === item.aprendizId);
      rows.push([
        idx + 1,
        ap?.tipoDocumento || 'CC',
        item.documentoAprendiz,
        item.apellidosNombres,
        item.correo,
        ap?.celular || ap?.telefono || 'No registrado',
        item.tipoNovedadCodigo,
        item.tipoNovedadTexto,
        item.causaCodigo,
        item.causaTexto,
        item.fechaDesercion,
        item.observaciones || 'Sin observaciones adicionales'
      ]);
    });
  }

  rows.push([]);
  rows.push([]);

  // --- BLOQUE 4: FIRMAS INSTITUCIONALES ---
  rows.push(['FIRMAS DE CONSTANCIA Y RADICACIÓN:']);
  rows.push([]);
  rows.push([]);
  rows.push([
    '',
    '_______________________________________________',
    '',
    '',
    '',
    '_______________________________________________',
    '',
    '',
    '',
    '_______________________________________________'
  ]);
  rows.push([
    '',
    'FIRMA INSTRUCTOR(A) LÍDER',
    '',
    '',
    '',
    'FIRMA COORDINACIÓN ACADÉMICA',
    '',
    '',
    '',
    'FIRMA BIENESTAR AL APRENDIZ'
  ]);
  rows.push([
    '',
    `Nombre: ${instructor.nombre}`,
    '',
    '',
    '',
    'Coordinador(a) Académico(a) CCIT',
    '',
    '',
    '',
    'Líder de Bienestar al Aprendiz'
  ]);
  rows.push([
    '',
    `C.C. ${instructor.documentoCc}`,
    '',
    '',
    '',
    `Regional: ${instructor.regional}`,
    '',
    '',
    '',
    `Sede: Montería`
  ]);

  rows.push([]);

  // --- BLOQUE 5: TABLA DE REFERENCIA OFICIAL DE 23 CAUSAS DE DESERCIÓN ---
  rows.push(['REFERENCIA OFICIAL: 23 CAUSAS DE DESERCIÓN SEGÚN ACUERDO 09 DE 2024']);
  reporteDesercionData.causas_de_desercion_oficiales.forEach(c => {
    rows.push([c.codigo, c.nombre]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths definition
  worksheet['!cols'] = [
    { wch: 6 },   // No.
    { wch: 10 },  // Tipo Doc
    { wch: 18 },  // Num Doc
    { wch: 32 },  // Apellidos y Nombres
    { wch: 28 },  // Correo
    { wch: 18 },  // Telefono
    { wch: 12 },  // Cod Novedad
    { wch: 38 },  // Desc Novedad
    { wch: 10 },  // Cod Causa
    { wch: 40 },  // Desc Causa
    { wch: 16 },  // Fecha
    { wch: 35 }   // Observaciones
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte Deserción');
  XLSX.writeFile(workbook, `Reporte_Grupal_Desercion_Ficha_${ficha.codigo}_Oficial.xlsx`);
};

export const exportDesercionToPDF = (
  ficha: Ficha,
  records: FormatoDesercionItem[],
  instructor: InstructorConfig,
  aprendices: Aprendiz[] = []
): void => {
  const fichaRecords = records.filter(r => r.fichaId === ficha.id);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Colors
  const senaGreen = [57, 169, 0] as const;
  const senaNavy = [0, 50, 77] as const;
  const lightGrey = [248, 250, 252] as const;

  // 1. Header Box
  doc.setFillColor(...senaNavy);
  doc.rect(margin, margin, pageWidth - margin * 2, 18, 'F');

  // SENA Badge
  doc.setFillColor(...senaGreen);
  doc.roundedRect(margin + 3, margin + 2.5, 13, 13, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('S', margin + 7.5, margin + 11.5);

  // Header Title
  doc.setFontSize(10);
  doc.text('SERVICIO NACIONAL DE APRENDIZAJE SENA', margin + 20, margin + 6.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('DIRECCIÓN DE FORMACIÓN PROFESIONAL  •  REGLAMENTO DEL APRENDIZ (ACUERDO 09 DE 2024)', margin + 20, margin + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('REPORTE GRUPAL DE DESERCIÓN (ARTÍCULO 30)', margin + 20, margin + 15.5);

  // Header Right Side
  doc.setFontSize(8);
  doc.text(`FICHA: ${ficha.codigo}`, pageWidth - margin - 35, margin + 7);
  doc.text(`NIVEL: ${ficha.nivel}`, pageWidth - margin - 35, margin + 12);
  doc.text(`FECHA: ${ficha.fechaReporte || new Date().toLocaleDateString('es-CO')}`, pageWidth - margin - 35, margin + 16);

  // 2. Metadata Grid
  const metaY = margin + 21;
  doc.setFillColor(...lightGrey);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, metaY, pageWidth - margin * 2, 17, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');

  // Col 1
  doc.text('REGIONAL:', margin + 4, metaY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.regional || ficha.regional, margin + 22, metaY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('CENTRO:', margin + 4, metaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.centroFormacion || ficha.centroFormacion, margin + 22, metaY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUCTOR:', margin + 4, metaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${instructor.nombre} (C.C. ${instructor.documentoCc})`, margin + 25, metaY + 15);

  // Col 2
  const col2X = margin + 110;
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAMA:', col2X, metaY + 5);
  doc.setFont('helvetica', 'normal');
  const progText = doc.splitTextToSize(ficha.programa, 80);
  doc.text(progText, col2X + 20, metaY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('CORREO:', col2X, metaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.correoInstitucional, col2X + 20, metaY + 15);

  // Col 3
  const col3X = margin + 200;
  doc.setFont('helvetica', 'bold');
  doc.text('NO. FICHA:', col3X, metaY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.codigo}`, col3X + 18, metaY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('JORNADA:', col3X, metaY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ficha.horario} (${ficha.jornada})`, col3X + 18, metaY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text('CASOS:', col3X, metaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fichaRecords.length} aprendices reportados`, col3X + 18, metaY + 15);

  // 3. Table
  const tableData = fichaRecords.map((r, idx) => {
    const ap = aprendices.find(a => a.id === r.aprendizId);
    return [
      String(idx + 1),
      `${ap?.tipoDocumento || 'CC'} ${r.documentoAprendiz}`,
      r.apellidosNombres,
      r.correo,
      r.tipoNovedadCodigo,
      r.tipoNovedadTexto,
      `Causa ${r.causaCodigo}`,
      r.causaTexto,
      r.fechaDesercion,
      r.observaciones || 'Reportado en cumplimiento del Art. 30'
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['-', '-', 'Sin aprendices en reporte de deserción.', '-', '-', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: metaY + 20,
    margin: { left: margin, right: margin },
    head: [[
      'No.',
      'Documento',
      'Apellidos y Nombres',
      'Correo Electrónico',
      'Cod. Novedad',
      'Tipo de Novedad',
      'Cod. Causa',
      'Causa de Deserción (Acuerdo 09)',
      'Fecha',
      'Observaciones Registradas'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 50, 77],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      valign: 'middle',
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 38 },
      3: { cellWidth: 35 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 38 },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 42 },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 38 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // 4. Signatures Block
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  const sigY = Math.min(finalY + 12, pageHeight - 32);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const sigCol1 = margin + 15;
  const sigCol2 = margin + 105;
  const sigCol3 = margin + 195;

  doc.line(sigCol1, sigY + 10, sigCol1 + 65, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA INSTRUCTOR(A) LÍDER', sigCol1 + 8, sigY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${instructor.nombre}`, sigCol1 + 8, sigY + 18);
  doc.text(`C.C. ${instructor.documentoCc}`, sigCol1 + 8, sigY + 22);

  doc.line(sigCol2, sigY + 10, sigCol2 + 65, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA COORDINACIÓN ACADÉMICA', sigCol2 + 8, sigY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(instructor.centroFormacion || 'Centro CCIT', sigCol2 + 8, sigY + 18);
  doc.text(`Regional: ${instructor.regional}`, sigCol2 + 8, sigY + 22);

  doc.line(sigCol3, sigY + 10, sigCol3 + 65, sigY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA BIENESTAR AL APRENDIZ', sigCol3 + 8, sigY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text('Líder de Bienestar al Aprendiz', sigCol3 + 8, sigY + 18);
  doc.text('SENA Regional Córdoba', sigCol3 + 8, sigY + 22);

  doc.save(`Reporte_Grupal_Desercion_Ficha_${ficha.codigo}_Oficial.pdf`);
};
