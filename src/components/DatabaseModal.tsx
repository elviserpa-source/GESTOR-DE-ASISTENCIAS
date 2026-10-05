import React, { useState } from 'react';
import { 
  Database, 
  X, 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  HardDrive, 
  CheckCircle2, 
  Layers,
  Trash2,
  Sparkles,
  FileDown,
  AlertTriangle,
  FolderX,
  Users,
  Calendar,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { SenaDatabase, InstructorConfig } from '../db/senaDatabase';
import { Ficha, Aprendiz, RegistroAsistencia, FormatoGFPI176Item, FormatoDesercionItem, EmailLog } from '../types/attendance';
import { generateFichaClosurePDF } from '../utils/senaClosureReportGenerator';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  fichas?: Ficha[];
  aprendices?: Aprendiz[];
  attendanceRecords?: RegistroAsistencia[];
  gfpiRecords?: FormatoGFPI176Item[];
  desercionRecords?: FormatoDesercionItem[];
  emailLogs?: EmailLog[];
  instructorConfig?: InstructorConfig;
  fichasCount: number;
  aprendicesCount: number;
  asistenciasCount: number;
  gfpiCount: number;
  desercionCount: number;
  emailsCount: number;
  onDataReloadNeeded: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  fichas = [],
  aprendices = [],
  attendanceRecords = [],
  gfpiRecords = [],
  desercionRecords = [],
  emailLogs = [],
  instructorConfig = SenaDatabase.getInstructorConfig(),
  fichasCount,
  aprendicesCount,
  asistenciasCount,
  gfpiCount,
  desercionCount,
  emailsCount,
  onDataReloadNeeded
}) => {
  const [importText, setImportText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // State for closing/deleting a specific ficha
  const [fichaToDelete, setFichaToDelete] = useState<Ficha | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Actual fichas list from props or fallback to storage
  const activeFichas = fichas.length > 0 ? fichas : SenaDatabase.getFichas();
  const allAprendices = aprendices.length > 0 ? aprendices : SenaDatabase.getAprendices();
  const allAsistencias = attendanceRecords.length > 0 ? attendanceRecords : SenaDatabase.getAsistencias();
  const allGfpi = gfpiRecords.length > 0 ? gfpiRecords : SenaDatabase.getGfpiRecords();
  const allDesercion = desercionRecords.length > 0 ? desercionRecords : SenaDatabase.getDesercionRecords();

  const handleExportBackup = () => {
    const json = SenaDatabase.exportFullDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SENA_BaseDatos_Asistencia_Desercion_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage({ type: 'success', text: '¡Copia de seguridad exportada exitosamente!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImportBackup = () => {
    if (!importText.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor pegue el contenido JSON del respaldo.' });
      return;
    }

    const success = SenaDatabase.importFullDatabase(importText);
    if (success) {
      setStatusMessage({ type: 'success', text: '¡Base de datos restaurada con éxito!' });
      onDataReloadNeeded();
      setImportText('');
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1500);
    } else {
      setStatusMessage({ type: 'error', text: 'Error: El formato JSON no es válido o está corrupto.' });
    }
  };

  const handleDeleteLoadedLists = () => {
    if (aprendicesCount === 0 && asistenciasCount === 0) {
      setStatusMessage({ type: 'error', text: 'No hay datos de listados cargados para eliminar (el conteo ya está en 0).' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const confirmed = confirm(
      '¿Está seguro de que desea eliminar todos los datos de los listados cargados previamente?\n\n' +
      '• Se borrarán los aprendices cargados.\n' +
      '• Se borrarán las asistencias, retardos e inasistencias registradas.\n' +
      '• Se borrarán los formatos GFPI-F-176 y reportes de deserción asociados.\n\n' +
      'Esta acción dejará el sistema listo para que pueda cargar nuevos archivos en limpio.'
    );

    if (confirmed) {
      SenaDatabase.clearLoadedLists();
      onDataReloadNeeded();
      setStatusMessage({ 
        type: 'success', 
        text: '¡Datos de los listados cargados eliminados con éxito! Los aprendices y registros quedaron en 0.' 
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('¿Está seguro de reiniciar la base de datos a un estado limpio sin aprendices para ejecutar desde cero?')) {
      SenaDatabase.resetDatabase();
      onDataReloadNeeded();
      setStatusMessage({ type: 'success', text: 'Base de datos limpia y lista para ejecutar.' });
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1200);
    }
  };

  const handleLoadDemoData = () => {
    if (confirm('¿Desea cargar los datos de muestra / demo para simular y previsualizar reportes?')) {
      SenaDatabase.loadSampleDemoData();
      onDataReloadNeeded();
      setStatusMessage({ type: 'success', text: '¡Datos de demostración cargados exitosamente!' });
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1200);
    }
  };

  /**
   * Generates official closure PDF report and permanently deletes the selected ficha
   */
  const handleConfirmDeleteFicha = () => {
    if (!fichaToDelete) return;

    try {
      setIsDeleting(true);

      // 1. Generate and download official closure PDF report with metrics and unjustified absences table
      generateFichaClosurePDF({
        ficha: fichaToDelete,
        aprendices: allAprendices,
        asistencias: allAsistencias,
        gfpiRecords: allGfpi,
        desercionRecords: allDesercion,
        instructorConfig
      });

      // 2. Delete ficha and associated data from storage
      SenaDatabase.deleteFicha(fichaToDelete.id);

      // 3. Trigger app reload
      onDataReloadNeeded();

      const deletedCodigo = fichaToDelete.codigo;
      setFichaToDelete(null);
      setIsDeleting(false);

      setStatusMessage({ 
        type: 'success', 
        text: `¡Informe de cierre generado y descargado en PDF! La ficha ${deletedCodigo} y sus registros fueron eliminados exitosamente.` 
      });
      setTimeout(() => setStatusMessage(null), 4500);
    } catch (error) {
      console.error('Error al cerrar y eliminar ficha:', error);
      setIsDeleting(false);
      setStatusMessage({ 
        type: 'error', 
        text: 'Ocurrió un error al generar el informe o eliminar la ficha.' 
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-200">
        {/* Header */}
        <div className="bg-[#00324D] dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Base de Datos del Sistema (SENA Storage Engine)</h3>
              <p className="text-xs text-slate-300 dark:text-slate-400">
                Almacenamiento persistente de fichas, asistencias, formatos y comunicaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status message banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Confirmation Dialog for Ficha Closure & Deletion */}
          {fichaToDelete && (
            <div className="bg-rose-50/90 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FolderX className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded">
                      Cierre de Grupo Formativo
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-800 dark:text-rose-300">
                      Ficha {fichaToDelete.codigo}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ¿Confirmar Cierre y Eliminación de la Ficha: {fichaToDelete.programa}?
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Esta opción está destinada para cuando la etapa de formación del grupo <strong>ha culminado</strong> y ya no se requiere seguir registrando información.
                  </p>
                </div>
              </div>

              {/* Requirements & Automatic Actions Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-rose-200 dark:border-rose-900/60 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Generación previa del Informe Oficial en PDF requerida:</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1 text-[11px]">
                  <li>
                    Se generará y descargará automáticamente el <strong>Informe Oficial de Cierre en formato PDF</strong>.
                  </li>
                  <li>
                    El informe contiene las <strong>métricas consolidadas</strong> de la ficha (asistencias, retardos, inasistencias y deserciones).
                  </li>
                  <li>
                    Incluye la <strong>tabla con nombres y fechas exactas de las inasistencias injustificadas</strong> registradas durante la formación.
                  </li>
                  <li>
                    Una vez generado el PDF, se eliminará la ficha y sus registros asociados de la base de datos de manera definitiva.
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFichaToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteFicha}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isDeleting ? 'Generando PDF y Eliminando...' : 'Descargar PDF de Cierre y Eliminar Ficha'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Fichas Management Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Gestión y Cierre de Fichas de Formación ({activeFichas.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Eliminación con acta de cierre en PDF
              </span>
            </div>

            <div className="space-y-2">
              {activeFichas.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  No hay fichas registradas actualmente. Cargue un listado en el Módulo 1 para registrar una ficha.
                </div>
              ) : (
                activeFichas.map(f => {
                  const fAprendices = allAprendices.filter(a => a.fichaId === f.id);
                  const fAsistencias = allAsistencias.filter(r => r.fichaId === f.id);
                  const fInasistencias = fAsistencias.filter(r => r.estado === 'NA');

                  return (
                    <div 
                      key={f.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                            {f.codigo}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {f.programa}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{f.nivel}</span>
                          <span>•</span>
                          <span>{f.jornada} ({f.horario})</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{fAprendices.length} aprendices</span>
                          <span>•</span>
                          <span className="font-semibold text-rose-700 dark:text-rose-400">{fInasistencias.length} inasistencias NA</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Direct PDF Download Preview */}
                        <button
                          type="button"
                          onClick={() => {
                            generateFichaClosurePDF({
                              ficha: f,
                              aprendices: allAprendices,
                              asistencias: allAsistencias,
                              gfpiRecords: allGfpi,
                              desercionRecords: allDesercion,
                              instructorConfig
                            });
                            setStatusMessage({ type: 'success', text: `Informe PDF de la ficha ${f.codigo} descargado.` });
                            setTimeout(() => setStatusMessage(null), 3000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          title="Descargar únicamente el informe PDF de esta ficha sin eliminarla"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>PDF Cierre</span>
                        </button>

                        {/* Close and Delete Ficha Button */}
                        <button
                          type="button"
                          onClick={() => setFichaToDelete(f)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-700 text-rose-700 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200 dark:border-rose-900/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer group shadow-2xs"
                          title="Cerrar el grupo y eliminar la ficha generando previamente el informe en PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>Eliminar Ficha</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Status summary cards */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Registros Almacenados en la Base de Datos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase block">Fichas SENA</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{fichasCount}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase block">Aprendices</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{aprendicesCount}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase block">Asistencias</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{asistenciasCount}</span>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-xl p-3">
                <span className="text-[10px] text-orange-800 dark:text-orange-300 font-bold uppercase block">Formatos GFPI-F-176</span>
                <span className="text-lg font-black text-orange-900 dark:text-orange-200">{gfpiCount}</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl p-3">
                <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase block">Reportes Deserción</span>
                <span className="text-lg font-black text-rose-900 dark:text-rose-200">{desercionCount}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3">
                <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase block">Correos Outlook</span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-200">{emailsCount}</span>
              </div>
            </div>
          </div>

          {/* Delete Loaded Lists Section */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Eliminar Datos de los Listados Cargados</span>
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                    Permite vaciar los aprendices, registros de asistencias y formatos cargados previamente para iniciar con un listado nuevo en blanco.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteLoadedLists}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer shrink-0 active:scale-95"
                  title="Eliminar datos de los listados cargados previamente"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Listados Cargados</span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup & Export options */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Exportación y Respaldo de Datos
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportBackup}
                className="px-4 py-2 bg-[#00324D] hover:bg-[#002235] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar Respaldo JSON Completo</span>
              </button>

              <button
                onClick={handleResetToDefault}
                className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Dejar base de datos limpia con 0 aprendices"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Reiniciar a Limpio</span>
              </button>

              <button
                onClick={handleLoadDemoData}
                className="px-3.5 py-2 border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Cargar aprendices y asistencias de prueba para previsualizar"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cargar Datos Demo</span>
              </button>
            </div>
          </div>

          {/* Import JSON */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Restaurar Base de Datos desde Respaldo JSON
            </h4>
            <textarea
              rows={3}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Pegue aquí el contenido JSON exportado previamente..."
              className="w-full p-2.5 font-mono text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900"
            />
            <div className="flex justify-end">
              <button
                onClick={handleImportBackup}
                className="px-4 py-1.5 bg-[#39A900] hover:bg-[#2e8800] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Importar y Restaurar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Los datos se almacenan automáticamente en el navegador de manera persistente.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
