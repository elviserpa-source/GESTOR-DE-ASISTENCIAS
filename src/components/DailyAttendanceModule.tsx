import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CalendarCheck,
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send, 
  FileSpreadsheet, 
  AlertTriangle,
  FileWarning,
  CheckCheck,
  Search,
  Info,
  Lock,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
  Printer,
  Download,
  RotateCcw,
  Trash2,
  X,
  Upload,
  FileCheck,
  FileText,
  ShieldCheck,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Ficha, Aprendiz, RegistroAsistencia, AsistenciaEstado, FormatoGFPI176Item, FormatoDesercionItem } from '../types/attendance';
import { calculateAprendizSummary, getBadgeColor } from '../utils/attendanceLogic';
import { sortAprendicesByName } from '../utils/sortUtils';
import { getTodayDateString, formatDisplayDate, formatDayMonth } from '../utils/dateUtils';

interface DailyAttendanceModuleProps {
  fichas: Ficha[];
  selectedFichaId: string;
  setSelectedFichaId: (id: string) => void;
  aprendices: Aprendiz[];
  attendanceRecords: RegistroAsistencia[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<RegistroAsistencia[]>>;
  gfpiRecords: FormatoGFPI176Item[];
  desercionRecords: FormatoDesercionItem[];
  onTriggerEmailExhortacion: (aprendiz: Aprendiz, ficha: Ficha, minutesLate?: number) => void;
  onTriggerGFPI176: (aprendiz: Aprendiz, ficha: Ficha) => void;
  onTriggerReporteDesercion: (aprendiz: Aprendiz, ficha: Ficha) => void;
  onGoToUpload?: () => void;
}

// Pre-defined justification motives according to SENA Apprentice Regulation (Acuerdo 007 de 2012 / Reglamento del Aprendiz)
const SENA_JUSTIFICATION_MOTIVES = [
  'Incapacidad médica (EPS / IPS certificada)',
  'Cita médica prioritaria / especializada programada',
  'Calamidad doméstica comprobada',
  'Diligencia judicial o citación oficial obligatoria',
  'Fuerza mayor o caso fortuito demostrado',
  'Participación en eventos institucionales o deportivos SENA',
  'Otro motivo de fuerza mayor reglamentario'
];

export const DailyAttendanceModule: React.FC<DailyAttendanceModuleProps> = ({
  fichas,
  selectedFichaId,
  setSelectedFichaId,
  aprendices,
  attendanceRecords,
  setAttendanceRecords,
  gfpiRecords,
  desercionRecords,
  onTriggerEmailExhortacion,
  onTriggerGFPI176,
  onTriggerReporteDesercion,
  onGoToUpload
}) => {
  // Calendar date automatically synchronizes with today's real date upon opening
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Justification modal / quick-edit popover state
  const [justifyingAprendizId, setJustifyingAprendizId] = useState<string | null>(null);

  const currentFicha = fichas.find(f => f.id === selectedFichaId) || fichas[0];
  const fichaAprendices = useMemo(() => {
    const list = aprendices.filter(a => a.fichaId === currentFicha?.id);
    // Organized alphabetically by name
    return sortAprendicesByName(list);
  }, [aprendices, currentFicha]);

  // Filtered apprentices by search term
  const filteredAprendices = useMemo(() => {
    return fichaAprendices.filter(a => {
      const text = `${a.nombres} ${a.apellidos} ${a.documento} ${a.estadoSena || ''}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });
  }, [fichaAprendices, searchTerm]);

  // Check if learner is in training ("En Formación")
  const isAprendizEnFormacion = (ap: Aprendiz): boolean => {
    const estado = (ap.estadoSena || '').trim().toUpperCase();
    return estado === 'EN FORMACION' || estado === 'EN FORMACIÓN' || estado === '';
  };

  // Get or initialize record for apprentice on selected date
  const getRecordForAprendiz = (aprendizId: string): RegistroAsistencia => {
    const found = attendanceRecords.find(
      r => r.fichaId === currentFicha?.id && r.aprendizId === aprendizId && r.fecha === selectedDate
    );
    if (found) return found;

    return {
      id: `att-${aprendizId}-${selectedDate}`,
      fichaId: currentFicha?.id || '',
      aprendizId,
      fecha: selectedDate,
      estado: 'P',
      horaLlegada: '07:00'
    };
  };

  /**
   * Status change handler that ensures COMPLETE SESSION PERSISTENCE:
   * When an instructor modifies any apprentice in a session, ALL active apprentices
   * in the group for that session date are guaranteed to have a recorded status (defaulting to 'P').
   * This completely prevents the bug where only absent learners had records, distorting the
   * absence percentage (e.g. 9 out of 30 was showing 90% instead of the real 30%).
   */
  const handleStatusChange = (aprendiz: Aprendiz, nuevoEstado: AsistenciaEstado) => {
    if (!isAprendizEnFormacion(aprendiz)) {
      alert(`No se puede modificar la asistencia de ${aprendiz.nombres} ${aprendiz.apellidos} porque su estado es "${aprendiz.estadoSena || 'NO DISPONIBLE'}" (Diferente a "En Formación").`);
      return;
    }

    const elegibles = fichaAprendices.filter(isAprendizEnFormacion);

    setAttendanceRecords(prev => {
      // Find all existing records for currentFicha and selectedDate
      const existingMap = new Map<string, RegistroAsistencia>();
      prev.filter(r => r.fichaId === currentFicha.id && r.fecha === selectedDate)
          .forEach(r => existingMap.set(r.aprendizId, r));

      // Build or update complete session records for all eligible learners
      const updatedSessionRecords: RegistroAsistencia[] = elegibles.map(ap => {
        const existing = existingMap.get(ap.id);
        if (ap.id === aprendiz.id) {
          const isJustificada = nuevoEstado === 'J';
          return {
            id: existing?.id || `att-${ap.id}-${selectedDate}`,
            fichaId: currentFicha.id,
            aprendizId: ap.id,
            fecha: selectedDate,
            estado: nuevoEstado,
            horaLlegada: nuevoEstado === 'R' ? (existing?.horaLlegada || '07:30') : (nuevoEstado === 'P' ? '07:00' : undefined),
            minutosRetardo: nuevoEstado === 'R' ? (existing?.minutosRetardo || 30) : undefined,
            justificado: isJustificada,
            motivoJustificacion: isJustificada 
              ? (existing?.motivoJustificacion || SENA_JUSTIFICATION_MOTIVES[0]) 
              : undefined,
            soporteEvidencia: existing?.soporteEvidencia,
            observacion: isJustificada 
              ? (existing?.observacion || 'Inasistencia justificada según reglamento del aprendiz (Art. 22)')
              : existing?.observacion
          };
        }
        if (existing) {
          return existing;
        }
        // Not modified yet: default to 'P' (Presente)
        return {
          id: `att-${ap.id}-${selectedDate}`,
          fichaId: currentFicha.id,
          aprendizId: ap.id,
          fecha: selectedDate,
          estado: 'P',
          horaLlegada: '07:00'
        };
      });

      // Keep records for other fichas or other dates
      const others = prev.filter(
        r => !(r.fichaId === currentFicha.id && r.fecha === selectedDate)
      );

      return [...others, ...updatedSessionRecords];
    });

    // If changing to 'J', prompt or open justification details
    if (nuevoEstado === 'J') {
      setJustifyingAprendizId(aprendiz.id);
    } else if (justifyingAprendizId === aprendiz.id) {
      setJustifyingAprendizId(null);
    }
  };

  const handleUpdateRecordField = (aprendizId: string, fields: Partial<RegistroAsistencia>) => {
    const elegibles = fichaAprendices.filter(isAprendizEnFormacion);

    setAttendanceRecords(prev => {
      const existingMap = new Map<string, RegistroAsistencia>();
      prev.filter(r => r.fichaId === currentFicha.id && r.fecha === selectedDate)
          .forEach(r => existingMap.set(r.aprendizId, r));

      const updatedSessionRecords: RegistroAsistencia[] = elegibles.map(ap => {
        const existing = existingMap.get(ap.id);
        if (ap.id === aprendizId) {
          return {
            id: existing?.id || `att-${ap.id}-${selectedDate}`,
            fichaId: currentFicha.id,
            aprendizId: ap.id,
            fecha: selectedDate,
            estado: existing?.estado || 'P',
            ...existing,
            ...fields
          };
        }
        if (existing) {
          return existing;
        }
        return {
          id: `att-${ap.id}-${selectedDate}`,
          fichaId: currentFicha.id,
          aprendizId: ap.id,
          fecha: selectedDate,
          estado: 'P',
          horaLlegada: '07:00'
        };
      });

      const others = prev.filter(
        r => !(r.fichaId === currentFicha.id && r.fecha === selectedDate)
      );

      return [...others, ...updatedSessionRecords];
    });
  };

  const handleMarkAll = (estado: AsistenciaEstado) => {
    const elegibles = fichaAprendices.filter(isAprendizEnFormacion);
    const countOmitidos = fichaAprendices.length - elegibles.length;

    setAttendanceRecords(prev => {
      const others = prev.filter(
        r => !(r.fichaId === currentFicha.id && r.fecha === selectedDate)
      );

      const batch: RegistroAsistencia[] = elegibles.map(ap => ({
        id: `att-${ap.id}-${selectedDate}`,
        fichaId: currentFicha.id,
        aprendizId: ap.id,
        fecha: selectedDate,
        estado,
        horaLlegada: estado === 'P' ? '07:00' : (estado === 'R' ? '07:30' : undefined),
        minutosRetardo: estado === 'R' ? 30 : undefined,
        justificado: estado === 'J',
        motivoJustificacion: estado === 'J' ? SENA_JUSTIFICATION_MOTIVES[0] : undefined,
        observacion: estado === 'P' 
          ? 'Asistencia regular registrada en bloque' 
          : (estado === 'J' ? 'Inasistencia justificada en bloque' : undefined)
      }));

      return [...others, ...batch];
    });

    if (countOmitidos > 0) {
      alert(`Se marcaron ${elegibles.length} aprendices en estado "En Formación". Se omitieron ${countOmitidos} aprendiz(ces) con estado diferente (bloqueados).`);
    }
  };

  // Day navigation with real date manipulation
  const shiftDay = (days: number) => {
    try {
      const parts = selectedDate.split('-');
      const cur = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      cur.setDate(cur.getDate() + days);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${d}`);
    } catch (e) {
      // Fallback
    }
  };

  // Compute daily metrics for active learners only
  const activeLearners = fichaAprendices.filter(isAprendizEnFormacion);
  const dailyRecords = activeLearners.map(a => getRecordForAprendiz(a.id));
  const countP = dailyRecords.filter(r => r.estado === 'P').length;
  const countR = dailyRecords.filter(r => r.estado === 'R').length;
  const countNA = dailyRecords.filter(r => r.estado === 'NA').length;
  const countJ = dailyRecords.filter(r => r.estado === 'J').length;
  const total = activeLearners.length;
  
  // Real percentage calculations:
  // - Effective attendance (Presentes + Retardos + Justificadas excusadas)
  // - Inasistencia Injustificada: EXACT proportion of absent learners (e.g. 9/30 = 30%)
  const percentAttendance = total > 0 ? Math.round(((countP + countR + countJ) / total) * 100) : 0;
  const percentInasistencia = total > 0 ? Math.round((countNA / total) * 100) : 0;
  const percentJustificadas = total > 0 ? Math.round((countJ / total) * 100) : 0;
  const countBloqueados = fichaAprendices.length - activeLearners.length;

  // Print Daily Attendance Sheet
  const handlePrintDailySheet = () => {
    window.print();
  };

  // Export Daily Attendance Sheet to Excel
  const handleExportDailyExcel = () => {
    const rows: any[][] = [
      ['SERVICIO NACIONAL DE APRENDIZAJE - SENA'],
      ['Centro de Comercio, Industria y Turismo (CCIT) — Regional Córdoba'],
      ['PLANILLA DIARIA DE ASISTENCIA EN EL AMBIENTE DE FORMACIÓN'],
      ['Ficha de Caracterización:', `${currentFicha.codigo} - ${currentFicha.programa}`],
      ['Jornada / Horario:', `${currentFicha.jornada} (${currentFicha.horario})`],
      ['Fecha de la Sesión:', selectedDate],
      ['Instructor Responsable:', currentFicha.instructorLider || 'Elvis Serpa Hernández'],
      ['Resumen del Día:', `Total Aprendices: ${total} | Presentes (P): ${countP} | Retardos (R): ${countR} | Inasistencias Injustificadas (NA): ${countNA} (${percentInasistencia}%) | Justificadas (J): ${countJ} (${percentJustificadas}%) | Asistencia Global: ${percentAttendance}%`],
      [],
      [
        'No.',
        'Tipo Doc',
        'Número Documento',
        'Aprendiz (Nombres y Apellidos)',
        'Estado Marcación',
        'Hora Llegada',
        'Minutos Retardo',
        'Motivo Justificación (Art. 22)',
        'Soporte / Radicado',
        'Observación de Asistencia',
        'Estado SofiaPlus'
      ]
    ];

    fichaAprendices.forEach((ap, idx) => {
      const rec = getRecordForAprendiz(ap.id);
      let estadoTxt = 'PRESENTE (P)';
      if (rec.estado === 'R') estadoTxt = 'RETARDO (R)';
      else if (rec.estado === 'NA') estadoTxt = 'INASISTENCIA INJUSTIFICADA (NA)';
      else if (rec.estado === 'J') estadoTxt = 'INASISTENCIA JUSTIFICADA (J)';

      rows.push([
        idx + 1,
        ap.tipoDocumento,
        ap.documento,
        `${ap.nombres} ${ap.apellidos}`,
        estadoTxt,
        rec.horaLlegada || '-',
        rec.minutosRetardo || 0,
        rec.motivoJustificacion || '-',
        rec.soporteEvidencia || '-',
        rec.observacion || '-',
        ap.estadoSena || 'EN FORMACION'
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 10 },
      { wch: 18 },
      { wch: 36 },
      { wch: 25 },
      { wch: 12 },
      { wch: 14 },
      { wch: 30 },
      { wch: 25 },
      { wch: 35 },
      { wch: 18 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Asistencia_${selectedDate}`);
    XLSX.writeFile(workbook, `Planilla_Asistencia_Ficha_${currentFicha.codigo}_${selectedDate}.xlsx`);
  };

  // Clear day's attendance records for this ficha
  const handleClearDayAttendance = () => {
    const recordsToday = attendanceRecords.filter(r => r.fichaId === currentFicha.id && r.fecha === selectedDate);
    if (recordsToday.length === 0) {
      alert(`No hay registros de asistencia marcados para el día ${selectedDate} en esta ficha.`);
      return;
    }

    if (confirm(`¿Está seguro de borrar todas las marcaciones de asistencia (${recordsToday.length} registros) del día ${selectedDate} para la ficha ${currentFicha.codigo}?`)) {
      setAttendanceRecords(prev => prev.filter(r => !(r.fichaId === currentFicha.id && r.fecha === selectedDate)));
    }
  };

  // Ensure full session is explicitly confirmed and saved for all 30 learners
  const handleConfirmFullSession = () => {
    const elegibles = fichaAprendices.filter(isAprendizEnFormacion);
    setAttendanceRecords(prev => {
      const existingMap = new Map<string, RegistroAsistencia>();
      prev.filter(r => r.fichaId === currentFicha.id && r.fecha === selectedDate)
          .forEach(r => existingMap.set(r.aprendizId, r));

      const updatedSessionRecords: RegistroAsistencia[] = elegibles.map(ap => {
        const existing = existingMap.get(ap.id);
        if (existing) return existing;
        return {
          id: `att-${ap.id}-${selectedDate}`,
          fichaId: currentFicha.id,
          aprendizId: ap.id,
          fecha: selectedDate,
          estado: 'P',
          horaLlegada: '07:00'
        };
      });

      const others = prev.filter(
        r => !(r.fichaId === currentFicha.id && r.fecha === selectedDate)
      );

      return [...others, ...updatedSessionRecords];
    });

    alert(`Sesión del día ${formatDisplayDate(selectedDate)} guardada exitosamente con los ${elegibles.length} aprendices activos.`);
  };

  return (
    <div className="space-y-6">
      {/* Print-only Header for Daily Attendance Sheet */}
      <div className="hidden print:block mb-4 p-4 border-b-2 border-[#00324D] text-[#00324D]">
        <h1 className="text-xl font-bold">SERVICIO NACIONAL DE APRENDIZAJE - SENA</h1>
        <h2 className="text-sm font-semibold">Planilla Oficial de Asistencia Diaria • Ficha {currentFicha.codigo}</h2>
        <p className="text-xs text-slate-600">Fecha: {selectedDate} • Jornada: {currentFicha.jornada} • Instructor: {currentFicha.instructorLider}</p>
      </div>

      {/* Top Banner & Date Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/70 text-[#2e8800] dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-emerald-200 dark:border-emerald-800">
              <span>Módulo 2</span>
              <span>•</span>
              <span>Toma de Asistencia en el Ambiente de Formación</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Registro del Estado del Aprendiz Día por Día
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Listados en orden <strong className="text-slate-700 dark:text-slate-200">alfabético por nombre</strong> con control de inasistencias injustificadas, justificaciones reglamentarias (Art. 22) y bloqueo para estados no activos.
            </p>
          </div>

          {/* Ficha & Date Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Ficha Selector */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedFichaId}
                onChange={e => setSelectedFichaId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#39A900]"
              >
                {fichas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.codigo} — {f.programa}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Navigator Sincronizado con Calendario */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => shiftDay(-1)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Día anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-3">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => shiftDay(1)}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Día siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sincronización Automática con la Fecha Actual */}
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedDate === getTodayDateString()
                  ? 'bg-[#39A900] text-white shadow-xs'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-[#2e8800] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
              title="Sincronizar con el calendario y volver al día de hoy"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Hoy ({formatDayMonth(getTodayDateString())})</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Bar for Selected Day - 5 Tarjetas Precisas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* 1. Presentes */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Presentes (P)</span>
              <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">{countP} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">activos</span></div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              P
            </div>
          </div>

          {/* 2. Retardos */}
          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Retardos (R)</span>
              <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200">{countR} <span className="text-xs font-normal text-amber-700 dark:text-amber-400">activos</span></div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              R
            </div>
          </div>

          {/* 3. Inasistencias Injustificadas (NA) */}
          <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Injustificadas (NA)</span>
              <div className="text-xl font-extrabold text-rose-900 dark:text-rose-200">
                {countNA} <span className="text-xs font-bold text-rose-700 dark:text-rose-400">({percentInasistencia}%)</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              NA
            </div>
          </div>

          {/* 4. Inasistencias Justificadas (J) - Reglamento Art. 22 */}
          <div className="bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">Justificadas (J)</span>
              <div className="text-xl font-extrabold text-sky-900 dark:text-sky-200">
                {countJ} <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">({percentJustificadas}%)</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs" title="Inasistencias con excusa médica o soporte debidamente presentado">
              J
            </div>
          </div>

          {/* 5. Tasa de Asistencia Global & Total Cohorte */}
          <div className="bg-[#00324D] dark:bg-slate-950 text-white rounded-xl p-3 flex items-center justify-between border border-slate-700/60 shadow-xs col-span-2 sm:col-span-1">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Asistencia Global</span>
              <div className="text-xl font-extrabold">{percentAttendance}%</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-300 block">En Formación / Ficha</span>
              <span className="text-xs font-bold text-slate-100">{total} / {fichaAprendices.length}</span>
              {countBloqueados > 0 && (
                <span className="text-[10px] text-amber-300 block font-semibold">({countBloqueados} bloqueados)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40 print:hidden">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre (orden A-Z), documento o estado..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 pl-9 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#39A900]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Borrar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions & Printing / Export / Clear Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDailySheet}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title="Imprimir la planilla de asistencia de este día"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleExportDailyExcel}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              title="Exportar planilla de asistencia de este día a Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={handleClearDayAttendance}
              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/80 transition cursor-pointer"
              title="Borrar las marcaciones registradas para el día de hoy en esta ficha"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Borrar Hoy</span>
            </button>

            <span className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:inline"></span>

            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">En bloque:</span>
            <button
              onClick={() => handleMarkAll('P')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Marcar a todos los aprendices en formación como Presentes (P)"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar Elegibles P</span>
            </button>
            <button
              onClick={() => handleMarkAll('NA')}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Marcar todos como NA"
            >
              Marcar NA
            </button>

            <button
              onClick={handleConfirmFullSession}
              className="px-3 py-1.5 rounded-lg bg-[#00324D] hover:bg-[#002438] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Asegurar y guardar la lista completa de asistencia para este día"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guardar Sesión</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#00324D] dark:bg-slate-950 text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4 min-w-[220px]">Aprendiz (Orden A-Z por Nombre)</th>
                <th className="py-3 px-4 text-center min-w-[240px]">Marcación Asistencia</th>
                <th className="py-3 px-4 min-w-[230px]">Detalle / Justificación / Soporte</th>
                <th className="py-3 px-4 min-w-[190px]">Diagnóstico & Racha</th>
                <th className="py-3 px-4 text-right min-w-[230px]">Acción Reglamentaria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAprendices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto text-slate-500 dark:text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <CalendarCheck className="w-6 h-6 stroke-1 text-[#39A900]" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          No hay aprendices registrados en la ficha {currentFicha?.codigo}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Cargue el listado oficial desde Excel o SOFIA Plus para iniciar el control de asistencia diario.
                        </p>
                      </div>
                      {onGoToUpload && (
                        <button
                          type="button"
                          onClick={onGoToUpload}
                          className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#39A900] hover:bg-[#2e8800] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Cargar Aprendices en Módulo 1</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAprendices.map((aprendiz, idx) => {
                  const enFormacion = isAprendizEnFormacion(aprendiz);
                  const record = getRecordForAprendiz(aprendiz.id);
                  const summary = calculateAprendizSummary(
                    aprendiz,
                    currentFicha,
                    attendanceRecords,
                    gfpiRecords,
                    desercionRecords
                  );
                  const badge = getBadgeColor(summary.estadoCalculado);
                  const isJustifyingThisOne = justifyingAprendizId === aprendiz.id;

                  return (
                    <tr 
                      key={aprendiz.id} 
                      className={`transition ${
                        !enFormacion 
                          ? 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400' 
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* No. */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Name & ID (Sorted by Nombre) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {!enFormacion && (
                            <span title="Aprendiz bloqueado por estado no activo">
                              <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {aprendiz.nombres} {aprendiz.apellidos}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>{aprendiz.tipoDocumento} {aprendiz.documento}</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                enFormacion 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}>
                                {aprendiz.estadoSena || 'EN FORMACION'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* State Button Toggle Group: P, R, NA, J */}
                      <td className="py-3 px-4 text-center">
                        {!enFormacion ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold" title="Bloqueado: Aprendiz en estado diferente a 'En Formación'">
                            <Lock className="w-3.5 h-3.5 text-rose-600" />
                            <span>Bloqueado ({aprendiz.estadoSena})</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 border border-slate-200 dark:border-slate-700 max-w-[245px] mx-auto">
                            {/* P - Presente */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(aprendiz, 'P')}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                                record.estado === 'P'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title="Presente en formación"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>P</span>
                            </button>

                            {/* R - Retardo */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(aprendiz, 'R')}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                                record.estado === 'R'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              }`}
                              title="Retardo a la sesión formativa"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>R</span>
                            </button>

                            {/* NA - No Asistió (Injustificada) */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(aprendiz, 'NA')}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                                record.estado === 'NA'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                              title="Inasistencia injustificada (activa protocolo GFPI-176 o deserción si es reiterada)"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>NA</span>
                            </button>

                            {/* J - Inasistencia Justificada (Reglamento Art. 22 - Incapacidad / Excusa) */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(aprendiz, 'J')}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                                record.estado === 'J'
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                              }`}
                              title="Inasistencia con justificación (Incapacidad médica EPS, calamidad, etc. No configura deserción bajo Art. 22 del Reglamento)"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>J</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Details / Justification Reason / Support / Observation */}
                      <td className="py-3 px-4 space-y-1.5">
                        {!enFormacion ? (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 italic block">
                            Registro de asistencia inhabilitado
                          </span>
                        ) : (
                          <>
                            {/* If state is Retardo (R) */}
                            {record.estado === 'R' && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Llegó a:</span>
                                <input
                                  type="time"
                                  value={record.horaLlegada || '07:30'}
                                  onChange={e => handleUpdateRecordField(aprendiz.id, { horaLlegada: e.target.value })}
                                  className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs rounded px-1.5 py-0.5 font-mono"
                                />
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                                  ({record.minutosRetardo || 30}m)
                                </span>
                              </div>
                            )}

                            {/* If state is Justificada (J) */}
                            {record.estado === 'J' && (
                              <div className="space-y-1 bg-sky-50/80 dark:bg-sky-950/40 p-2 rounded-xl border border-sky-200 dark:border-sky-800/80">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                    Justificación (Art. 22):
                                  </span>
                                  <span className="text-[9px] text-sky-600 dark:text-sky-400 font-medium">
                                    Válida SENA
                                  </span>
                                </div>

                                <select
                                  value={record.motivoJustificacion || SENA_JUSTIFICATION_MOTIVES[0]}
                                  onChange={e => handleUpdateRecordField(aprendiz.id, { 
                                    motivoJustificacion: e.target.value,
                                    justificado: true 
                                  })}
                                  className="w-full text-[11px] bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 rounded px-1.5 py-0.5 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                                >
                                  {SENA_JUSTIFICATION_MOTIVES.map((motivo, mIdx) => (
                                    <option key={mIdx} value={motivo}>{motivo}</option>
                                  ))}
                                </select>

                                <input
                                  type="text"
                                  placeholder="No. Radicado / Soporte (ej. Incapacidad EPS Sura #4921)..."
                                  value={record.soporteEvidencia || ''}
                                  onChange={e => handleUpdateRecordField(aprendiz.id, { soporteEvidencia: e.target.value })}
                                  className="w-full text-[10px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-sky-300 dark:border-sky-700 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                                />
                              </div>
                            )}

                            {/* Observation input */}
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Observación..."
                                value={record.observacion || ''}
                                onChange={e => handleUpdateRecordField(aprendiz.id, { observacion: e.target.value })}
                                className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-[#39A900]"
                              />
                            </div>
                          </>
                        )}
                      </td>

                      {/* Diagnostic & Streak */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Asistencia: {summary.tasaAsistencia}%
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              ({summary.totalAsistencias}P / {summary.totalRetardos}R / {summary.totalInasistencias}NA{summary.totalInasistenciasJustificadas > 0 ? ` / ${summary.totalInasistenciasJustificadas}J` : ''})
                            </span>
                          </div>

                          {/* Consecutive unjustified absences indicator */}
                          {summary.inasistenciasConsecutivas > 0 && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              <span>{summary.inasistenciasConsecutivas} inasistencia(s) injustificada(s) consecutiva(s)</span>
                            </div>
                          )}

                          {/* Justified absences indicator */}
                          {summary.totalInasistenciasJustificadas > 0 && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                              <ShieldCheck className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                              <span>{summary.totalInasistenciasJustificadas} inasistencia(s) justificada(s) (Art. 22)</span>
                            </div>
                          )}

                          {summary.inasistenciasConsecutivas === 0 && summary.totalRetardos > 0 && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              <span>{summary.totalRetardos} retardo(s) acumulados</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Prescribed Action per handwritten flowchart */}
                      <td className="py-3 px-4 text-right">
                        {!enFormacion ? (
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-end gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Novedad {aprendiz.estadoSena}</span>
                          </span>
                        ) : (
                          <>
                            {summary.estadoCalculado === 'NORMAL' && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Guardar dato para analítica</span>
                              </div>
                            )}

                            {summary.estadoCalculado === 'JUSTIFICADA' && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold" title="Inasistencia justificada reglamentariamente con soporte, no computa causal de deserción">
                                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Excusa soportada (Reglamento)</span>
                              </div>
                            )}

                            {summary.estadoCalculado === 'RETARDO' && (
                              <button
                                onClick={() => onTriggerEmailExhortacion(aprendiz, currentFicha, record.minutosRetardo || 30)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                                title="Enviar correo cercano y formal invitando al diálogo"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Diálogo por Retardo (Outlook)</span>
                              </button>
                            )}

                            {summary.estadoCalculado === 'ALERTA_PREVENTIVA_1_2' && (
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  onClick={() => onTriggerGFPI176(aprendiz, currentFicha)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                                  title="Diligenciar Formato GFPI-F-176 de prevención de deserción"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>Diligenciar GFPI-F-176</span>
                                </button>
                                <span className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">
                                  1ª o 2ª inasistencia injustificada
                                </span>
                              </div>
                            )}

                            {summary.estadoCalculado === 'DESERCION_3_MAS' && (
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  onClick={() => onTriggerReporteDesercion(aprendiz, currentFicha)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition animate-pulse cursor-pointer"
                                  title="Diligenciar Formato Reporte Deserción Grupal (Art. 30)"
                                >
                                  <FileWarning className="w-3.5 h-3.5" />
                                  <span>Reporte Deserción Grupal</span>
                                </button>
                                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">
                                  ≥3 inasistencias injustificadas (Art. 30)
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar with institutional guidance */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Reglamento del Aprendiz SENA:</strong> La inasistencia justificada (J) soportada con excusa médica o incapacidad NO configura causal de deserción (Art. 22). Solo las inasistencias injustificadas (NA) activan la ruta GFPI-PR-001 y el Reporte de Deserción Art. 30.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> P = Presente
            </span>
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> R = Retardo
            </span>
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> NA = Injustificada
            </span>
            <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span> J = Justificada (Excusa)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
