import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AttendanceUploadModule } from './components/AttendanceUploadModule';
import { DailyAttendanceModule } from './components/DailyAttendanceModule';
import { ProcessManagementModule } from './components/ProcessManagementModule';
import { AnalyticsDashboardModule } from './components/AnalyticsDashboardModule';
import { DiagramModal } from './components/DiagramModal';
import { NormativeJsonModal } from './components/NormativeJsonModal';
import { DatabaseModal } from './components/DatabaseModal';
import { SenaDatabase, InstructorConfig, defaultInstructorConfig } from './db/senaDatabase';
import { Ficha, Aprendiz, RegistroAsistencia, FormatoGFPI176Item, FormatoDesercionItem, EmailLog } from './types/attendance';
import { calculateAprendizSummary } from './utils/attendanceLogic';
import { sortAprendicesByName } from './utils/sortUtils';

export default function App() {
  // Start on Module 1 (Listado y Carga) if no learners yet, or Module 2 if learners exist
  const [activeModule, setActiveModule] = useState<number>(() => {
    const current = SenaDatabase.getAprendices();
    return current.length > 0 ? 2 : 1;
  });

  // Persistent state loaded from SenaDatabase
  const [fichas, setFichas] = useState<Ficha[]>(() => SenaDatabase.getFichas());
  const [selectedFichaId, setSelectedFichaId] = useState<string>(() => {
    const list = SenaDatabase.getFichas();
    return list[0]?.id || 'f-3534716';
  });
  const [aprendices, setAprendices] = useState<Aprendiz[]>(() => sortAprendicesByName(SenaDatabase.getAprendices()));
  const [attendanceRecords, setAttendanceRecords] = useState<RegistroAsistencia[]>(() => SenaDatabase.getAsistencias());
  const [gfpiRecords, setGfpiRecords] = useState<FormatoGFPI176Item[]>(() => SenaDatabase.getGfpiRecords());
  const [desercionRecords, setDesercionRecords] = useState<FormatoDesercionItem[]>(() => SenaDatabase.getDesercionRecords());
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => SenaDatabase.getEmailLogs());
  const [instructorConfig, setInstructorConfig] = useState<InstructorConfig>(() => SenaDatabase.getInstructorConfig());

  // Auto-save changes to persistent SenaDatabase
  useEffect(() => {
    SenaDatabase.saveFichas(fichas);
  }, [fichas]);

  useEffect(() => {
    SenaDatabase.saveAprendices(aprendices);
  }, [aprendices]);

  useEffect(() => {
    SenaDatabase.saveAsistencias(attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    SenaDatabase.saveGfpiRecords(gfpiRecords);
  }, [gfpiRecords]);

  useEffect(() => {
    SenaDatabase.saveDesercionRecords(desercionRecords);
  }, [desercionRecords]);

  useEffect(() => {
    SenaDatabase.saveEmailLogs(emailLogs);
  }, [emailLogs]);

  useEffect(() => {
    SenaDatabase.saveInstructorConfig(instructorConfig);
  }, [instructorConfig]);

  // Modals state
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Cross-module action transition states
  const [module3SubTab, setModule3SubTab] = useState<'gfpi176' | 'reporte' | 'emails'>('gfpi176');
  const [targetAprendizForAction, setTargetAprendizForAction] = useState<Aprendiz | null>(null);

  // Dark mode & Blur effect state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sena_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isBlurring, setIsBlurring] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsBlurring(true);
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sena_theme', nextMode ? 'dark' : 'light');
      if (nextMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setTimeout(() => {
      setIsBlurring(false);
    }, 450);
  };

  // Dynamic alert counters
  const currentFicha = fichas.find(f => f.id === selectedFichaId) || fichas[0];
  const summaries = aprendices
    .filter(a => a.fichaId === currentFicha?.id)
    .map(a => calculateAprendizSummary(a, currentFicha, attendanceRecords, gfpiRecords, desercionRecords));

  const alertaCount = summaries.filter(s => s.estadoCalculado === 'ALERTA_PREVENTIVA_1_2').length;
  const desercionCount = summaries.filter(s => s.estadoCalculado === 'DESERCION_3_MAS').length;

  const handleDataReload = () => {
    const freshFichas = SenaDatabase.getFichas();
    const freshAprendices = sortAprendicesByName(SenaDatabase.getAprendices());
    setFichas(freshFichas);
    setAprendices(freshAprendices);
    setAttendanceRecords(SenaDatabase.getAsistencias());
    setGfpiRecords(SenaDatabase.getGfpiRecords());
    setDesercionRecords(SenaDatabase.getDesercionRecords());
    setEmailLogs(SenaDatabase.getEmailLogs());
    setInstructorConfig(SenaDatabase.getInstructorConfig());
    if (freshFichas.length > 0) {
      setSelectedFichaId(freshFichas[0].id);
    }
  };

  const handleResetSampleData = () => {
    if (confirm('¿Desea limpiar todos los datos de aprendices y dejar el prototipo listo para su propia ejecución?')) {
      SenaDatabase.resetDatabase();
      handleDataReload();
      setActiveModule(1);
    }
  };

  // Triggers from Module 2 (Daily Attendance)
  const handleTriggerEmailExhortacion = (aprendiz: Aprendiz, ficha: Ficha) => {
    setSelectedFichaId(ficha.id);
    setTargetAprendizForAction(aprendiz);
    setModule3SubTab('emails');
    setActiveModule(3);
  };

  const handleTriggerGFPI176 = (aprendiz: Aprendiz, ficha: Ficha) => {
    setSelectedFichaId(ficha.id);
    setTargetAprendizForAction(aprendiz);
    setModule3SubTab('gfpi176');
    setActiveModule(3);
  };

  const handleTriggerReporteDesercion = (aprendiz: Aprendiz, ficha: Ficha) => {
    setSelectedFichaId(ficha.id);
    setTargetAprendizForAction(aprendiz);
    setModule3SubTab('reporte');
    setActiveModule(3);
  };

  const handleNavigateToProcessFromDashboard = (subtab: 'gfpi176' | 'reporte' | 'emails', targetAp?: Aprendiz) => {
    if (targetAp) {
      setSelectedFichaId(targetAp.fichaId);
      setTargetAprendizForAction(targetAp);
    }
    setModule3SubTab(subtab);
    setActiveModule(3);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-300 ${isBlurring ? 'mode-blur-active' : 'mode-blur-idle'}`}>
      {/* Fullscreen Blur Transition Overlay when theme changes */}
      {isBlurring && (
        <div 
          className="fixed inset-0 z-50 pointer-events-none animate-blur-flash bg-slate-900/10 dark:bg-slate-950/20"
          aria-hidden="true"
        />
      )}

      {/* Navigation Header */}
      <Navbar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        openDiagramModal={() => setIsDiagramModalOpen(true)}
        openJsonModal={() => setIsJsonModalOpen(true)}
        openDatabaseModal={() => setIsDatabaseModalOpen(true)}
        alertaCount={alertaCount}
        desercionCount={desercionCount}
        instructorEmail={instructorConfig.correoInstitucional}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeModule === 1 && (
          <AttendanceUploadModule
            fichas={fichas}
            selectedFichaId={selectedFichaId}
            setSelectedFichaId={setSelectedFichaId}
            aprendices={aprendices}
            setAprendices={setAprendices}
            setFichas={setFichas}
            onGoToDailyAttendance={() => setActiveModule(2)}
            onResetSampleData={handleResetSampleData}
          />
        )}

        {activeModule === 2 && (
          <DailyAttendanceModule
            fichas={fichas}
            selectedFichaId={selectedFichaId}
            setSelectedFichaId={setSelectedFichaId}
            aprendices={aprendices}
            attendanceRecords={attendanceRecords}
            setAttendanceRecords={setAttendanceRecords}
            gfpiRecords={gfpiRecords}
            desercionRecords={desercionRecords}
            onTriggerEmailExhortacion={handleTriggerEmailExhortacion}
            onTriggerGFPI176={handleTriggerGFPI176}
            onTriggerReporteDesercion={handleTriggerReporteDesercion}
            onGoToUpload={() => setActiveModule(1)}
          />
        )}

        {activeModule === 3 && (
          <ProcessManagementModule
            fichas={fichas}
            selectedFichaId={selectedFichaId}
            setSelectedFichaId={setSelectedFichaId}
            aprendices={aprendices}
            gfpiRecords={gfpiRecords}
            setGfpiRecords={setGfpiRecords}
            desercionRecords={desercionRecords}
            setDesercionRecords={setDesercionRecords}
            emailLogs={emailLogs}
            setEmailLogs={setEmailLogs}
            initialSubTab={module3SubTab}
            targetAprendizForAction={targetAprendizForAction}
            instructorConfig={instructorConfig}
            setInstructorConfig={setInstructorConfig}
          />
        )}

        {activeModule === 4 && (
          <AnalyticsDashboardModule
            fichas={fichas}
            aprendices={aprendices}
            attendanceRecords={attendanceRecords}
            gfpiRecords={gfpiRecords}
            desercionRecords={desercionRecords}
            emailLogs={emailLogs}
            onNavigateToProcess={handleNavigateToProcessFromDashboard}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#39A900]">SENA</span>
            <span>•</span>
            <span>Centro de Comercio, Industria y Turismo (CCIT) — Regional Córdoba</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold cursor-pointer underline"
            >
              Base de Datos
            </button>
            <button
              onClick={() => setIsDiagramModalOpen(true)}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition underline cursor-pointer"
            >
              Diagrama de Flujo (Libreta)
            </button>
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition underline cursor-pointer"
            >
              Consultar JSONs Normativos
            </button>
            <span>Protocolo GFPI-PR-001 | Acuerdo 09 de 2024</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DiagramModal
        isOpen={isDiagramModalOpen}
        onClose={() => setIsDiagramModalOpen(false)}
        onNavigateToModule={(mod) => {
          setActiveModule(mod);
          setIsDiagramModalOpen(false);
        }}
      />

      <NormativeJsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
      />

      <DatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        fichasCount={fichas.length}
        aprendicesCount={aprendices.length}
        asistenciasCount={attendanceRecords.length}
        gfpiCount={gfpiRecords.length}
        desercionCount={desercionRecords.length}
        emailsCount={emailLogs.length}
        onDataReloadNeeded={handleDataReload}
      />
    </div>
  );
}
