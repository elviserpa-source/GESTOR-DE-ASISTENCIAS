import * as XLSX from 'xlsx';
import { Ficha, Aprendiz } from '../types/attendance';

export interface ParseSofiaResult {
  fichaInfo?: {
    codigo: string;
    programa: string;
    estadoFicha?: string;
    fechaReporte?: string;
  };
  aprendices: Omit<Aprendiz, 'id' | 'fichaId'>[];
  rawRowCount: number;
  warnings: string[];
}

/**
 * Parses 2D array of strings or values (from SheetJS or CSV lines)
 * complying with the SENA "Reporte de Aprendices" structure
 */
export const parseSofiaRows = (rows: any[][]): ParseSofiaResult => {
  const warnings: string[] = [];
  let fichaCodigo = '';
  let fichaPrograma = '';
  let estadoFicha = '';
  let fechaReporte = '';

  let headerRowIndex = -1;
  let colMap: Record<string, number> = {
    tipoDoc: -1,
    numeroDoc: -1,
    nombre: -1,
    apellidos: -1,
    celular: -1,
    correo: -1,
    estado: -1
  };

  // 1. Scan first 15 rows for metadata and headers
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r] || [];
    const fullRowStr = row.map(cell => String(cell || '').trim()).join(' ').toLowerCase();

    // Check for Ficha de Caracterización
    if (fullRowStr.includes('ficha de caracterizaci') || fullRowStr.includes('ficha:')) {
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').trim();
        if (cell.toLowerCase().includes('ficha de caracterizaci') || cell.toLowerCase().includes('ficha:')) {
          // Look in next cell or inside same cell
          let targetText = row[c + 1] ? String(row[c + 1]).trim() : '';
          if (!targetText && cell.includes(':')) {
            targetText = cell.split(':')[1]?.trim() || '';
          }
          if (targetText) {
            // E.g. "3534716 - GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION"
            const parts = targetText.split('-');
            if (parts.length >= 2) {
              fichaCodigo = parts[0].trim();
              fichaPrograma = parts.slice(1).join('-').trim();
            } else {
              fichaCodigo = targetText.trim();
              fichaPrograma = 'Programa de Formación SENA';
            }
          }
          break;
        }
      }
    }

    // Check for Estado
    if (fullRowStr.includes('estado:') || (row[0] && String(row[0]).trim().toLowerCase() === 'estado:')) {
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').trim();
        if (cell.toLowerCase().startsWith('estado:')) {
          let val = row[c + 1] ? String(row[c + 1]).trim() : '';
          if (!val && cell.includes(':')) {
            val = cell.split(':')[1]?.trim() || '';
          }
          if (val) estadoFicha = val;
          break;
        }
      }
    }

    // Check for Fecha del Reporte
    if (fullRowStr.includes('fecha del reporte:') || fullRowStr.includes('fecha reporte:')) {
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').trim();
        if (cell.toLowerCase().includes('fecha del reporte') || cell.toLowerCase().includes('fecha reporte')) {
          let val = row[c + 1] ? String(row[c + 1]).trim() : '';
          if (!val && cell.includes(':')) {
            val = cell.split(':')[1]?.trim() || '';
          }
          if (val) fechaReporte = val;
          break;
        }
      }
    }

    // Check for column header row: "Tipo de Documento", "Número de Documento", "Nombre", "Apellidos", "Celular", "Correo Electrónico", "Estado"
    const hasTipoDoc = row.some(cell => {
      const s = String(cell || '').toLowerCase();
      return s.includes('tipo de doc') || s.includes('tipo doc');
    });
    const hasNumDoc = row.some(cell => {
      const s = String(cell || '').toLowerCase();
      return s.includes('n') && (s.includes('mero') || s.includes('documento') || s.includes('identificaci'));
    });
    const hasNombre = row.some(cell => {
      const s = String(cell || '').toLowerCase();
      return s === 'nombre' || s.includes('nombres');
    });

    if (hasTipoDoc || (hasNumDoc && hasNombre)) {
      headerRowIndex = r;
      // Map columns
      row.forEach((cell, idx) => {
        const s = String(cell || '').trim().toLowerCase();
        if (s.includes('tipo de doc') || s.includes('tipo doc')) colMap.tipoDoc = idx;
        else if (s.includes('n') && (s.includes('mero') || s.includes('documento') || s.includes('identificaci'))) colMap.numeroDoc = idx;
        else if (s === 'nombre' || s.includes('nombres')) colMap.nombre = idx;
        else if (s.includes('apellido')) colMap.apellidos = idx;
        else if (s.includes('celular') || s.includes('tel')) colMap.celular = idx;
        else if (s.includes('correo') || s.includes('email')) colMap.correo = idx;
        else if (s === 'estado' || s.includes('estado')) colMap.estado = idx;
      });
      break;
    }
  }

  // Fallback defaults for column mapping if not explicitly labeled
  if (headerRowIndex === -1) {
    // If no header found, assume standard 7 columns from row 0:
    // TipoDoc, NumDoc, Nombre, Apellidos, Celular, Correo, Estado
    headerRowIndex = 0;
    colMap = {
      tipoDoc: 0,
      numeroDoc: 1,
      nombre: 2,
      apellidos: 3,
      celular: 4,
      correo: 5,
      estado: 6
    };
  }

  // Ensure minimum valid mapping
  if (colMap.numeroDoc === -1 && colMap.tipoDoc !== -1) colMap.numeroDoc = colMap.tipoDoc + 1;
  if (colMap.nombre === -1 && colMap.numeroDoc !== -1) colMap.nombre = colMap.numeroDoc + 1;
  if (colMap.apellidos === -1 && colMap.nombre !== -1) colMap.apellidos = colMap.nombre + 1;
  if (colMap.celular === -1 && colMap.apellidos !== -1) colMap.celular = colMap.apellidos + 1;
  if (colMap.correo === -1 && colMap.celular !== -1) colMap.correo = colMap.celular + 1;
  if (colMap.estado === -1 && colMap.correo !== -1) colMap.estado = colMap.correo + 1;

  // 2. Parse apprentices rows starting from headerRowIndex + 1
  const aprendicesList: Omit<Aprendiz, 'id' | 'fichaId'>[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    if (row.length === 0) continue;

    const rawNumDoc = colMap.numeroDoc >= 0 && row[colMap.numeroDoc] ? String(row[colMap.numeroDoc]).trim() : '';
    const rawNombre = colMap.nombre >= 0 && row[colMap.nombre] ? String(row[colMap.nombre]).trim() : '';

    // Ignore empty lines or summary rows
    if (!rawNumDoc && !rawNombre) continue;
    if (rawNumDoc.toLowerCase().includes('total') || rawNombre.toLowerCase().includes('total')) continue;

    let tipoDoc: 'CC' | 'TI' | 'CE' | 'PEP' = 'CC';
    if (colMap.tipoDoc >= 0 && row[colMap.tipoDoc]) {
      const td = String(row[colMap.tipoDoc]).trim().toUpperCase();
      if (['CC', 'TI', 'CE', 'PEP'].includes(td)) {
        tipoDoc = td as any;
      }
    }

    const apellidos = colMap.apellidos >= 0 && row[colMap.apellidos] ? String(row[colMap.apellidos]).trim() : '';
    const celular = colMap.celular >= 0 && row[colMap.celular] ? String(row[colMap.celular]).trim() : '';
    const correo = colMap.correo >= 0 && row[colMap.correo] ? String(row[colMap.correo]).trim() : '';
    const estadoSena = colMap.estado >= 0 && row[colMap.estado] ? String(row[colMap.estado]).trim().toUpperCase() : 'EN FORMACION';

    // Normalize phone / celular
    const cleanPhone = celular.replace(/[^0-9]/g, '') || '3000000000';

    // Derive institutional status
    let estadoApp: 'ACTIVO' | 'EN_RIESGO_PREVENTIVO' | 'DESERCION_REPORTADA' = 'ACTIVO';
    if (estadoSena.includes('RETIRO') || estadoSena.includes('DESER') || estadoSena.includes('CANCEL')) {
      estadoApp = 'DESERCION_REPORTADA';
    } else if (estadoSena.includes('CONDICION') || estadoSena.includes('RIESGO')) {
      estadoApp = 'EN_RIESGO_PREVENTIVO';
    }

    aprendicesList.push({
      documento: rawNumDoc,
      tipoDocumento: tipoDoc,
      nombres: rawNombre,
      apellidos: apellidos,
      correo: correo || `${rawNombre.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      telefono: cleanPhone,
      celular: cleanPhone,
      estadoSena: estadoSena || 'EN FORMACION',
      estado: estadoApp
    });
  }

  return {
    fichaInfo: fichaCodigo ? {
      codigo: fichaCodigo,
      programa: fichaPrograma || 'GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION',
      estadoFicha: estadoFicha || 'EN EJECUCION',
      fechaReporte: fechaReporte || '19/09/2026'
    } : undefined,
    aprendices: aprendicesList,
    rawRowCount: rows.length,
    warnings
  };
};

/**
 * Parses raw text (CSV, TSV, or pasted from Excel)
 */
export const parseSofiaText = (text: string): ParseSofiaResult => {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    // Detect delimiter: tab, semicolon or comma
    let delimiter = ',';
    if (line.includes('\t')) delimiter = '\t';
    else if (line.includes(';') && !line.includes(',')) delimiter = ';';

    const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    rows.push(cols);
  }

  return parseSofiaRows(rows);
};

/**
 * Parses an Excel file (.xlsx or .xls) using SheetJS
 */
export const parseSofiaExcelFile = async (file: File): Promise<ParseSofiaResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return parseSofiaRows(rows);
};

/**
 * Generates an Excel file matching image.png exactly
 */
export const generateSofiaExcelTemplate = (ficha: Ficha, aprendices: Aprendiz[]): Uint8Array => {
  const data: any[][] = [
    ['Reporte de Aprendices'],
    ['Ficha de Caracterización:', `${ficha.codigo} - ${ficha.programa}`],
    ['Estado:', ficha.estadoFicha || 'EN EJECUCION'],
    ['Fecha del Reporte:', ficha.fechaReporte || '19/09/2026'],
    ['Tipo de Documento', 'Número de Documento', 'Nombre', 'Apellidos', 'Celular', 'Correo Electrónico', 'Estado']
  ];

  if (aprendices.length === 0) {
    // Sample rows from image.png
    data.push(
      ['CC', '1003049636', 'LEIDYS ESTHER', 'ROMERO PEREZ', '3122705787', 'romeroleidys579@gmail.com', 'EN FORMACION'],
      ['CC', '1003141783', 'LINA MARIA', 'MAUSSA RODRIGUEZ', '3127224926', 'linamaussa2693@gmail.com', 'EN FORMACION'],
      ['CC', '1003466597', 'KARINA', 'SOTELO SANCHEZ', '3244740906', 'karinasotelosanchez19@gmail.com', 'EN FORMACION'],
      ['CC', '1004322712', 'MISHELL LORENA', 'MEZA OROZCO', '3002885198', 'michellmezaorozco@gmail.com', 'EN FORMACION'],
      ['CC', '1062427945', 'YULIANA', 'CARDENAS MORA', '3104626553', 'cardenasy555@gmail.com', 'RETIRO VOLUNTARIO'],
      ['CC', '1062428134', 'VIVIANA VANESSA', 'MENDEZ SANCHEZ', '3006883753', 'vannemendez22@gmail.com', 'EN FORMACION']
    );
  } else {
    aprendices.forEach(a => {
      data.push([
        a.tipoDocumento,
        a.documento,
        a.nombres,
        a.apellidos,
        a.celular || a.telefono,
        a.correo,
        a.estadoSena || 'EN FORMACION'
      ]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Aprendices');
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
};

/**
 * Sample preloaded Ficha and Aprendices matching image.png exactly
 */
export const sampleSofiaFicha3534716: Ficha = {
  id: 'f-3534716',
  codigo: '3534716',
  programa: 'GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION',
  nivel: 'Tecnólogo',
  jornada: 'Diurna',
  regional: 'Regional Córdoba',
  centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
  horario: '07:00 a 13:00',
  fechaInicio: '2026-02-01',
  fechaFin: '2027-08-01',
  instructorLider: 'Elvis Serpa Hernández',
  instructorCc: '1067894512',
  estadoFicha: 'EN EJECUCION',
  fechaReporte: '19/09/2026'
};

export const sampleSofiaAprendices3534716: Aprendiz[] = [
  {
    id: 'ap-sofia-01',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1003049636',
    nombres: 'LEIDYS ESTHER',
    apellidos: 'ROMERO PEREZ',
    celular: '3122705787',
    telefono: '3122705787',
    correo: 'romeroleidys579@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-sofia-02',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1003141783',
    nombres: 'LINA MARIA',
    apellidos: 'MAUSSA RODRIGUEZ',
    celular: '3127224926',
    telefono: '3127224926',
    correo: 'linamaussa2693@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-sofia-03',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1003466597',
    nombres: 'KARINA',
    apellidos: 'SOTELO SANCHEZ',
    celular: '3244740906',
    telefono: '3244740906',
    correo: 'karinasotelosanchez19@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-sofia-04',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1004322712',
    nombres: 'MISHELL LORENA',
    apellidos: 'MEZA OROZCO',
    celular: '3002885198',
    telefono: '3002885198',
    correo: 'michellmezaorozco@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  },
  {
    id: 'ap-sofia-05',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1062427945',
    nombres: 'YULIANA',
    apellidos: 'CARDENAS MORA',
    celular: '3104626553',
    telefono: '3104626553',
    correo: 'cardenasy555@gmail.com',
    estadoSena: 'RETIRO VOLUNTARIO',
    estado: 'DESERCION_REPORTADA'
  },
  {
    id: 'ap-sofia-06',
    fichaId: 'f-3534716',
    tipoDocumento: 'CC',
    documento: '1062428134',
    nombres: 'VIVIANA VANESSA',
    apellidos: 'MENDEZ SANCHEZ',
    celular: '3006883753',
    telefono: '3006883753',
    correo: 'vannemendez22@gmail.com',
    estadoSena: 'EN FORMACION',
    estado: 'ACTIVO'
  }
];
