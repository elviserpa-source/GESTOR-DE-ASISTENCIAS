import React, { useState } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, FileSpreadsheet, Send, HelpCircle, Image as ImageIcon } from 'lucide-react';

interface DiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (module: number) => void;
}

export const DiagramModal: React.FC<DiagramModalProps> = ({
  isOpen,
  onClose,
  onNavigateToModule
}) => {
  const [showOriginalPhoto, setShowOriginalPhoto] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#00324D] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#39A900] flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-base">Flujo del Proceso: Asistencia & Ruta de Deserción</h3>
              <p className="text-xs text-slate-300">
                Basado en el diagrama de libreta del usuario, Protocolo GFPI-PR-001 y Acuerdo 09 de 2024
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOriginalPhoto(!showOriginalPhoto)}
              className="px-2.5 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{showOriginalPhoto ? 'Ver Diagrama Digital' : 'Ver Foto Original'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {showOriginalPhoto ? (
            <div className="bg-slate-100 p-4 rounded-xl text-center">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Fotografía del Cuaderno de Notas del Usuario (Flujo de Decisión)
              </h4>
              <div className="max-w-md mx-auto rounded-lg overflow-hidden border border-slate-300 shadow-md">
                <img
                  src="WhatsApp Image 2026-09-25 at 9.44.46 AM.jpeg"
                  alt="Diagrama de flujo del usuario en libreta"
                  className="w-full object-contain max-h-[60vh]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Process Map Diagram */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                {/* Node 1: Entry */}
                <div className="flex justify-center">
                  <div className="bg-white border-2 border-[#00324D] rounded-xl px-6 py-3 shadow-md text-center max-w-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inicio de Sesión</span>
                    <h4 className="text-base font-extrabold text-[#00324D]">Registro de Asistencia</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Instructor en el ambiente de formación</p>
                  </div>
                </div>

                {/* Vertical Connector */}
                <div className="w-0.5 h-6 bg-slate-300 mx-auto"></div>

                {/* Split 1: Asistió SÍ vs NO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  {/* Branch A: SÍ Asistió */}
                  <div className="flex flex-col items-center">
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 w-full text-center shadow-xs">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¿Aprendiz Asistió? SÍ (P)</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Aprendiz se encuentra presente en el horario convenido.
                      </p>
                      <div className="w-0.5 h-4 bg-emerald-300 mx-auto my-2"></div>
                      <div className="bg-emerald-600 text-white rounded-lg p-2.5 text-xs font-medium shadow-xs">
                        📊 <strong>Guardar dato para analítica</strong>
                        <p className="text-[11px] opacity-90 mt-0.5">Calcula porcentaje de asistencia y tasa de permanencia</p>
                      </div>
                    </div>
                  </div>

                  {/* Branch B: NO Asistió o Retardo */}
                  <div className="flex flex-col items-center">
                    <div className="bg-amber-50/70 border-2 border-amber-400 rounded-xl p-4 w-full shadow-xs">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>¿Aprendiz Asistió? NO</span>
                        </div>
                      </div>

                      {/* Sub-branch: Llegó tarde vs No llegó */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {/* Sub 1: Llegó tarde */}
                        <div className="bg-white border border-amber-300 rounded-lg p-3 text-center">
                          <span className="text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Llegó tarde (R)
                          </span>
                          <div className="w-0.5 h-3 bg-amber-300 mx-auto my-1.5"></div>
                          <div className="bg-amber-100 text-amber-900 rounded p-1.5 text-[11px] font-semibold">
                            ✉️ Enviar correo con exhortación a cumplir horario
                          </div>
                          <div className="w-0.5 h-2 bg-amber-300 mx-auto my-1"></div>
                          <span className="text-[10px] text-slate-500 block">Guardar dato para analítica</span>
                        </div>

                        {/* Sub 2: No llegó */}
                        <div className="bg-white border border-rose-300 rounded-lg p-3 text-center">
                          <span className="text-[11px] font-bold text-rose-800 flex items-center justify-center gap-1">
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            No llegó (NA)
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">Conteo de inasistencias</p>
                        </div>
                      </div>

                      {/* Deep branches of No Llegó: 1-2 vs 3+ */}
                      <div className="mt-4 pt-3 border-t border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Case 1-2 inasistencias */}
                        <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block">
                            Primera o segunda inasistencia
                          </span>
                          <span className="text-xs font-extrabold text-orange-900 block my-1">
                            1 o 2 Inasistencias (NA)
                          </span>
                          <div className="bg-orange-600 text-white rounded p-2 text-xs font-medium shadow-xs mt-1">
                            📝 <strong>Diligenciar Formato GFPI-F-176</strong>
                            <p className="text-[10px] opacity-90 mt-0.5">
                              Ruta de atención para prevención de deserción (Tabla 1 y 2)
                            </p>
                          </div>
                        </div>

                        {/* Case 3+ inasistencias */}
                        <div className="bg-rose-50 border-2 border-rose-400 rounded-lg p-3 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                            Tres o más inasistencias
                          </span>
                          <span className="text-xs font-extrabold text-rose-900 block my-1">
                            ≥3 días consecutivos o ≥5 acum.
                          </span>
                          <div className="bg-rose-700 text-white rounded p-2 text-xs font-medium shadow-xs mt-1">
                            📋 <strong>Diligenciar Formato Reporte Deserción Grupal</strong>
                            <p className="text-[10px] opacity-90 mt-0.5">
                              Art. 30 Reglamento Aprendiz
                            </p>
                          </div>
                          <div className="w-0.5 h-2 bg-rose-300 mx-auto my-1"></div>
                          <div className="bg-rose-100 text-rose-900 rounded p-1.5 text-[10px] font-semibold border border-rose-300">
                            ✉️ Enviar al Coordinador de Formación con copia a la Coord. Académica
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons to direct to modules */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => { onClose(); onNavigateToModule(2); }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-[#39A900] bg-white hover:bg-emerald-50/50 text-left transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#2e8800] flex items-center justify-center shrink-0 group-hover:bg-[#39A900] group-hover:text-white transition">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Ir a Registro Diario</h5>
                    <p className="text-[11px] text-slate-500">Marcar P, R o NA en vivo</p>
                  </div>
                </button>

                <button
                  onClick={() => { onClose(); onNavigateToModule(3); }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-orange-500 bg-white hover:bg-orange-50/50 text-left transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Gestionar Formatos</h5>
                    <p className="text-[11px] text-slate-500">GFPI-F-176 y Reporte Grupal</p>
                  </div>
                </button>

                <button
                  onClick={() => { onClose(); onNavigateToModule(4); }}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-left transition flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Ver Dashboard & KPIs</h5>
                    <p className="text-[11px] text-slate-500">Métricas analíticas y alertas</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>El sistema evalúa el historial en tiempo real y sugiere la acción reglamentaria correspondiente.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
