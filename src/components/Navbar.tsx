import React from 'react';
import { 
  Users, 
  CalendarCheck, 
  FileText, 
  BarChart3, 
  Globe,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  activeModule: number;
  setActiveModule: (m: number) => void;
  openDiagramModal?: () => void;
  openJsonModal?: () => void;
  openDatabaseModal?: () => void;
  alertaCount: number;
  desercionCount: number;
  instructorEmail: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  setActiveModule,
  alertaCount,
  desercionCount,
  instructorEmail,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-300">
      {/* Top institution bar */}
      <div className="bg-[#00324D] dark:bg-slate-950 text-white text-xs px-4 py-1.5 flex justify-between items-center transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wide text-emerald-400">SENA</span>
          <span className="text-slate-300">|</span>
          <span className="hidden sm:inline text-slate-200">
            Dirección de Formación Profesional - Protocolo GFPI-PR-001 & Acuerdo 09 de 2024
          </span>
          <span className="sm:hidden text-slate-200">Ruta de Deserción SENA</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-blue-200 bg-blue-900/60 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-blue-700/50 dark:border-slate-700">
            <Globe className="w-3 h-3 text-blue-300" />
            <span>Outlook SENA: {instructorEmail}</span>
          </div>

          {/* Interactive Light/Dark Mode toggle button with Blur Effect */}
          <button
            onClick={onToggleDarkMode}
            type="button"
            aria-label={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            title={isDarkMode ? "Modo Oscuro activado (Clic para cambiar a Claro con efecto Blur)" : "Modo Claro activado (Clic para cambiar a Oscuro con efecto Blur)"}
            className={`group relative flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-300 select-none shadow-sm backdrop-blur-md border ${
              isDarkMode
                ? 'bg-slate-800/90 text-amber-300 border-slate-700 hover:bg-slate-700/90 hover:border-amber-400/50 hover:shadow-amber-500/10 hover:shadow-md'
                : 'bg-white/15 text-white border-white/20 hover:bg-white/25 hover:border-white/40 hover:shadow-md'
            } active:scale-95`}
          >
            {/* Visual Icon with rotation / switch effect */}
            <div className={`p-1 rounded-full transition-transform duration-500 flex items-center justify-center ${
              isDarkMode ? 'bg-amber-400/20 text-amber-300 rotate-180' : 'bg-amber-400 text-amber-950 rotate-0'
            }`}>
              {isDarkMode ? (
                <Moon className="w-3.5 h-3.5 transition-transform duration-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 transition-transform duration-300" />
              )}
            </div>

            <span className="font-medium tracking-tight">
              {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
            </span>

            {/* Subtle glow / badge indicator */}
            <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-300 shadow-[0_0_8px_#fcd34d]'
            }`} />
          </button>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2">
        <div className="flex items-center gap-3">
          {/* Official SENA style logo mark */}
          <div className="w-[70px] h-[70px] rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
            <img 
              src="data:image/svg+xml,%3c?xml%20version=%271.0%27%20encoding=%27utf-8%27?%3e%3c!--%20Generator:%20Adobe%20Illustrator%2026.0.1,%20SVG%20Export%20Plug-In%20.%20SVG%20Version:%206.00%20Build%200)%20--%3e%3csvg%20version=%271.1%27%20id=%27Capa_1%27%20xmlns=%27http://www.w3.org/2000/svg%27%20xmlns:xlink=%27http://www.w3.org/1999/xlink%27%20x=%270px%27%20y=%270px%27%20viewBox=%270%200%201000%201000%27%20style=%27enable-background:new%200%200%201000%201000;%27%20xml:space=%27preserve%27%3e%3cstyle%20type=%27text/css%27%3e%20.st0{fill:%2339a900;}%20%3c/style%3e%3cpath%20id=%27path47-5%27%20class=%27st0%27%20d=%27M504.2,20.5c-58.3,0.1-105.6,47.4-105.5,105.8c0.1,58.3,47.4,105.6,105.7,105.6%20c58.3,0,105.6-47.3,105.6-105.7V126C609.9,67.6,562.6,20.4,504.2,20.5z%20M155.6,264.6c-18.6,0.1-37.5,1.1-55.2,5.6%20c-11.7,3-23,7.8-30.3,15.4c-9.2,9.5-10.4,22.3-5.9,33.3c4,9.7,14.8,16.9,26.8,21.1c25.9,8.9,54.6,10.7,81.8,16.3%20c5,1.2,10.6,2.6,13.7,6c3.2,4.1,1.3,9.7-4,12.2c-8.8,4.5-20.1,4.5-30.4,4.4c-9.4-0.4-19.7-1.2-27.2-5.9c-5.5-3.4-6.5-9.1-5.2-14.1%20l-60.6,0c-0.2,9.2,1.6,18.9,8.4,26.8c5.6,6.8,14.8,11.5,24.6,14.4c15.7,4.6,32.7,6,49.4,6.4c22.7,0.4,45.8-0.3,67.6-5.4%20c13-3.2,25.8-8.3,34.1-16.6c14.8-14.8,11.3-38.3-8.3-49.8c-9.8-5.7-21.5-9.2-33.4-11.5c-17.5-3.6-35.3-6.3-52.9-9.2%20c-6.2-1.2-12.8-2.3-18-5.2c-5.5-2.9-5.9-9.8-0.3-12.9c7.2-4.1,16.8-4,25.4-4c9.1,0.2,19,0.7,26.5,5c4.2,2.3,5.9,6.3,5.9,10.1%20l57.6-0.1c-0.2-7.3-1.6-14.9-6.9-21.2c-6.2-7.8-17.1-12.7-28.3-15.5C192.8,265.6,174.1,264.7,155.6,264.6L155.6,264.6z%20M280.6,268.9%20l0,137.7l168.1,0l0-30H342.3v-26.7h94.9v-29.3h-94.9l0-21.9l102.6,0l-0.1-29.7L280.6,268.9z%20M557.5,269c0,0-51.9,0-77.9,0l0,137.7%20l59,0l0-92.7l80.8,92.6l81,0.1l0-137.7l-59.1,0l0.1,92L557.5,269z%20M805.6,269.2c0,0-63.6,91.9-95.6,137.7l61.9,0l14.9-24.8h95.7%20l13.9,24.9l68.8,0L874,269.2L805.6,269.2z%20M836.6,302.1l29.4,49.9l-60.7,0.1L836.6,302.1z%20M10.6,445.6l0.5,75l280.1-1%20c14.3,3.1,22.6,12.4,19.7,33.5L138.6,854.7l56.1,52.5l266.9-461.6L10.6,445.6z%20M545.2,446.2l262.4,459.6l58-52.1L691.3,552.9%20c-2.9-21.2,5.4-30.6,19.7-33.7l280.2,1l-0.1-73.7L545.2,446.2z%20M500.9,522.3L254.8,944.7l65.4,31.9L484.4,699%20c5.7-4.6,11.4-7.1,17.1-7.3c6-0.2,12.2,2,18.3,6.8l163.8,278.4l67.4-35.2L500.9,522.3z%27/%3e%3cg%20id=%27_x23_000000ff-2%27%20transform=%27matrix(0.31570611,0,0,0.23560774,-391.49698,-10.601126)%27%3e%3c/g%3e%3c/svg%3e" 
              alt="Logo Oficial SENA" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight tracking-tight">
                Gestor Asistencias
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 hidden sm:block">
              Automatización de Asistencia, Protocolo GFPI-PR-001 y Gestión de Deserción
            </p>
          </div>
        </div>

        {/* Modules navigation pills */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveModule(1)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeModule === 1
                ? 'bg-[#39A900] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Listado y Carga</span>
          </button>

          <button
            onClick={() => setActiveModule(2)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeModule === 2
                ? 'bg-[#39A900] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>2. Registro Diario (P/R/NA)</span>
          </button>

          <button
            onClick={() => setActiveModule(3)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition relative cursor-pointer ${
              activeModule === 3
                ? 'bg-[#39A900] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Gestión & Formatos</span>
            {(alertaCount > 0 || desercionCount > 0) && (
              <span className="flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {alertaCount + desercionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveModule(4)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeModule === 4
                ? 'bg-[#39A900] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>4. Dashboard & KPIs</span>
          </button>
        </nav>
      </div>

      {/* Critical alert banner if learners have 3+ absences */}
      {desercionCount > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900/60 px-4 py-1.5 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                <strong>Atención:</strong> Se identificaron <strong>{desercionCount} aprendiz(ces)</strong> incursos en presunta deserción (Art. 30: ≥3 días consecutivos o ≥5 no continuos).
              </span>
            </div>
            <button
              onClick={() => setActiveModule(3)}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer ml-3 shrink-0"
            >
              Gestionar Reporte Grupal &rarr;
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
