import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Filter, 
  ShieldAlert, 
  Search,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Sparkles,
  FileDown,
  X,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Ficha, Aprendiz, RegistroAsistencia, FormatoGFPI176Item, FormatoDesercionItem, EmailLog, AprendizRiesgoSummary } from '../types/attendance';
import { calculateAprendizSummary, getBadgeColor } from '../utils/attendanceLogic';
import { sortAprendicesByName } from '../utils/sortUtils';
import protocoloData from '../data/protocoloRutaDesercion.json';
import { generateDashboardPDF } from '../utils/pdfReportGenerator';
import { getTodayDateString, getDaysAgoDateString } from '../utils/dateUtils';

interface AnalyticsDashboardModuleProps {
  fichas: Ficha[];
  aprendices: Aprendiz[];
  attendanceRecords: RegistroAsistencia[];
  gfpiRecords: FormatoGFPI176Item[];
  desercionRecords: FormatoDesercionItem[];
  emailLogs: EmailLog[];
  onNavigateToProcess: (tab: 'gfpi176' | 'reporte' | 'emails', aprendiz?: Aprendiz) => void;
}

export const AnalyticsDashboardModule: React.FC<AnalyticsDashboardModuleProps> = ({
  fichas,
  aprendices,
  attendanceRecords,
  gfpiRecords,
  desercionRecords,
  emailLogs,
  onNavigateToProcess
}) => {
  // Advanced filters state - synchronized with real calendar dates
  const [filterFichaId, setFilterFichaId] = useState<string>('ALL');
  const [filterJornada, setFilterJornada] = useState<string>('ALL');
  const [filterRiesgo, setFilterRiesgo] = useState<string>('ALL');
  const [dateRangePreset, setDateRangePreset] = useState<'ALL' | '7D' | '30D' | 'CUSTOM'>('ALL');
  const [filterFechaInicio, setFilterFechaInicio] = useState<string>(() => getDaysAgoDateString(30));
  const [filterFechaFin, setFilterFechaFin] = useState<string>(() => getTodayDateString());
  const [searchLearner, setSearchLearner] = useState<string>('');

  // Filtered records by date, ficha and jornada
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter(r => {
      // Ficha filter
      if (filterFichaId !== 'ALL' && r.fichaId !== filterFichaId) return false;

      // Jornada filter
      if (filterJornada !== 'ALL') {
        const f = fichas.find(item => item.id === r.fichaId);
        if (f && f.jornada !== filterJornada) return false;
      }

      // Date filter dynamically relative to real current calendar date
      if (dateRangePreset === '7D') {
        const start7 = getDaysAgoDateString(7);
        const today = getTodayDateString();
        return r.fecha >= start7 && r.fecha <= today;
      }
      if (dateRangePreset === '30D') {
        const start30 = getDaysAgoDateString(30);
        const today = getTodayDateString();
        return r.fecha >= start30 && r.fecha <= today;
      }
      if (dateRangePreset === 'CUSTOM') {
        if (filterFechaInicio && r.fecha < filterFechaInicio) return false;
        if (filterFechaFin && r.fecha > filterFechaFin) return false;
      }

      return true;
    });
  }, [attendanceRecords, filterFichaId, filterJornada, dateRangePreset, filterFechaInicio, filterFechaFin, fichas]);

  // Evaluated apprentices summaries sorted alphabetically by name
  const learnerSummaries = useMemo(() => {
    // Sort base apprentices alphabetically by name
    const sortedBase = sortAprendicesByName(aprendices);

    return sortedBase
      .filter(ap => {
        // Ficha filter
        if (filterFichaId !== 'ALL' && ap.fichaId !== filterFichaId) return false;
        // Jornada filter
        if (filterJornada !== 'ALL') {
          const f = fichas.find(item => item.id === ap.fichaId);
          if (f && f.jornada !== filterJornada) return false;
        }
        // Search text
        if (searchLearner) {
          const t = `${ap.nombres} ${ap.apellidos} ${ap.documento}`.toLowerCase();
          if (!t.includes(searchLearner.toLowerCase())) return false;
        }
        return true;
      })
      .map(ap => {
        const f = fichas.find(item => item.id === ap.fichaId) || fichas[0];
        return calculateAprendizSummary(ap, f, filteredAttendance, gfpiRecords, desercionRecords);
      })
      .filter(summary => {
        if (filterRiesgo === 'ALL') return true;
        if (filterRiesgo === 'NORMAL') return summary.estadoCalculado === 'NORMAL';
        if (filterRiesgo === 'JUSTIFICADA') return summary.estadoCalculado === 'JUSTIFICADA';
        if (filterRiesgo === 'RETARDO') return summary.estadoCalculado === 'RETARDO';
        if (filterRiesgo === 'ALERTA_PREVENTIVA_1_2') return summary.estadoCalculado === 'ALERTA_PREVENTIVA_1_2';
        if (filterRiesgo === 'DESERCION_3_MAS') return summary.estadoCalculado === 'DESERCION_3_MAS';
        return true;
      });
  }, [aprendices, fichas, filteredAttendance, gfpiRecords, desercionRecords, filterFichaId, filterJornada, searchLearner, filterRiesgo]);

  // Aggregate KPI Calculations
  const totalSesionesRegistradas = filteredAttendance.length;
  const totalP = filteredAttendance.filter(r => r.estado === 'P').length;
  const totalR = filteredAttendance.filter(r => r.estado === 'R').length;
  const totalNA = filteredAttendance.filter(r => r.estado === 'NA').length;
  const totalJ = filteredAttendance.filter(r => r.estado === 'J').length;

  // Asistencia efectiva incluye P, R y Justificadas excusadas según el reglamento
  const pctAsistenciaGlobal = totalSesionesRegistradas > 0 
    ? Math.round(((totalP + totalR + totalJ) / totalSesionesRegistradas) * 100) 
    : 100;
  const pctRetardos = totalSesionesRegistradas > 0 
    ? Math.round((totalR / totalSesionesRegistradas) * 100) 
    : 0;
  const pctInasistencia = totalSesionesRegistradas > 0 
    ? Math.round((totalNA / totalSesionesRegistradas) * 100) 
    : 0;
  const pctJustificadas = totalSesionesRegistradas > 0
    ? Math.round((totalJ / totalSesionesRegistradas) * 100)
    : 0;

  const totalAprendicesEvaluados = learnerSummaries.length;
  const countAlertaPreventiva = learnerSummaries.filter(s => s.estadoCalculado === 'ALERTA_PREVENTIVA_1_2').length;
  const countDesercion = learnerSummaries.filter(s => s.estadoCalculado === 'DESERCION_3_MAS').length;
  const countJustificadas = learnerSummaries.filter(s => s.estadoCalculado === 'JUSTIFICADA').length;

  const pctAlertaPreventiva = totalAprendicesEvaluados > 0 
    ? Math.round((countAlertaPreventiva / totalAprendicesEvaluados) * 100) 
    : 0;
  const pctDesercion = totalAprendicesEvaluados > 0 
    ? Math.round((countDesercion / totalAprendicesEvaluados) * 100) 
    : 0;

  // Breakdown of causes according to Protocol GFPI-PR-001 categories
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    protocoloData.tabla_1_elementos_conceptuales.forEach(c => {
      counts[c.categoria] = 0;
    });

    gfpiRecords.forEach(r => {
      if (counts[r.categoriaTabla1] !== undefined) {
        counts[r.categoriaTabla1]++;
      }
    });

    return Object.entries(counts).map(([cat, count]) => ({
      name: cat.replace('Motivos asociados a ', '').replace(' del aprendiz', ''),
      fullName: cat,
      count
    }));
  }, [gfpiRecords]);

  // Causales distribution for charts and PDF report
  const causalesDistribution = useMemo(() => {
    const totalCount = categoryStats.reduce((sum, c) => sum + c.count, 0);
    return categoryStats.map(c => ({
      categoria: c.name,
      count: c.count,
      porcentaje: totalCount > 0 ? Math.round((c.count / totalCount) * 100) : 0,
      color: '#39A900'
    }));
  }, [categoryStats]);

  // Temporal trend by distinct dates
  const temporalTrend = useMemo(() => {
    const datesMap: Record<string, { date: string; fecha: string; P: number; R: number; NA: number; J: number; total: number }> = {};
    
    // Default to last 5 days
    for (let i = 4; i >= 0; i--) {
      const d = getDaysAgoDateString(i);
      datesMap[d] = { date: d, fecha: d, P: 0, R: 0, NA: 0, J: 0, total: 0 };
    }

    filteredAttendance.forEach(r => {
      if (!datesMap[r.fecha]) {
        datesMap[r.fecha] = { date: r.fecha, fecha: r.fecha, P: 0, R: 0, NA: 0, J: 0, total: 0 };
      }
      if (r.estado === 'P') datesMap[r.fecha].P++;
      else if (r.estado === 'R') datesMap[r.fecha].R++;
      else if (r.estado === 'NA') datesMap[r.fecha].NA++;
      else if (r.estado === 'J') datesMap[r.fecha].J++;
      datesMap[r.fecha].total++;
    });

    return Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredAttendance]);

  // User feedback toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showActionToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Export analytic dashboard report to official PDF
  const handleExportPDF = () => {
    generateDashboardPDF({
      fichas,
      filterFichaId,
      filterJornada,
      filterRiesgo,
      dateRangePreset,
      filterFechaInicio,
      filterFechaFin,
      searchLearner,
      learnerSummaries,
      kpis: {
        pctAsistenciaGlobal,
        pctRetardos,
        pctInasistencia,
        countAlertaPreventiva,
        countDesercion,
        totalP,
        totalR,
        totalNA,
        emailCount: emailLogs.length
      },
      temporalTrend,
      causalesDistribution
    });
    showActionToast('¡Reporte analítico generado en formato PDF oficial!');
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterFichaId('ALL');
    setFilterJornada('ALL');
    setFilterRiesgo('ALL');
    setDateRangePreset('ALL');
    setFilterFechaInicio(getDaysAgoDateString(30));
    setFilterFechaFin(getTodayDateString());
    setSearchLearner('');
    showActionToast('Filtros restablecidos a la vista completa', 'info');
  };

  const isAnyFilterActive = filterFichaId !== 'ALL' || filterJornada !== 'ALL' || filterRiesgo !== 'ALL' || dateRangePreset !== 'ALL' || searchLearner !== '';

  // Export complete analytic data to Excel
  const handleExportExcel = () => {
    const currentFicha = fichas.find(f => f.id === filterFichaId);
    const fichaLabel = currentFicha ? `${currentFicha.codigo} - ${currentFicha.programa}` : 'Todas las Fichas';

    const rows: any[][] = [
      ['SERVICIO NACIONAL DE APRENDIZAJE - SENA'],
      ['Centro de Comercio, Industria y Turismo (CCIT) — Regional Córdoba'],
      ['INFORME ANALÍTICO DE ASISTENCIA Y GESTIÓN DE DESERCIÓN (GFPI-PR-001)'],
      ['Fecha de Generación:', new Date().toLocaleString('es-CO')],
      ['Ficha / Programa:', fichaLabel],
      ['Jornada:', filterJornada === 'ALL' ? 'Todas' : filterJornada],
      ['Estado de Riesgo:', filterRiesgo === 'ALL' ? 'Todos los estados' : filterRiesgo],
      ['Período Evaluado:', dateRangePreset === 'ALL' ? 'Todo el Historial' : (dateRangePreset === 'CUSTOM' ? `${filterFechaInicio} al ${filterFechaFin}` : dateRangePreset)],
      ['Búsqueda Activa:', searchLearner || 'Ninguna'],
      ['Total Registros Filtrados:', learnerSummaries.length],
      [],
      [
        'No.',
        'Tipo Documento',
        'Número Documento',
        'Nombres',
        'Apellidos',
        'Ficha',
        'Programa de Formación',
        'Jornada',
        'Estado SofiaPlus',
        'Asistencias (P)',
        'Retardos (R)',
        'Inasistencias Injustificadas (NA)',
        'Justificadas (J - Art. 22)',
        'Faltas Consecutivas',
        '% Asistencia',
        'Estado Protocolo (GFPI-PR-001 / Art. 30)',
        'Acción Metodológica Recomendada'
      ]
    ];

    learnerSummaries.forEach((s, idx) => {
      let estadoProtocolo = 'Asistencia Regular (NORMAL)';
      if (s.estadoCalculado === 'DESERCION_3_MAS') estadoProtocolo = 'Causal Deserción (Art. 30 - >=3 Faltas)';
      else if (s.estadoCalculado === 'ALERTA_PREVENTIVA_1_2') estadoProtocolo = 'Alerta Preventiva GFPI-F-176 (1-2 Faltas)';
      else if (s.estadoCalculado === 'RETARDO') estadoProtocolo = 'Retardos Frecuentes (R)';
      else if (s.estadoCalculado === 'JUSTIFICADA') estadoProtocolo = 'Inasistencia Justificada (Art. 22 Reglamento)';

      let accion = 'Registro normal';
      if (s.estadoCalculado === 'DESERCION_3_MAS') accion = 'Trámite Reporte Deserción Grupal';
      else if (s.estadoCalculado === 'ALERTA_PREVENTIVA_1_2') accion = 'Diligenciar Formato GFPI-F-176';
      else if (s.estadoCalculado === 'RETARDO') accion = 'Enviar Exhortación Outlook Institucional';
      else if (s.estadoCalculado === 'JUSTIFICADA') accion = 'Excusa médica / soporte radicado';

      rows.push([
        idx + 1,
        s.aprendiz.tipoDocumento,
        s.aprendiz.documento,
        s.aprendiz.nombres,
        s.aprendiz.apellidos,
        s.ficha.codigo,
        s.ficha.programa,
        s.ficha.jornada,
        s.aprendiz.estadoSena || 'EN FORMACION',
        s.totalAsistencias,
        s.totalRetardos,
        s.totalInasistencias,
        s.totalInasistenciasJustificadas,
        s.inasistenciasConsecutivas,
        `${s.tasaAsistencia}%`,
        estadoProtocolo,
        accion
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 10 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
      { wch: 35 },
      { wch: 14 },
      { wch: 18 },
      { wch: 15 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 32 },
      { wch: 32 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz Semafórica');
    XLSX.writeFile(workbook, `Reporte_Analitico_SENA_${getTodayDateString()}.xlsx`);
    showActionToast('¡Reporte en formato Excel (.xlsx) exportado y descargado exitosamente!');
  };

  // Export analytic data to CSV
  const handleExportCSV = () => {
    let csv = 'Documento,Nombres,Apellidos,Ficha,Programa,Jornada,EstadoSena,Asistencias(P),Retardos(R),Inasistencias(NA),Justificadas(J),InasistenciasConsecutivas,%Asistencia,EstadoProtocolo\n';
    learnerSummaries.forEach(s => {
      csv += `${s.aprendiz.documento},"${s.aprendiz.nombres}","${s.aprendiz.apellidos}",${s.ficha.codigo},"${s.ficha.programa}",${s.ficha.jornada},"${s.aprendiz.estadoSena || 'EN FORMACION'}",${s.totalAsistencias},${s.totalRetardos},${s.totalInasistencias},${s.totalInasistenciasJustificadas},${s.inasistenciasConsecutivas},${s.tasaAsistencia}%,${s.estadoCalculado}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_analitica_desercion_${getTodayDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showActionToast('¡Datos analíticos exportados en archivo CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Print-only Institutional Header */}
      <div className="hidden print:block mb-4 p-4 border-b-2 border-[#00324D] text-[#00324D]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">SERVICIO NACIONAL DE APRENDIZAJE - SENA</h1>
            <h2 className="text-sm font-semibold">Centro de Comercio, Industria y Turismo (CCIT) — Regional Córdoba</h2>
            <p className="text-xs text-slate-600">Protocolo GFPI-PR-001 & Acuerdo 09 de 2024 • Reporte Analítico de Asistencia</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Fecha: {new Date().toLocaleDateString('es-CO')}</p>
            <p>Aprendices Filtrados: {learnerSummaries.length}</p>
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs print:hidden transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-blue-200 dark:border-blue-800">
              <span>Módulo 4</span>
              <span>•</span>
              <span>Inteligencia Analítica & Indicadores KPI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard de Asistencia & Prevención de Deserción
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
              Métricas consolidadas, factores de riesgo (Protocolo GFPI-PR-001) y semáforo ordenado por nombre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Generate official PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-xl bg-[#39A900] hover:bg-[#2e8800] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95"
              title="Descargar Reporte Analítico Oficial en Formato PDF (incluye datos, gráficas y filtros activos)"
            >
              <FileDown className="w-4 h-4" />
              <span>Generar Reporte en PDF</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Imprimir el Dashboard o vista actual mediante el diálogo del sistema"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Exportar datos analíticos completos en archivo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Exportar datos analíticos en archivo de texto CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Exportar CSV</span>
            </button>

            {/* Clear filters quick action */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Borrar todos los filtros aplicados"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Borrar Filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs print:hidden transition-colors duration-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Filtros Avanzados de Segmentación</span>
            {isAnyFilterActive && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                {learnerSummaries.length} resultados filtrados
              </span>
            )}
          </div>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-1 transition cursor-pointer"
              title="Borrar todos los filtros aplicados y mostrar todos los aprendices"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Borrar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Ficha / Grupo
            </label>
            <select
              value={filterFichaId}
              onChange={e => setFilterFichaId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-[#39A900]"
            >
              <option value="ALL">Todas las Fichas ({fichas.length})</option>
              {fichas.map(f => (
                <option key={f.id} value={f.id}>
                  {f.codigo} - {f.programa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Jornada
            </label>
            <select
              value={filterJornada}
              onChange={e => setFilterJornada(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-[#39A900]"
            >
              <option value="ALL">Todas las Jornadas</option>
              <option value="Diurna">Diurna</option>
              <option value="Nocturna">Nocturna</option>
              <option value="Mixta">Mixta</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Estado de Riesgo
            </label>
            <select
              value={filterRiesgo}
              onChange={e => setFilterRiesgo(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-[#39A900]"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="DESERCION_3_MAS">Causal Deserción (≥3 inasistencias)</option>
              <option value="ALERTA_PREVENTIVA_1_2">Alerta Preventiva (1-2 inasistencias)</option>
              <option value="JUSTIFICADA">Inasistencia Justificada (Art. 22)</option>
              <option value="RETARDO">Con Retardos (R)</option>
              <option value="NORMAL">Asistencia Normal (P)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Período de Análisis
            </label>
            <select
              value={dateRangePreset}
              onChange={e => setDateRangePreset(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-[#39A900]"
            >
              <option value="ALL">Todo el Historial</option>
              <option value="7D">Últimos 7 días</option>
              <option value="30D">Últimos 30 días</option>
              <option value="CUSTOM">Rango Personalizado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Buscar Aprendiz (A-Z)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchLearner}
                onChange={e => setSearchLearner(e.target.value)}
                placeholder="Nombre o CC..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#39A900]"
              />
              {searchLearner && (
                <button
                  type="button"
                  onClick={() => setSearchLearner('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  title="Borrar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {dateRangePreset === 'CUSTOM' && (
          <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase">Desde:</span>
            <input
              type="date"
              value={filterFechaInicio}
              onChange={e => setFilterFechaInicio(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-1.5 text-xs"
            />
            <span className="text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase">Hasta:</span>
            <input
              type="date"
              value={filterFechaFin}
              onChange={e => setFilterFechaFin(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg p-1.5 text-xs"
            />
          </div>
        )}
      </div>

      {/* KPI Cards Grid - 6 Tarjetas con Hegemonía: Porcentaje Principal y Dato de Soporte Abajo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Asistencia Global */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Asistencia Global</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{pctAsistenciaGlobal}%</span>
          </div>
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalP}</span> de {totalSesionesRegistradas} sesiones (P)
          </div>
        </div>

        {/* 2. Tasa Retardos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Tasa Retardos</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{pctRetardos}%</span>
          </div>
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="font-bold text-amber-600 dark:text-amber-400">{totalR}</span> de {totalSesionesRegistradas} sesiones (R)
          </div>
        </div>

        {/* 3. Inasistencias Injustificadas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Injustificadas (NA)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{pctInasistencia}%</span>
          </div>
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="font-bold text-rose-600 dark:text-rose-400">{totalNA}</span> de {totalSesionesRegistradas} sesiones (NA)
          </div>
        </div>

        {/* 4. Justificadas (Art. 22) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Justificadas (J)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{pctJustificadas}%</span>
          </div>
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="font-bold text-sky-600 dark:text-sky-400">{totalJ}</span> con excusa radicada (J)
          </div>
        </div>

        {/* 5. Alerta Preventiva GFPI-176 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Ruta GFPI-F-176</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{pctAlertaPreventiva}%</span>
          </div>
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="font-bold text-orange-600 dark:text-orange-400">{countAlertaPreventiva}</span> de {totalAprendicesEvaluados} aprendices (1-2 NA)
          </div>
        </div>

        {/* 6. Causal Deserción Art. 30 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Causal Deserción</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{pctDesercion}%</span>
          </div>
          <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="font-bold text-rose-600 dark:text-rose-400">{countDesercion}</span> de {totalAprendicesEvaluados} aprendices (≥3 NA)
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Comportamiento Diario de Asistencia
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Distribución diaria de Presentes (P), Retardos (R), Inasistencias (NA) y Justificadas (J)
                </p>
              </div>
              <div className="flex items-center gap-2.5 text-[10px]">
                <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> P
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> R
                </span>
                <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> NA
                </span>
                <span className="flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400">
                  <span className="w-2.5 h-2.5 rounded bg-sky-500"></span> J
                </span>
              </div>
            </div>

            <div className="h-52 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-200 dark:border-slate-800">
              {temporalTrend.map(point => {
                const dayTotal = point.P + point.R + point.NA + point.J || 1;
                const pHeight = Math.round((point.P / dayTotal) * 160);
                const rHeight = Math.round((point.R / dayTotal) * 160);
                const naHeight = Math.round((point.NA / dayTotal) * 160);
                const jHeight = Math.round((point.J / dayTotal) * 160);

                return (
                  <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-20 shadow-md">
                      {point.date}: {point.P}P • {point.R}R • {point.NA}NA • {point.J}J
                    </div>

                    <div className="w-full max-w-[42px] flex flex-col justify-end rounded-t overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <div style={{ height: `${naHeight}px` }} className="bg-rose-500 w-full transition-all"></div>
                      <div style={{ height: `${jHeight}px` }} className="bg-sky-500 w-full transition-all"></div>
                      <div style={{ height: `${rHeight}px` }} className="bg-amber-400 w-full transition-all"></div>
                      <div style={{ height: `${pHeight}px` }} className="bg-emerald-500 w-full transition-all"></div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-full">
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3">
            <span>Rango de fechas activo: <strong>{temporalTrend.length} días analizados</strong></span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Tasa de permanencia alta</span>
          </div>
        </div>

        {/* GFPI Risk Causes Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  Causas de Riesgo de Deserción (Protocolo GFPI-PR-001)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Frecuencia de factores identificados según las 8 categorías oficiales de la Tabla 1
                </p>
              </div>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
                Tabla 1 SENA
              </span>
            </div>

            <div className="space-y-2.5">
              {categoryStats.map(item => {
                const maxCount = Math.max(...categoryStats.map(c => c.count), 4);
                const percent = Math.round((item.count / maxCount) * 100);

                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.count} caso(s)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percent}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.count > 0 ? 'bg-[#39A900]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total casos en ruta GFPI: <strong>{gfpiRecords.length}</strong></span>
            <button
              onClick={() => onNavigateToProcess('gfpi176')}
              className="text-[#39A900] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver casos en Módulo 3</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Apprentice Risk Semaphoric Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Matriz Semafórica de Seguimiento (Orden Alfabético por Nombre)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Clasificación instantánea basada en el protocolo preventivo y reglamento de formación
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Mostrando: <strong className="text-slate-900 dark:text-white font-bold">{learnerSummaries.length} aprendices</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#00324D] dark:bg-slate-950 text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Aprendiz (Orden A-Z)</th>
                <th className="py-3 px-4">Ficha & Programa</th>
                <th className="py-3 px-4 text-center">Estado Formación</th>
                <th className="py-3 px-4 text-center">Tasa Asistencia</th>
                <th className="py-3 px-4 text-center">P / R / NA / J</th>
                <th className="py-3 px-4 text-center">Racha Inasistencias</th>
                <th className="py-3 px-4">Estado Protocolo</th>
                <th className="py-3 px-4 text-right">Acción Metodológica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {learnerSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No se encontraron aprendices con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                learnerSummaries.map(s => {
                  const badge = getBadgeColor(s.estadoCalculado);
                  const isBlocked = (s.aprendiz.estadoSena || '').toUpperCase() !== 'EN FORMACION';

                  return (
                    <tr key={s.aprendiz.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{s.aprendiz.nombres} {s.aprendiz.apellidos}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{s.aprendiz.tipoDocumento} {s.aprendiz.documento}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">Ficha {s.ficha.codigo}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{s.ficha.programa}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                          isBlocked 
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {s.aprendiz.estadoSena || 'EN FORMACION'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded-full ${
                          s.tasaAsistencia >= 85 
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' 
                            : (s.tasaAsistencia >= 70 ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300')
                        }`}>
                          {s.tasaAsistencia}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{s.totalAsistencias}P</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{s.totalRetardos}R</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{s.totalInasistencias}NA</span>
                        {s.totalInasistenciasJustificadas > 0 && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                            <span className="text-sky-600 dark:text-sky-400 font-bold">{s.totalInasistenciasJustificadas}J</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.inasistenciasConsecutivas > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                            {s.inasistenciasConsecutivas} consecutiva(s)
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                          <span>{badge.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.estadoCalculado === 'DESERCION_3_MAS' && (
                          <button
                            onClick={() => onNavigateToProcess('reporte', s.aprendiz)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                          >
                            Oficiar Deserción
                          </button>
                        )}
                        {s.estadoCalculado === 'ALERTA_PREVENTIVA_1_2' && (
                          <button
                            onClick={() => onNavigateToProcess('gfpi176', s.aprendiz)}
                            className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                          >
                            Abrir GFPI-F-176
                          </button>
                        )}
                        {s.estadoCalculado === 'RETARDO' && (
                          <button
                            onClick={() => onNavigateToProcess('emails', s.aprendiz)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                          >
                            Diálogo Outlook
                          </button>
                        )}
                        {s.estadoCalculado === 'JUSTIFICADA' && (
                          <span className="text-sky-700 dark:text-sky-300 text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                            Excusa Art. 22
                          </span>
                        )}
                        {s.estadoCalculado === 'NORMAL' && (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
                            Al día
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
