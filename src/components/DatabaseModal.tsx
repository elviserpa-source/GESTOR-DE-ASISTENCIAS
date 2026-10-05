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
  Sparkles
} from 'lucide-react';
import { SenaDatabase } from '../db/senaDatabase';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#00324D] dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status cards */}
          <div>
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
              rows={4}
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
