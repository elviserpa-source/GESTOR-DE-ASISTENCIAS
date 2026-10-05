import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Mail, 
  FileWarning, 
  Send, 
  Check, 
  Printer, 
  Download, 
  Plus, 
  Search, 
  User, 
  Building2, 
  Clock, 
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Trash2,
  Sparkles,
  MessageCircle,
  Globe,
  Settings,
  RotateCcw,
  FileDown,
  FileText
} from 'lucide-react';
import { 
  Ficha, 
  Aprendiz, 
  FormatoGFPI176Item, 
  FormatoDesercionItem, 
  EmailLog 
} from '../types/attendance';
import protocoloData from '../data/protocoloRutaDesercion.json';
import reporteDesercionData from '../data/formatoReporteDesercion.json';
import { 
  buildEmpatheticDelayTemplate, 
  generateOutlookWebLink, 
  generateMailtoLink 
} from '../utils/outlookConnector';
import { InstructorConfig, SenaDatabase } from '../db/senaDatabase';
import { sortAprendicesByName } from '../utils/sortUtils';
import { 
  exportGFPI176ToExcel, 
  exportGFPI176ToPDF, 
  exportDesercionToExcel, 
  exportDesercionToPDF 
} from '../utils/senaFormatExporter';
import * as XLSX from 'xlsx';

interface ProcessManagementModuleProps {
  fichas: Ficha[];
  selectedFichaId: string;
  setSelectedFichaId: (id: string) => void;
  aprendices: Aprendiz[];
  gfpiRecords: FormatoGFPI176Item[];
  setGfpiRecords: React.Dispatch<React.SetStateAction<FormatoGFPI176Item[]>>;
  desercionRecords: FormatoDesercionItem[];
  setDesercionRecords: React.Dispatch<React.SetStateAction<FormatoDesercionItem[]>>;
  emailLogs: EmailLog[];
  setEmailLogs: React.Dispatch<React.SetStateAction<EmailLog[]>>;
  initialSubTab?: 'gfpi176' | 'reporte' | 'emails';
  targetAprendizForAction?: Aprendiz | null;
  instructorConfig: InstructorConfig;
  setInstructorConfig: (config: InstructorConfig) => void;
}

export const ProcessManagementModule: React.FC<ProcessManagementModuleProps> = ({
  fichas,
  selectedFichaId,
  setSelectedFichaId,
  aprendices,
  gfpiRecords,
  setGfpiRecords,
  desercionRecords,
  setDesercionRecords,
  emailLogs,
  setEmailLogs,
  initialSubTab = 'gfpi176',
  targetAprendizForAction,
  instructorConfig,
  setInstructorConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'gfpi176' | 'reporte' | 'emails'>(initialSubTab);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const currentFicha = fichas.find(f => f.id === selectedFichaId) || fichas[0];
  // Sort learners alphabetically by name
  const fichaAprendices = sortAprendicesByName(aprendices.filter(a => a.fichaId === currentFicha?.id));

  // States for GFPI-F-176 Form modal
  const [showGFPIModal, setShowGFPIModal] = useState(false);
  const [selectedAprendizGFPI, setSelectedAprendizGFPI] = useState<string>(
    targetAprendizForAction ? targetAprendizForAction.id : (fichaAprendices[0]?.id || '')
  );
  const [selectedCategoria, setSelectedCategoria] = useState<string>(
    protocoloData.tabla_1_elementos_conceptuales[0].categoria
  );
  const [selectedCausa, setSelectedCausa] = useState<string>(
    protocoloData.tabla_1_elementos_conceptuales[0].causas_riesgo[0]
  );
  const [situacionRiesgoText, setSituacionRiesgoText] = useState('');
  const [escalo, setEscalo] = useState(true);
  const [aQuienEscaloText, setAQuienEscaloText] = useState(
    protocoloData.tabla_2_escalamiento_y_estrategias[0].escalar_a
  );
  const [accionesText, setAccionesText] = useState(
    protocoloData.tabla_2_escalamiento_y_estrategias[0].estrategias[0]
  );
  const [estadoFinalTrimestre, setEstadoFinalTrimestre] = useState('En seguimiento preventivo');

  // States for Reporte Grupal Deserción Form modal
  const [showDesercionModal, setShowDesercionModal] = useState(false);
  const [selectedAprendizDesercion, setSelectedAprendizDesercion] = useState<string>(
    targetAprendizForAction ? targetAprendizForAction.id : (fichaAprendices[0]?.id || '')
  );
  const [tipoNovedadCodigo, setTipoNovedadCodigo] = useState('3.1');
  const [causaCodigo, setCausaCodigo] = useState<number>(18);
  const [observacionesDesercion, setObservacionesDesercion] = useState('');
  const [fechaDesercion, setFechaDesercion] = useState('2026-09-25');

  // Email composer states
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailAprendizRef, setEmailAprendizRef] = useState<Aprendiz | null>(null);

  // Sync target apprentice if passed from Module 2
  useEffect(() => {
    if (targetAprendizForAction) {
      setEmailAprendizRef(targetAprendizForAction);
      setSelectedAprendizGFPI(targetAprendizForAction.id);
      setSelectedAprendizDesercion(targetAprendizForAction.id);
    }
  }, [targetAprendizForAction]);

  // When category changes in GFPI, update available causes and recommended escalation
  const handleCategoryChange = (catName: string) => {
    setSelectedCategoria(catName);
    const catObj = protocoloData.tabla_1_elementos_conceptuales.find(c => c.categoria === catName);
    if (catObj && catObj.causas_riesgo.length > 0) {
      setSelectedCausa(catObj.causas_riesgo[0]);
    }
    const stratObj = protocoloData.tabla_2_escalamiento_y_estrategias.find(s => s.categoria === catName);
    if (stratObj) {
      setAQuienEscaloText(stratObj.escalar_a);
      setAccionesText(stratObj.estrategias[0] || '');
    }
  };

  // Submit GFPI-F-176
  const handleSaveGFPI = (e: React.FormEvent) => {
    e.preventDefault();
    const ap = aprendices.find(a => a.id === selectedAprendizGFPI);
    if (!ap) return;

    const newItem: FormatoGFPI176Item = {
      id: `gfpi-${Date.now()}`,
      fechaRegistro: new Date().toISOString().split('T')[0],
      fichaId: currentFicha.id,
      aprendizId: ap.id,
      documentoAprendiz: ap.documento,
      nombreAprendiz: `${ap.nombres} ${ap.apellidos}`,
      situacionRiesgo: situacionRiesgoText || 'Inasistencia a formación lectiva y riesgo de deserción temprana.',
      categoriaTabla1: selectedCategoria,
      causaTabla1: selectedCausa,
      escaloCaso: escalo,
      aQuienEscalo: aQuienEscaloText,
      accionesAdelantadas: accionesText,
      estadoFinalTrimestre,
      instructor: currentFicha.instructorLider
    };

    setGfpiRecords(prev => [newItem, ...prev]);
    setShowGFPIModal(false);
    setSituacionRiesgoText('');
  };

  // Submit Reporte Grupal de Deserción
  const handleSaveDesercion = (e: React.FormEvent) => {
    e.preventDefault();
    const ap = aprendices.find(a => a.id === selectedAprendizDesercion);
    if (!ap) return;

    // Look up novelty name
    let noveltyText = 'Incumplimiento - Inasistencia 3 días consecutivos o más sin justificación';
    for (const cat of reporteDesercionData.tipos_de_novedad) {
      const match = cat.subtipos.find(s => s.codigo === tipoNovedadCodigo);
      if (match) {
        noveltyText = match.nombre;
        break;
      }
    }

    // Look up causal name
    const causalMatch = reporteDesercionData.causas_de_desercion_oficiales.find(c => c.codigo === Number(causaCodigo));
    const causalText = causalMatch ? causalMatch.nombre : 'Otra Causa';

    const newItem: FormatoDesercionItem = {
      id: `des-${Date.now()}`,
      fechaReporte: new Date().toISOString().split('T')[0],
      fichaId: currentFicha.id,
      aprendizId: ap.id,
      documentoAprendiz: ap.documento,
      apellidosNombres: `${ap.apellidos} ${ap.nombres}`,
      correo: ap.correo,
      tipoNovedadCodigo,
      tipoNovedadTexto: noveltyText,
      causaCodigo: Number(causaCodigo),
      causaTexto: causalText,
      fechaDesercion,
      observaciones: observacionesDesercion || 'Inasistencia consecutiva de 3 días sin justificación debidamente soportada según Art. 28 y 30 del Reglamento del Aprendiz (Acuerdo 09 de 2024).',
      estadoEnvio: 'Pendiente'
    };

    setDesercionRecords(prev => [newItem, ...prev]);
    setShowDesercionModal(false);
    setObservacionesDesercion('');
  };

  // Quick template loader for Email Composer
  const loadTemplate = (type: 'exhortacion' | 'alerta_1_2' | 'desercion_3') => {
    const defaultAp = targetAprendizForAction || fichaAprendices[0];
    setEmailAprendizRef(defaultAp);

    if (type === 'exhortacion') {
      // Requirement 4: Redacción formal pero cercana al aprendiz, promoviendo el diálogo para comprender qué situaciones generan sus demoras
      const empathetic = buildEmpatheticDelayTemplate(defaultAp, currentFicha, instructorConfig, 30, '2026-09-25');
      setEmailTo(empathetic.to);
      setEmailCc(empathetic.cc || '');
      setEmailSubject(empathetic.subject);
      setEmailBody(empathetic.body);
    } else if (type === 'alerta_1_2') {
      setEmailTo(defaultAp?.correo || 'aprendiz@soy.sena.edu.co');
      setEmailCc(`${instructorConfig.bienestarCorreo}, ${instructorConfig.coordinacionAcademicaCorreo}`);
      setEmailSubject(`Activación Ruta Preventiva a la Deserción (Protocolo GFPI-PR-001) - Ficha ${currentFicha.codigo}`);
      setEmailBody(
`Apreciado(a) Aprendiz: ${defaultAp ? `${defaultAp.nombres} ${defaultAp.apellidos}` : 'Aprendiz SENA'}
Documento de Identidad: ${defaultAp?.documento || '---'}
Ficha de Caracterización: ${currentFicha.codigo} - ${currentFicha.programa}
Centro de Formación: ${currentFicha.centroFormacion} — ${currentFicha.regional}

Asunto: Activación de Ruta Preventiva a la Deserción (Protocolo GFPI-PR-001)

Cordial saludo.

De acuerdo con el seguimiento continuo a las sesiones de formación, hemos registrado tu inasistencia en días recientes sin que a la fecha medie justificación con soportes válidos, conforme a los plazos previstos en el Artículo 28 del Reglamento del Aprendiz (Acuerdo 09 de 2024).

En cumplimiento del Protocolo GFPI-PR-001 ("Protocolo ruta de atención para la prevención de la Deserción de la formación profesional") y a través del Formato GFPI-F-176, nuestro propósito primordial es brindarte apoyo integral (orientación socioeconómica de Bienestar, apoyo psicosocial, revisión de plazos para entrega de evidencias o alternativas de formación) para evitar que tu proceso formativo se interrumpa.

Te solicitamos responder a este correo o acercarte a la Coordinación Académica para dialogar y formalizar las acciones de apoyo concertadas.

Cordialmente,

${instructorConfig.nombre}
Instructor Responsable de Ficha
Correo Institucional: ${instructorConfig.correoInstitucional}
${instructorConfig.centroFormacion}
Servicio Nacional de Aprendizaje - SENA`
      );
    } else if (type === 'desercion_3') {
      setEmailTo(instructorConfig.coordinacionFormacionCorreo);
      setEmailCc(instructorConfig.coordinacionAcademicaCorreo);
      setEmailSubject(`REPORTE OFICIAL DE DESERCIÓN - Ficha ${currentFicha.codigo} ${currentFicha.programa}`);
      setEmailBody(
`PARA: Coordinación de Formación Profesional Integral
CON COPIA: Coordinación Académica
DE: ${instructorConfig.nombre} (Instructor Técnico Responsable)
CORREO REMITENTE: ${instructorConfig.correoInstitucional}
FECHA: ${new Date().toLocaleDateString('es-CO')}

ASUNTO: Remisión de Reporte Grupal de Deserción por Inasistencias (Art. 30 Acuerdo 09 de 2024)

Por medio de la presente, y en estricto cumplimiento de los Artículos 30 (Numeral 1, Literal a) y 31 del Reglamento del Aprendiz SENA (Acuerdo 09 de 2024) y el Protocolo GFPI-PR-001, me permito remitir formalmente la novedad de presunta deserción para el siguiente aprendiz:

- Aprendiz: ${defaultAp ? `${defaultAp.nombres} ${defaultAp.apellidos}` : 'Aprendiz SENA'}
- Documento: ${defaultAp?.documento || '---'}
- Ficha de Caracterización: ${currentFicha.codigo} - ${currentFicha.programa}
- Causal: Inasistencia injustificada durante tres (3) días consecutivos o más sin soporte válido (Novedad Código 3.1).
- Actuaciones Preventivas Agotadas: Se realizaron llamadas telefónicas y citaciones vía correo electrónico sin obtención de justificación válida conforme al Artículo 28.

Se adjunta al expediente la planilla de asistencia y el Formato de Reporte Grupal de Deserción para el correspondiente trámite ante el Comité de Evaluación y Seguimiento según el debido proceso.

Atentamente,

${instructorConfig.nombre}
Instructor SENA CCIT Córdoba
C.C. ${instructorConfig.documentoCc}`
      );
    }
  };

  // Requirement 6: Outlook Institutional Connection handlers
  const handleOpenOutlookWeb = () => {
    if (!emailTo || !emailSubject || !emailBody) {
      alert('Por favor complete destinatario, asunto y cuerpo del mensaje.');
      return;
    }

    // Save to local database logs
    recordEmailInDatabase('Outlook Web (Office 365)');

    // Generate Microsoft 365 Outlook compose URL
    const outlookUrl = generateOutlookWebLink(emailTo, emailCc, emailSubject, emailBody);
    window.open(outlookUrl, '_blank');
  };

  const handleOpenOutlookDesktop = () => {
    if (!emailTo || !emailSubject || !emailBody) {
      alert('Por favor complete destinatario, asunto y cuerpo del mensaje.');
      return;
    }

    recordEmailInDatabase('Outlook Escritorio (mailto)');
    const mailtoUrl = generateMailtoLink(emailTo, emailCc, emailSubject, emailBody);
    window.location.href = mailtoUrl;
  };

  const recordEmailInDatabase = (via: string) => {
    const newLog: EmailLog = {
      id: `em-${Date.now()}`,
      fecha: new Date().toLocaleString('es-CO'),
      tipo: emailSubject.toLowerCase().includes('deserción') 
        ? 'REPORTE_DESERCION_3_MAS' 
        : (emailSubject.toLowerCase().includes('diálogo') || emailSubject.toLowerCase().includes('retardo') || emailSubject.toLowerCase().includes('exhortación') ? 'EXHORTACION_RETARDO' : 'ALERTA_PREVENCION_1_2'),
      destinatario: `${emailTo} (Vía ${via})`,
      copia: emailCc || undefined,
      asunto: emailSubject,
      cuerpo: emailBody,
      fichaId: currentFicha.id,
      aprendizId: emailAprendizRef?.id,
      aprendizNombre: emailAprendizRef ? `${emailAprendizRef.nombres} ${emailAprendizRef.apellidos}` : undefined
    };

    setEmailLogs(prev => [newLog, ...prev]);
    setEmailSentSuccess(true);
    setTimeout(() => setEmailSentSuccess(false), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Export GFPI-F-176 to CSV
  const handleExportGFPICSV = () => {
    const currentFichaGFPI = gfpiRecords.filter(r => r.fichaId === currentFicha.id);
    let csv = 'No,FechaRegistro,TipoDoc,NumeroDocumento,NombreAprendiz,SituacionRiesgo,CategoriaTabla1,CausaTabla1,EscaloCaso,AQuienEscalo,AccionesAdelantadas,EstadoFinalTrimestre\n';
    currentFichaGFPI.forEach((item, idx) => {
      const ap = aprendices.find(a => a.id === item.aprendizId);
      csv += `${idx + 1},${item.fechaRegistro},"${ap?.tipoDocumento || 'CC'}",${item.documentoAprendiz},"${item.nombreAprendiz}","${item.situacionRiesgo}","${item.categoriaTabla1}","${item.causaTabla1}",${item.escaloCaso ? 'SI' : 'NO'},"${item.aQuienEscalo || '-'}","${item.accionesAdelantadas || '-'}","${item.estadoFinalTrimestre}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Formato_GFPI_F_176_Ficha_${currentFicha.codigo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export GFPI-F-176 to Excel (.xlsx) with official institutional template
  const handleExportGFPIExcel = () => {
    exportGFPI176ToExcel(currentFicha, gfpiRecords, instructorConfig, aprendices);
  };

  // Export GFPI-F-176 to PDF (.pdf) with official layout & autotable
  const handleExportGFPIPDF = () => {
    exportGFPI176ToPDF(currentFicha, gfpiRecords, instructorConfig, aprendices);
  };

  // Delete individual GFPI-F-176 record
  const handleDeleteGFPIRecord = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro del Formato GFPI-F-176?')) {
      setGfpiRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Export Reporte Grupal de Deserción to CSV
  const handleExportDesercionCSV = () => {
    const currentFichaDesercion = desercionRecords.filter(r => r.fichaId === currentFicha.id);
    let csv = 'No,TipoDoc,NumeroDocumento,ApellidosNombres,Correo,Telefono,CodigoTipoNovedad,TipoNovedad,CodigoCausa,CausaDesercion,FechaDesercion,Observaciones\n';
    currentFichaDesercion.forEach((item, idx) => {
      const ap = aprendices.find(a => a.id === item.aprendizId);
      csv += `${idx + 1},"${ap?.tipoDocumento || 'CC'}",${item.documentoAprendiz},"${item.apellidosNombres}",${item.correo},"${ap?.celular || ap?.telefono || '-'}",${item.tipoNovedadCodigo},"${item.tipoNovedadTexto}",${item.causaCodigo},"${item.causaTexto}",${item.fechaDesercion},"${item.observaciones}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Grupal_Desercion_Ficha_${currentFicha.codigo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Reporte Grupal de Deserción to Excel (.xlsx) with official institutional template
  const handleExportDesercionExcel = () => {
    exportDesercionToExcel(currentFicha, desercionRecords, instructorConfig, aprendices);
  };

  // Export Reporte Grupal de Deserción to PDF (.pdf) with official layout & autotable
  const handleExportDesercionPDF = () => {
    exportDesercionToPDF(currentFicha, desercionRecords, instructorConfig, aprendices);
  };

  // Delete individual Desertion record
  const handleDeleteDesercionRecord = (id: string) => {
    if (confirm('¿Está seguro de eliminar este aprendiz del Reporte Grupal de Deserción?')) {
      setDesercionRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Clear email compose draft
  const handleClearEmailDraft = () => {
    setEmailTo('');
    setEmailCc('');
    setEmailSubject('');
    setEmailBody('');
    setEmailAprendizRef(null);
  };

  // Clear entire email history
  const handleClearEmailHistory = () => {
    if (emailLogs.length === 0) return;
    if (confirm('¿Está seguro de borrar todo el historial de correos registrados en la base de datos?')) {
      setEmailLogs([]);
    }
  };

  // Export email history to CSV
  const handleExportEmailLogsCSV = () => {
    let csv = 'Fecha,Destinatario,Copia,Asunto,Tipo,Aprendiz,Cuerpo\n';
    emailLogs.forEach(l => {
      csv += `"${l.fecha}","${l.destinatario}","${l.copia || ''}","${l.asunto}","${l.tipo}","${l.aprendizNombre || ''}","${l.cuerpo.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Historial_Correos_Outlook_SENA_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export email history to Excel (.xlsx)
  const handleExportEmailLogsExcel = () => {
    const rows: any[][] = [
      ['SERVICIO NACIONAL DE APRENDIZAJE - SENA'],
      ['Centro de Comercio, Industria y Turismo (CCIT) — Regional Córdoba'],
      ['HISTORIAL DE COMUNICACIONES Y NOTIFICACIONES OUTLOOK SENA'],
      ['Fecha de Extracción:', new Date().toLocaleString('es-CO')],
      [],
      [
        'No.',
        'Fecha y Hora',
        'Destinatario (Para)',
        'Copia (CC)',
        'Asunto',
        'Tipo de Notificación',
        'Aprendiz Relacionado',
        'Cuerpo del Mensaje'
      ]
    ];

    emailLogs.forEach((l, idx) => {
      rows.push([
        idx + 1,
        l.fecha,
        l.destinatario,
        l.copia || '-',
        l.asunto,
        l.tipo,
        l.aprendizNombre || '-',
        l.cuerpo
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Outlook');
    XLSX.writeFile(workbook, `Historial_Correos_Outlook_SENA_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-orange-200">
              <span>Módulo 3</span>
              <span>•</span>
              <span>Gestión de Protocolos, Formatos y Correo Outlook</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestión del Proceso & Diligenciamiento de Formatos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocolo <strong>GFPI-PR-001</strong>, Formato <strong>GFPI-F-176</strong>, <strong>Reporte Grupal de Deserción</strong> y Conexión con <strong>Microsoft Outlook SENA</strong>.
            </p>
          </div>

          {/* Sub-tabs switcher */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
            <button
              onClick={() => setActiveSubTab('gfpi176')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'gfpi176'
                  ? 'bg-white dark:bg-slate-900 text-orange-700 dark:text-orange-400 shadow-xs border border-orange-200 dark:border-orange-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Formato GFPI-F-176 ({gfpiRecords.filter(r => r.fichaId === currentFicha.id).length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('reporte')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'reporte'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs border border-rose-200 dark:border-rose-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileWarning className="w-3.5 h-3.5" />
              <span>Reporte Grupal Deserción ({desercionRecords.filter(r => r.fichaId === currentFicha.id).length})</span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('emails');
                if (!emailSubject) loadTemplate('exhortacion');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'emails'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Outlook SENA ({emailLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: Formato GFPI-F-176 */}
      {activeSubTab === 'gfpi176' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-800 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wide">
                  Código Oficial: GFPI-F-176 • Versión: 01
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Plataforma CompromISO SENA</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                Formato Ruta de atención para la prevención de la Deserción
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aplica para aprendices con 1 o 2 inasistencias injustificadas según Protocolo GFPI-PR-001 (Tablas 1 y 2).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handleExportGFPIPDF}
                className="px-3 py-2 rounded-xl bg-[#00324D] hover:bg-[#002538] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Descargar Formato GFPI-F-176 oficial en PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar PDF Oficial</span>
              </button>
              <button
                type="button"
                onClick={handleExportGFPIExcel}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Exportar formato GFPI-F-176 estructurado a Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Excel Oficial</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Imprimir formato oficial o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={handleExportGFPICSV}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Exportar registros del formato GFPI-F-176 a CSV"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedAprendizGFPI(targetAprendizForAction?.id || fichaAprendices[0]?.id || '');
                  setShowGFPIModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Diligenciar GFPI-F-176</span>
              </button>
            </div>
          </div>

          {/* Formato Table View */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none">
            <div className="border-b-2 border-slate-800 dark:border-slate-700 p-4 bg-slate-50/70 dark:bg-slate-800/90">
              <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#39A900] text-white flex items-center justify-center font-black text-sm">
                    S
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Proceso Gestión de la Formación Profesional Integral</div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">Formato Ruta de atención para la prevención de la Deserción</div>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Código:</span> GFPI-F-176 &nbsp;|&nbsp; <span className="font-bold">Versión:</span> 01
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3">
                <div className="p-2 bg-slate-100/60 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Regional</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{currentFicha.regional}</span>
                </div>
                <div className="p-2 bg-slate-100/60 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Centro de Formación</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{currentFicha.centroFormacion}</span>
                </div>
                <div className="p-2 bg-slate-100/60 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Código y Denominación Programa</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{currentFicha.programa}</span>
                </div>
                <div className="p-2 bg-slate-100/60 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">No. de Ficha & Nivel</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">Ficha {currentFicha.codigo} ({currentFicha.nivel})</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-white uppercase text-[9px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Fecha Registro</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Nombre Aprendiz</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Situación de Riesgo</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Causa (Tabla 1 GFPI-PR-001)</th>
                    <th className="py-2.5 px-3 text-center">¿Escaló?</th>
                    <th className="py-2.5 px-3 min-w-[180px]">¿A quién escaló? (Tabla 2)</th>
                    <th className="py-2.5 px-3 min-w-[190px]">Acciones Adelantadas</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Estado Fin Trimestre</th>
                    <th className="py-2.5 px-3 text-center print:hidden">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gfpiRecords.filter(r => r.fichaId === currentFicha.id).length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No hay registros en la ruta GFPI-F-176 para la Ficha {currentFicha.codigo}.
                      </td>
                    </tr>
                  ) : (
                    gfpiRecords
                      .filter(r => r.fichaId === currentFicha.id)
                      .map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap text-slate-700 dark:text-slate-300">{item.fechaRegistro}</td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{item.documentoAprendiz}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{item.nombreAprendiz}</td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 leading-snug">{item.situacionRiesgo}</td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded text-[10px] block mb-1">
                              {item.categoriaTabla1}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 text-[11px]">{item.causaTabla1}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                            {item.escaloCaso ? 'Sí' : 'No'}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px] leading-snug">
                            {item.aQuienEscalo}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px] leading-snug">
                            {item.accionesAdelantadas}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                              {item.estadoFinalTrimestre}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const ap = aprendices.find(a => a.id === item.aprendizId);
                                  if (ap) {
                                    setEmailAprendizRef(ap);
                                    loadTemplate('alerta_1_2');
                                    setActiveSubTab('emails');
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Enviar correo institucional al aprendiz"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGFPIRecord(item.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                title="Eliminar este registro del Formato GFPI-F-176"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row justify-between items-center gap-2">
              <span><strong>Instructor Responsable:</strong> {instructorConfig.nombre} (C.C. {instructorConfig.documentoCc})</span>
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">Sistema Integrado de Gestión y Autocontrol SENA</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Formato Reporte Grupal de Deserción */}
      {activeSubTab === 'reporte' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wide">
                  Reglamento del Aprendiz • Acuerdo 09 de 2024 (Art. 30)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Remisión a Coordinación de Formación con copia a Académica</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                Reporte Grupal de Deserción SENA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Incurren aprendices con ≥3 días consecutivos o ≥5 no continuos de inasistencia injustificada o etapa productiva vencida.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handleExportDesercionPDF}
                className="px-3 py-2 rounded-xl bg-[#00324D] hover:bg-[#002538] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Descargar Reporte Grupal de Deserción oficial en PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar PDF Oficial</span>
              </button>
              <button
                type="button"
                onClick={handleExportDesercionExcel}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Exportar reporte grupal de deserción estructurado a Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Excel Oficial</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Imprimir reporte oficial o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={handleExportDesercionCSV}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Exportar reporte de deserción a CSV"
              >
                <Download className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedAprendizDesercion(targetAprendizForAction?.id || fichaAprendices[0]?.id || '');
                  setShowDesercionModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Reportar en Deserción Grupal</span>
              </button>
            </div>
          </div>

          {/* Formato Reporte Grupal Visual */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-800 dark:border-slate-700 shadow-md overflow-hidden print:border-none">
            <div className="border-b-2 border-slate-800 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#39A900] text-white flex items-center justify-center font-black text-2xl shadow-sm">
                    S
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                      SERVICIO NACIONAL DE APRENDIZAJE SENA
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                      REPORTE GRUPAL DE DESERCIÓN
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                      {instructorConfig.regional} — {instructorConfig.centroFormacion}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400">FECHA DEL REPORTE</div>
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {currentFicha.fechaReporte || new Date().toLocaleDateString('es-CO')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">Programa de Formación</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{currentFicha.programa}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">No. de Ficha</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{currentFicha.codigo}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">Horario & Jornada</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{currentFicha.horario} ({currentFicha.jornada})</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold block">Instructor & C.C.</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{instructorConfig.nombre} — {instructorConfig.documentoCc}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#00324D] text-white uppercase text-[9px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">No.</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Documento</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Apellidos y Nombres</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Correo Electrónico</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Tipo de Novedad</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Causa de Deserción</th>
                    <th className="py-2.5 px-3 min-w-[100px]">Fecha Deserción</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Observaciones</th>
                    <th className="py-2.5 px-3 text-center print:hidden">Trámite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {desercionRecords.filter(r => r.fichaId === currentFicha.id).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No hay aprendices registrados en reporte de deserción para esta ficha.
                      </td>
                    </tr>
                  ) : (
                    desercionRecords
                      .filter(r => r.fichaId === currentFicha.id)
                      .map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 dark:text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">{item.documentoAprendiz}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{item.apellidosNombres}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">{item.correo}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-[10px]">
                              {item.tipoNovedadCodigo}
                            </span>
                            <span className="block text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{item.tipoNovedadTexto}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">
                              Causa {item.causaCodigo}
                            </span>
                            <span className="block text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{item.causaTexto}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap text-slate-700 dark:text-slate-300">{item.fechaDesercion}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px] leading-snug">{item.observaciones}</td>
                          <td className="py-3 px-3 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const ap = aprendices.find(a => a.id === item.aprendizId);
                                  if (ap) {
                                    setEmailAprendizRef(ap);
                                    loadTemplate('desercion_3');
                                    setActiveSubTab('emails');
                                  }
                                }}
                                className="px-2.5 py-1 bg-[#00324D] hover:bg-[#002538] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Oficiar remisión por correo Outlook"
                              >
                                <Send className="w-3 h-3 text-emerald-400" />
                                <span>Oficiar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDesercionRecord(item.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                title="Eliminar este aprendiz del Reporte Grupal de Deserción"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Cause Reference Key from OCR (Bottom of Sheet) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-800 dark:border-slate-700 text-[10px] space-y-3">
              <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800/80">
                <span className="font-black text-slate-800 dark:text-slate-100 uppercase block mb-1">
                  REFERENCIA OFICIAL: TIPOS DE NOVEDAD
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-slate-600 dark:text-slate-300">
                  <div>• 1. Cancelación Matrícula Índole Académico (1.1 Contrato, 1.2 Plan Mejoramiento)</div>
                  <div>• 2. Cancelación Índole Disciplinario (2.1 Plan Mejoramiento, 2.2 Debido Proceso)</div>
                  <div>• <strong>3. Deserción Proceso Formación:</strong> 3.1 Inasistencia 3 días consecutivos o más sin justificación | 3.2 Sin evidencia productiva | 3.3 No reintegra tras aplazamiento</div>
                </div>
              </div>

              <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800/80">
                <span className="font-black text-slate-800 dark:text-slate-100 uppercase block mb-1">
                  TABLA DE 23 CAUSAS DE DESERCIÓN (Acuerdo 09 / Formato Reporte Grupal)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300">
                  {reporteDesercionData.causas_de_desercion_oficiales.map(c => (
                    <div key={c.codigo} className="truncate">
                      <strong>{c.codigo}.</strong> {c.nombre}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures section (Page 1 OCR bottom) */}
              <div className="grid grid-cols-2 gap-8 pt-4 pb-2 border-t border-slate-300 dark:border-slate-700">
                <div className="text-center">
                  <div className="border-b border-slate-800 dark:border-slate-500 pb-8 mx-auto max-w-xs"></div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 mt-1">{instructorConfig.nombre}</div>
                  <div className="text-slate-500 dark:text-slate-400">Instructor Responsable</div>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-800 dark:border-slate-500 pb-8 mx-auto max-w-xs"></div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 mt-1">Coordinación Académica CCIT</div>
                  <div className="text-slate-500 dark:text-slate-400">Coordinador Académico</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Redactor y Gestor de Correos con Conexión Outlook */}
      {activeSubTab === 'emails' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Composer (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
            {/* Outlook Connection Status Card */}
            <div className="bg-gradient-to-r from-blue-900 to-[#00324D] rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                      Conexión Activa con Microsoft 365 Outlook
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="text-sm font-black text-white">
                    Remitente Institucional: {instructorConfig.correoInstitucional}
                  </div>
                  <div className="text-[11px] text-blue-200">
                    Instructor: {instructorConfig.nombre} ({instructorConfig.centroFormacion})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configurar Cuentas</span>
              </button>
            </div>

            {/* Template Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Redactor Institucional de Notificaciones
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccione una plantilla o redacte directamente para enviar por Outlook SENA.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => loadTemplate('exhortacion')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Plantilla de diálogo cercano por retardo"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Plantilla Retardo (Diálogo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate('alerta_1_2')}
                  className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 text-xs font-bold transition cursor-pointer"
                >
                  1-2 Inasistencias (GFPI-PR-001)
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate('desercion_3')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold transition cursor-pointer"
                >
                  Deserción ≥3 (Art. 30)
                </button>
              </div>
            </div>

            {/* Compose Inputs */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Para (Aprendiz / Coordinación)</label>
                  <input
                    type="email"
                    required
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="aprendiz@soy.sena.edu.co"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Con copia (CC)</label>
                  <input
                    type="text"
                    value={emailCc}
                    onChange={e => setEmailCc(e.target.value)}
                    placeholder="bienestarccit@sena.edu.co, coordinacion.academica.ccit@sena.edu.co"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Asunto Institucional</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Asunto formal SENA..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cuerpo del Comunicado</label>
                <textarea
                  rows={10}
                  required
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs font-sans leading-relaxed bg-slate-50 focus:bg-white"
                />
              </div>

              {emailSentSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ¡Comunicación registrada exitosamente en la base de datos institucional y conectada a Outlook!
                  </span>
                </div>
              )}

              {/* Requirement 6: Outlook Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearEmailDraft}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                    title="Borrar borrador de correo y limpiar campos"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Limpiar Campos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`ASUNTO: ${emailSubject}\n\n${emailBody}`);
                      alert('Asunto y cuerpo copiados al portapapeles.');
                    }}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Copiar Texto
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenOutlookDesktop}
                    className="px-3.5 py-2 border border-blue-300 hover:bg-blue-50 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Abre la aplicación de escritorio de Outlook"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Abrir en Outlook Escritorio</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenOutlookWeb}
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
                    title="Envía el correo directamente abriendo Microsoft 365 Outlook Web con su cuenta institucional"
                  >
                    <Globe className="w-4 h-4 text-blue-200" />
                    <span>Enviar desde Outlook SENA (Office 365)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Email History log from Database */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col max-h-[620px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Registro de Envíos en Base de Datos
                </h4>
                <p className="text-[11px] text-slate-500">
                  Comunicaciones registradas con trazabilidad ({emailLogs.length} notificaciones).
                </p>
              </div>

              {emailLogs.length > 0 && (
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleExportEmailLogsExcel}
                    className="px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Exportar historial de comunicaciones a Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportEmailLogsCSV}
                    className="px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Exportar historial de comunicaciones a CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearEmailHistory}
                    className="px-2.5 py-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Borrar todo el historial de envíos de la base de datos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar Historial</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {emailLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No se han emitido notificaciones todavía.
                </div>
              ) : (
                emailLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{log.fecha}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        log.tipo === 'REPORTE_DESERCION_3_MAS' 
                          ? 'bg-rose-100 text-rose-800' 
                          : (log.tipo === 'EXHORTACION_RETARDO' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800')
                      }`}>
                        {log.tipo === 'REPORTE_DESERCION_3_MAS' ? 'Deserción' : (log.tipo === 'EXHORTACION_RETARDO' ? 'Diálogo / Retardo' : 'Prevención')}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 truncate">{log.asunto}</div>
                    <div className="text-[11px] text-slate-600 font-mono truncate">
                      Para: {log.destinatario}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {log.cuerpo}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Diligenciar Formato GFPI-F-176 */}
      {showGFPIModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#00324D] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-orange-400 font-mono uppercase font-bold">Protocolo GFPI-PR-001</span>
                <h3 className="font-bold text-sm sm:text-base">
                  Diligenciar Formato GFPI-F-176 (Ruta de Prevención a la Deserción)
                </h3>
              </div>
              <button
                onClick={() => setShowGFPIModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGFPI} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aprendiz en Alerta (Orden Alfabético por Nombre)
                </label>
                <select
                  value={selectedAprendizGFPI}
                  onChange={e => setSelectedAprendizGFPI(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                >
                  {fichaAprendices.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombres} {a.apellidos} — {a.tipoDocumento} {a.documento} ({a.estadoSena || 'EN FORMACION'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Situación de Riesgo que Presenta el Aprendiz
                </label>
                <input
                  type="text"
                  required
                  value={situacionRiesgoText}
                  onChange={e => setSituacionRiesgoText(e.target.value)}
                  placeholder="Ej. Inasistencia injustificada los días 24 y 25 de septiembre / retraso en evidencias"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Categoría de Riesgo (Tabla 1 Protocolo GFPI-PR-001)
                  </label>
                  <select
                    value={selectedCategoria}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    {protocoloData.tabla_1_elementos_conceptuales.map(c => (
                      <option key={c.categoria} value={c.categoria}>
                        {c.categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Causa Específica Identificada (Tabla 1)
                  </label>
                  <select
                    value={selectedCausa}
                    onChange={e => setSelectedCausa(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                  >
                    {protocoloData.tabla_1_elementos_conceptuales
                      .find(c => c.categoria === selectedCategoria)
                      ?.causas_riesgo.map(cause => (
                        <option key={cause} value={cause}>
                          {cause}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ¿Escaló según la Ruta?
                  </label>
                  <select
                    value={escalo ? 'true' : 'false'}
                    onChange={e => setEscalo(e.target.value === 'true')}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                  >
                    <option value="true">Sí (Conforme a Tabla 2)</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ¿A quién lo escaló? (Tabla 2)
                  </label>
                  <input
                    type="text"
                    value={aQuienEscaloText}
                    onChange={e => setAQuienEscaloText(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Acciones Adelantadas de la Ruta (Estrategias de Permanencia)
                </label>
                <textarea
                  rows={3}
                  value={accionesText}
                  onChange={e => setAccionesText(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Estado del Aprendiz al Finalizar el Trimestre
                </label>
                <select
                  value={estadoFinalTrimestre}
                  onChange={e => setEstadoFinalTrimestre(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option value="Continuó en formación (Superado)">Continuó en formación (Superado)</option>
                  <option value="En seguimiento preventivo">En seguimiento preventivo</option>
                  <option value="Aplazamiento justificado">Aplazamiento justificado</option>
                  <option value="Traslado">Traslado</option>
                  <option value="Retiro voluntario">Retiro voluntario</option>
                  <option value="Remitido a deserción grupal">Remitido a deserción grupal</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGFPIModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Guardar en Formato GFPI-F-176
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Reporte Grupal de Deserción */}
      {showDesercionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-rose-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-rose-200 font-mono uppercase font-bold">Reglamento Aprendiz Art. 30</span>
                <h3 className="font-bold text-sm sm:text-base">
                  Registrar Aprendiz en Reporte Grupal de Deserción
                </h3>
              </div>
              <button
                onClick={() => setShowDesercionModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDesercion} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aprendiz en Causal de Deserción (Orden Alfabético por Nombre)
                </label>
                <select
                  value={selectedAprendizDesercion}
                  onChange={e => setSelectedAprendizDesercion(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                >
                  {fichaAprendices.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombres} {a.apellidos} — CC {a.documento} ({a.estadoSena || 'EN FORMACION'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tipo de Novedad (Códigos Oficiales)
                  </label>
                  <select
                    value={tipoNovedadCodigo}
                    onChange={e => setTipoNovedadCodigo(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    {reporteDesercionData.tipos_de_novedad.flatMap(cat => 
                      cat.subtipos.map(sub => (
                        <option key={sub.codigo} value={sub.codigo}>
                          {sub.codigo} - {sub.nombre}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Causa de Deserción (1 a 23 Oficial)
                  </label>
                  <select
                    value={causaCodigo}
                    onChange={e => setCausaCodigo(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                  >
                    {reporteDesercionData.causas_de_desercion_oficiales.map(c => (
                      <option key={c.codigo} value={c.codigo}>
                        {c.codigo}. {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de la Deserción</label>
                <input
                  type="date"
                  value={fechaDesercion}
                  onChange={e => setFechaDesercion(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observaciones Detalladas (Días consecutivos, contactos previos)
                </label>
                <textarea
                  rows={3}
                  value={observacionesDesercion}
                  onChange={e => setObservacionesDesercion(e.target.value)}
                  placeholder="El aprendiz acumuló 3 días consecutivos de inasistencia sin justificación reportada..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDesercionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Guardar en Reporte Grupal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configuración de Cuentas Institucionales Outlook */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#00324D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Configuración de Cuenta Outlook SENA</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Instructor</label>
                <input
                  type="text"
                  value={instructorConfig.nombre}
                  onChange={e => setInstructorConfig({ ...instructorConfig, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Institucional Outlook (@sena.edu.co)</label>
                <input
                  type="email"
                  value={instructorConfig.correoInstitucional}
                  onChange={e => setInstructorConfig({ ...instructorConfig, correoInstitucional: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">C.C. Instructor</label>
                  <input
                    type="text"
                    value={instructorConfig.documentoCc}
                    onChange={e => setInstructorConfig({ ...instructorConfig, documentoCc: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regional</label>
                  <input
                    type="text"
                    value={instructorConfig.regional}
                    onChange={e => setInstructorConfig({ ...instructorConfig, regional: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Coordinación Académica</label>
                <input
                  type="email"
                  value={instructorConfig.coordinacionAcademicaCorreo}
                  onChange={e => setInstructorConfig({ ...instructorConfig, coordinacionAcademicaCorreo: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Bienestar al Aprendiz</label>
                <input
                  type="email"
                  value={instructorConfig.bienestarCorreo}
                  onChange={e => setInstructorConfig({ ...instructorConfig, bienestarCorreo: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-5 py-2 bg-[#39A900] hover:bg-[#2e8800] text-white rounded-xl font-bold cursor-pointer"
                >
                  Guardar en Base de Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
