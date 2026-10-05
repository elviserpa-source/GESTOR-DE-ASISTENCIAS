import React, { useState } from 'react';
import { X, Copy, Check, Download, FileJson, Search, ExternalLink } from 'lucide-react';
import reglamentoData from '../data/reglamentoAprendiz.json';
import protocoloData from '../data/protocoloRutaDesercion.json';
import gfpi176Data from '../data/formatoGfpiF176.json';
import reporteDesercionData from '../data/formatoReporteDesercion.json';

interface NormativeJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NormativeJsonModal: React.FC<NormativeJsonModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'reglamento' | 'protocolo' | 'gfpi176' | 'reporte'>('protocolo');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const getActiveData = () => {
    switch (activeTab) {
      case 'reglamento':
        return {
          title: 'Reglamento del Aprendiz SENA (Acuerdo 09 de 2024)',
          filename: 'reglamento_aprendiz_sena_acuerdo_09_2024.json',
          data: reglamentoData,
          desc: 'Normativa institucional, causales de deserción (Art. 30), justificaciones (Art. 28) y debido proceso.'
        };
      case 'protocolo':
        return {
          title: 'Protocolo Ruta de Prevención a la Deserción (GFPI-PR-001)',
          filename: 'protocolo_ruta_prevencion_desercion_gfpi_pr_001.json',
          data: protocoloData,
          desc: 'Pasos de atención, Tabla 1 (8 categorías de causas de riesgo) y Tabla 2 (estrategias y escalamientos).'
        };
      case 'gfpi176':
        return {
          title: 'Formato GFPI-F-176: Ruta de Atención para la Prevención de la Deserción',
          filename: 'formato_gfpi_f_176.json',
          data: gfpi176Data,
          desc: 'Esquema de campos y columnas oficiales para el registro de aprendices en alerta temprana (1-2 inasistencias).'
        };
      case 'reporte':
        return {
          title: 'Formato: Reporte Grupal de Deserción',
          filename: 'formato_reporte_grupal_desercion.json',
          data: reporteDesercionData,
          desc: 'Estructura oficial, códigos de novedad (1.1 a 5.2), las 23 causas de deserción y campos de firma para Coordinación.'
        };
    }
  };

  const active = getActiveData();
  const jsonString = JSON.stringify(active.data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = active.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#00324D] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Especificaciones Normativas en JSON SENA
              </h3>
              <p className="text-xs text-slate-300">
                Estructuras convertidas para interoperabilidad institucional
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

        {/* Subheader / Tabs */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('protocolo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'protocolo'
                  ? 'bg-[#39A900] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              1. Protocolo GFPI-PR-001
            </button>
            <button
              onClick={() => setActiveTab('reglamento')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'reglamento'
                  ? 'bg-[#39A900] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              2. Reglamento Aprendiz
            </button>
            <button
              onClick={() => setActiveTab('gfpi176')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'gfpi176'
                  ? 'bg-[#39A900] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              3. Formato GFPI-F-176
            </button>
            <button
              onClick={() => setActiveTab('reporte')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'reporte'
                  ? 'bg-[#39A900] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              4. Reporte Deserción Grupal
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-[#00324D] hover:bg-[#002538] text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar .json</span>
            </button>
          </div>
        </div>

        {/* Description banner */}
        <div className="px-6 py-2 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div>
            <strong>{active.title}:</strong> {active.desc}
          </div>
          <span className="font-mono text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            {active.filename}
          </span>
        </div>

        {/* JSON Viewer */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed selection:bg-emerald-800">
          <pre className="whitespace-pre-wrap">{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Formato oficial listo para exportación e integración con plataformas académicas SENA (Zajuna / SofiaPlus)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
