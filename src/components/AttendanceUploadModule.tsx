import React, { useState, useRef } from 'react';
import { 
  Upload, 
  UserPlus, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Check, 
  AlertCircle, 
  Users, 
  FolderPlus,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  Edit2,
  Trash2,
  FileCheck,
  Sparkles,
  Info,
  Calendar,
  Building2
} from 'lucide-react';
import { Ficha, Aprendiz } from '../types/attendance';
import { 
  parseSofiaText, 
  parseSofiaExcelFile, 
  generateSofiaExcelTemplate,
  sampleSofiaFicha3534716,
  sampleSofiaAprendices3534716
} from '../utils/sofiaParser';

interface AttendanceUploadModuleProps {
  fichas: Ficha[];
  selectedFichaId: string;
  setSelectedFichaId: (id: string) => void;
  aprendices: Aprendiz[];
  setAprendices: React.Dispatch<React.SetStateAction<Aprendiz[]>>;
  setFichas: React.Dispatch<React.SetStateAction<Ficha[]>>;
  onGoToDailyAttendance: () => void;
  onResetSampleData: () => void;
}

export const AttendanceUploadModule: React.FC<AttendanceUploadModuleProps> = ({
  fichas,
  selectedFichaId,
  setSelectedFichaId,
  aprendices,
  setAprendices,
  setFichas,
  onGoToDailyAttendance,
  onResetSampleData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddAprendiz, setShowAddAprendiz] = useState(false);
  const [showAddFicha, setShowAddFicha] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Bulk modal state
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for new single apprentice
  const [newTipoDoc, setNewTipoDoc] = useState<'CC' | 'TI' | 'CE' | 'PEP'>('CC');
  const [newDocumento, setNewDocumento] = useState('');
  const [newNombres, setNewNombres] = useState('');
  const [newApellidos, setNewApellidos] = useState('');
  const [newCelular, setNewCelular] = useState('');
  const [newCorreo, setNewCorreo] = useState('');
  const [newEstadoSena, setNewEstadoSena] = useState('EN FORMACION');

  // Form states for new Ficha
  const [newFichaCodigo, setNewFichaCodigo] = useState('');
  const [newFichaPrograma, setNewFichaPrograma] = useState('');
  const [newFichaNivel, setNewFichaNivel] = useState<'Técnico Laboral' | 'Tecnólogo' | 'Operario' | 'Auxiliar'>('Tecnólogo');
  const [newFichaJornada, setNewFichaJornada] = useState<'Diurna' | 'Nocturna' | 'Mixta' | 'Madrugada' | 'Fines de semana' | 'Virtual'>('Diurna');
  const [newFichaHorario, setNewFichaHorario] = useState('07:00 a 13:00');
  const [newFichaInstructor, setNewFichaInstructor] = useState('Elvis Serpa Hernández');

  const currentFicha = fichas.find(f => f.id === selectedFichaId) || fichas[0];
  const fichaAprendices = aprendices.filter(a => a.fichaId === currentFicha?.id);

  const filteredAprendices = fichaAprendices.filter(a => {
    const text = `${a.nombres} ${a.apellidos} ${a.documento} ${a.correo} ${a.celular || a.telefono} ${a.estadoSena || ''}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // Handler for loading sample data from user image (Ficha 3534716)
  const handleLoadImageSample = () => {
    // Check if Ficha 3534716 already exists
    const exists = fichas.some(f => f.codigo === '3534716');
    if (!exists) {
      setFichas(prev => [sampleSofiaFicha3534716, ...prev]);
    }
    setSelectedFichaId(sampleSofiaFicha3534716.id);

    // Merge or replace apprentices for this ficha
    setAprendices(prev => {
      const others = prev.filter(a => a.fichaId !== sampleSofiaFicha3534716.id);
      return [...others, ...sampleSofiaAprendices3534716];
    });

    setBulkSuccess('¡Ficha 3534716 y sus 6 aprendices cargados con éxito según la imagen!');
    setTimeout(() => setBulkSuccess(''), 4000);
  };

  // Handler for parsing and committing bulk data
  const processParsedResult = (parsed: ReturnType<typeof parseSofiaText>) => {
    if (parsed.aprendices.length === 0) {
      setBulkError('No se encontraron registros de aprendices válidos en el archivo o texto proporcionado.');
      return;
    }

    let targetFichaId = currentFicha.id;

    // If metadata header contains Ficha de Caracterización
    if (parsed.fichaInfo && parsed.fichaInfo.codigo) {
      const fichaCod = parsed.fichaInfo.codigo;
      const foundFicha = fichas.find(f => f.codigo === fichaCod);

      if (foundFicha) {
        targetFichaId = foundFicha.id;
        setSelectedFichaId(foundFicha.id);
      } else {
        // Create new Ficha from Excel header automatically!
        const autoFicha: Ficha = {
          id: `f-${fichaCod}`,
          codigo: fichaCod,
          programa: parsed.fichaInfo.programa || 'Programa de Formación SENA',
          nivel: 'Tecnólogo',
          jornada: 'Diurna',
          regional: 'Regional Córdoba',
          centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
          horario: '07:00 a 13:00',
          fechaInicio: '2026-02-01',
          fechaFin: '2027-08-01',
          instructorLider: 'Elvis Serpa Hernández',
          instructorCc: '1067894512',
          estadoFicha: parsed.fichaInfo.estadoFicha || 'EN EJECUCION',
          fechaReporte: parsed.fichaInfo.fechaReporte || '19/09/2026'
        };

        setFichas(prev => [autoFicha, ...prev]);
        targetFichaId = autoFicha.id;
        setSelectedFichaId(autoFicha.id);
      }
    }

    // Convert to full Aprendiz objects
    const newAprendices: Aprendiz[] = parsed.aprendices.map((raw, idx) => ({
      ...raw,
      id: `ap-${Date.now()}-${idx}`,
      fichaId: targetFichaId
    }));

    setAprendices(prev => {
      // Remove any previous apprentices from same ficha if replacing, or append
      const existingDocs = new Set(newAprendices.map(n => n.documento));
      const filteredPrev = prev.filter(p => !(p.fichaId === targetFichaId && existingDocs.has(p.documento)));
      return [...filteredPrev, ...newAprendices];
    });

    setBulkSuccess(
      `¡Se procesaron e importaron exitosamente ${newAprendices.length} aprendices a la ficha ${parsed.fichaInfo?.codigo || currentFicha.codigo}!`
    );
    setBulkText('');
    setTimeout(() => {
      setShowBulkModal(false);
      setBulkSuccess('');
    }, 1800);
  };

  // Process text pasted
  const handleBulkTextSubmit = () => {
    setBulkError('');
    setBulkSuccess('');
    if (!bulkText.trim()) {
      setBulkError('Por favor pegue el contenido de su archivo Excel o CSV.');
      return;
    }

    try {
      const parsed = parseSofiaText(bulkText);
      processParsedResult(parsed);
    } catch (err: any) {
      setBulkError(`Error al procesar el texto: ${err.message}`);
    }
  };

  // Process Excel / CSV file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError('');
    setBulkSuccess('');
    setIsProcessing(true);

    try {
      const fileName = file.name.toLowerCase();
      let parsed;

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        parsed = await parseSofiaExcelFile(file);
      } else {
        // Treat as CSV or text
        const text = await file.text();
        parsed = parseSofiaText(text);
      }

      processParsedResult(parsed);
    } catch (err: any) {
      setBulkError(`Error al leer el archivo Excel/CSV: ${err.message}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download official Excel template (.xlsx)
  const handleDownloadExcel = () => {
    const buffer = generateSofiaExcelTemplate(currentFicha, fichaAprendices);
    const blob = new Blob([buffer as any], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Aprendices_Ficha_${currentFicha.codigo}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download official CSV template
  const handleDownloadCSV = () => {
    const csvContent = 
      'Reporte de Aprendices\n' +
      `Ficha de Caracterización:	${currentFicha.codigo} - ${currentFicha.programa}\n` +
      `Estado:	${currentFicha.estadoFicha || 'EN EJECUCION'}\n` +
      `Fecha del Reporte:	${currentFicha.fechaReporte || '19/09/2026'}\n` +
      'Tipo de Documento,Número de Documento,Nombre,Apellidos,Celular,Correo Electrónico,Estado\n' +
      'CC,1003049636,LEIDYS ESTHER,ROMERO PEREZ,3122705787,romeroleidys579@gmail.com,EN FORMACION\n' +
      'CC,1003141783,LINA MARIA,MAUSSA RODRIGUEZ,3127224926,linamaussa2693@gmail.com,EN FORMACION\n' +
      'CC,1003466597,KARINA,SOTELO SANCHEZ,3244740906,karinasotelosanchez19@gmail.com,EN FORMACION\n' +
      'CC,1004322712,MISHELL LORENA,MEZA OROZCO,3002885198,michellmezaorozco@gmail.com,EN FORMACION\n' +
      'CC,1062427945,YULIANA,CARDENAS MORA,3104626553,cardenasy555@gmail.com,RETIRO VOLUNTARIO\n' +
      'CC,1062428134,VIVIANA VANESSA,MENDEZ SANCHEZ,3006883753,vannemendez22@gmail.com,EN FORMACION\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Aprendices_Ficha_${currentFicha.codigo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Add individual apprentice
  const handleAddAprendiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocumento || !newNombres || !newApellidos) return;

    const newA: Aprendiz = {
      id: `ap-${Date.now()}`,
      fichaId: currentFicha.id,
      documento: newDocumento.trim(),
      tipoDocumento: newTipoDoc,
      nombres: newNombres.trim().toUpperCase(),
      apellidos: newApellidos.trim().toUpperCase(),
      celular: newCelular.trim() || '3000000000',
      telefono: newCelular.trim() || '3000000000',
      correo: newCorreo.trim() || `${newNombres.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      estadoSena: newEstadoSena,
      estado: newEstadoSena.includes('RETIRO') ? 'DESERCION_REPORTADA' : 'ACTIVO'
    };

    setAprendices(prev => [...prev, newA]);
    setShowAddAprendiz(false);
    setNewDocumento('');
    setNewNombres('');
    setNewApellidos('');
    setNewCelular('');
    setNewCorreo('');
  };

  // Add individual Ficha
  const handleAddFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFichaCodigo || !newFichaPrograma) return;

    const newF: Ficha = {
      id: `f-${newFichaCodigo.trim()}`,
      codigo: newFichaCodigo.trim(),
      programa: newFichaPrograma.trim().toUpperCase(),
      nivel: newFichaNivel,
      jornada: newFichaJornada,
      regional: 'Regional Córdoba',
      centroFormacion: 'Centro de Comercio, Industria y Turismo CCIT',
      horario: newFichaHorario,
      fechaInicio: '2026-02-01',
      fechaFin: '2027-08-01',
      instructorLider: newFichaInstructor,
      instructorCc: '1067894512',
      estadoFicha: 'EN EJECUCION',
      fechaReporte: '19/09/2026'
    };

    setFichas(prev => [newF, ...prev]);
    setSelectedFichaId(newF.id);
    setShowAddFicha(false);
    setNewFichaCodigo('');
    setNewFichaPrograma('');
  };

  const handleDeleteAprendiz = (id: string) => {
    if (confirm('¿Está seguro de eliminar este aprendiz del listado de la ficha?')) {
      setAprendices(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with SofiaPlus styling */}
      <div className="bg-gradient-to-r from-[#00324D] via-[#00486e] to-[#00324D] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-emerald-400/30">
              <span>Módulo 1</span>
              <span>•</span>
              <span>Carga & Sincronización SofiaPlus / Zajuna</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Reporte de Aprendices & Listado de Asistencia
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl">
              Compatible con la estructura oficial del <strong>Reporte de Aprendices SENA</strong> (archivos .XLSX / .CSV). Reconoce automáticamente la Ficha de Caracterización, Estado y las 7 columnas del sistema institucional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar Excel / CSV</span>
            </button>
            <button
              onClick={handleLoadImageSample}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Cargar información de ejemplo para demostración"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Información de ejemplo</span>
            </button>
            <button
              onClick={() => setShowAddAprendiz(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Aprendiz</span>
            </button>
            <button
              onClick={onResetSampleData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/20 transition cursor-pointer"
              title="Restaurar datos iniciales"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Structure Guide / Info Card showing image structure */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2e8800] shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-emerald-900">
                Estructura Reconocida del Archivo (según formato de la imagen):
              </span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Encabezado: <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">Ficha de Caracterización</code>, <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">Estado</code>, <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">Fecha del Reporte</code>. <br />
                Columnas: <strong>Tipo de Documento</strong> | <strong>Número de Documento</strong> | <strong>Nombre</strong> | <strong>Apellidos</strong> | <strong>Celular</strong> | <strong>Correo Electrónico</strong> | <strong>Estado</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadExcel}
              className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-[#2e8800] rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descargar .XLSX</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Descargar .CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ficha Selector & Ficha Details */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex-1 max-w-lg">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Ficha de Formación Activa
            </label>
            <div className="flex gap-2">
              <select
                value={selectedFichaId}
                onChange={e => setSelectedFichaId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-[#39A900] transition"
              >
                {fichas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.codigo} — {f.programa} ({f.jornada})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddFicha(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-300 shrink-0 transition cursor-pointer"
                title="Crear nueva ficha"
              >
                <FolderPlus className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Nueva Ficha</span>
              </button>
            </div>
          </div>

          {/* Quick Action towards Module 2 */}
          <div className="flex items-center">
            <button
              onClick={onGoToDailyAttendance}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#39A900] hover:bg-[#2e8800] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>Tomar Asistencia Hoy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ficha Information Card */}
        {currentFicha && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ficha & Programa</span>
              <span className="font-bold text-slate-900 line-clamp-1">{currentFicha.codigo} - {currentFicha.programa}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado de la Ficha</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                {currentFicha.estadoFicha || 'EN EJECUCION'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha del Reporte</span>
              <span className="font-semibold text-slate-800">{currentFicha.fechaReporte || '19/09/2026'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nivel & Jornada</span>
              <span className="font-semibold text-slate-800">{currentFicha.nivel} • {currentFicha.jornada}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Instructor Responsable</span>
              <span className="font-semibold text-slate-800">{currentFicha.instructorLider}</span>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-800">
              <span className="text-emerald-600 block text-[10px] uppercase font-bold">Total Aprendices</span>
              <span className="font-bold text-sm">{fichaAprendices.length} registrados</span>
            </div>
          </div>
        )}
      </div>

      {/* Apprentices Table matching Reporte de Aprendices layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellidos, cédula o celular..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#39A900]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Mostrando: <strong>{filteredAprendices.length}</strong> de {fichaAprendices.length} aprendices</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#00324D] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4">Tipo de Documento</th>
                <th className="py-3 px-4">Número de Documento</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Apellidos</th>
                <th className="py-3 px-4">Celular</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Estado (SofiaPlus)</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAprendices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto text-slate-500">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-slate-800 flex items-center justify-center text-[#39A900]">
                        <Users className="w-6 h-6 stroke-1" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {searchTerm 
                            ? 'No se encontraron aprendices con el filtro de búsqueda' 
                            : `La ficha ${currentFicha.codigo} está lista para recibir aprendices`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {searchTerm 
                            ? 'Intente buscar con otro nombre, documento o limpie el buscador.' 
                            : 'Cargue su archivo oficial de SOFIA Plus / Zajuna (Excel o CSV) o agregue aprendices individualmente.'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setShowBulkModal(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#39A900] hover:bg-[#2e8800] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cargar Excel / CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddAprendiz(true)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Registrar Individual</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLoadImageSample}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
                            title="Cargar muestra de 6 aprendices para demostración"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cargar Muestra Demo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAprendices.map((ap, index) => (
                  <tr key={ap.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 font-mono">{ap.tipoDocumento}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{ap.documento}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{ap.nombres}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{ap.apellidos}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ap.celular || ap.telefono}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{ap.correo}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                        (ap.estadoSena || '').includes('RETIRO')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : ((ap.estadoSena || '').includes('CANCEL')
                              ? 'bg-red-100 text-red-900'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200')
                      }`}>
                        {ap.estadoSena || 'EN FORMACION'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteAprendiz(ap.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Eliminar aprendiz de la ficha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CARGA DE ARCHIVO O TEXTO CON FORMATO OFICIAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#00324D] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Cargar Archivo Excel (.xlsx) / CSV de Aprendices
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Estructura: Reporte de Aprendices SofiaPlus / Zajuna
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Tabs for Upload Mode */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    uploadMode === 'file'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Subir Archivo (.xlsx / .csv)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('paste')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    uploadMode === 'paste'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Copiar y Pegar Texto
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#39A900] bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#2e8800] flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">
                        Haga clic aquí para seleccionar su archivo Excel o CSV
                      </span>
                      <span className="text-xs text-slate-500">
                        Formatos soportados: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>¿No tiene el archivo listo?</span>
                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      className="text-[#2e8800] font-bold hover:underline cursor-pointer"
                    >
                      Descargar plantilla de prueba (.xlsx) &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Copie directamente las celdas desde su Excel o texto separado por comas / tabulaciones:
                  </p>

                  <textarea
                    rows={8}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={
`Reporte de Aprendices
Ficha de Caracterización:	3534716 - GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION
Estado:	EN EJECUCION
Fecha del Reporte:	19/09/2026
Tipo de Documento	Número de Documento	Nombre	Apellidos	Celular	Correo Electrónico	Estado
CC	1003049636	LEIDYS ESTHER	ROMERO PEREZ	3122705787	romeroleidys579@gmail.com	EN FORMACION
CC	1003141783	LINA MARIA	MAUSSA RODRIGUEZ	3127224926	linamaussa2693@gmail.com	EN FORMACION
CC	1003466597	KARINA	SOTELO SANCHEZ	3244740906	karinasotelosanchez19@gmail.com	EN FORMACION`
                    }
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#39A900] bg-slate-50"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkTextSubmit}
                      className="px-5 py-2 bg-[#39A900] hover:bg-[#2e8800] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Procesar e Importar Texto
                    </button>
                  </div>
                </div>
              )}

              {/* Status messages */}
              {isProcessing && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  <span>Leyendo y procesando celdas del archivo...</span>
                </div>
              )}

              {bulkError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {bulkSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{bulkSuccess}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                La Ficha de Caracterización se detectará automáticamente del archivo.
              </span>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Single Apprentice */}
      {showAddAprendiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#00324D] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                Registrar Aprendiz en Ficha {currentFicha.codigo}
              </h3>
              <button
                onClick={() => setShowAddAprendiz(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAprendiz} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={newTipoDoc}
                    onChange={e => setNewTipoDoc(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="CC">CC</option>
                    <option value="TI">TI</option>
                    <option value="CE">CE</option>
                    <option value="PEP">PEP</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Número de Documento</label>
                  <input
                    type="text"
                    required
                    value={newDocumento}
                    onChange={e => setNewDocumento(e.target.value)}
                    placeholder="1003049636"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newNombres}
                    onChange={e => setNewNombres(e.target.value)}
                    placeholder="LEIDYS ESTHER"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={newApellidos}
                    onChange={e => setNewApellidos(e.target.value)}
                    placeholder="ROMERO PEREZ"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Celular</label>
                  <input
                    type="text"
                    value={newCelular}
                    onChange={e => setNewCelular(e.target.value)}
                    placeholder="3122705787"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newCorreo}
                    onChange={e => setNewCorreo(e.target.value)}
                    placeholder="romeroleidys579@gmail.com"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Estado en Formación (SofiaPlus)</label>
                <select
                  value={newEstadoSena}
                  onChange={e => setNewEstadoSena(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                >
                  <option value="EN FORMACION">EN FORMACION</option>
                  <option value="RETIRO VOLUNTARIO">RETIRO VOLUNTARIO</option>
                  <option value="CONDICIONADO">CONDICIONADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                  <option value="INDUCCION">INDUCCION</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAprendiz(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#39A900] hover:bg-[#2e8800] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Guardar Aprendiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Ficha */}
      {showAddFicha && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#00324D] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Crear Nueva Ficha de Caracterización</h3>
              <button
                onClick={() => setShowAddFicha(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFicha} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ficha de Caracterización (Código)</label>
                  <input
                    type="text"
                    required
                    value={newFichaCodigo}
                    onChange={e => setNewFichaCodigo(e.target.value)}
                    placeholder="Ej. 3534716"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nivel</label>
                  <select
                    value={newFichaNivel}
                    onChange={e => setNewFichaNivel(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="Tecnólogo">Tecnólogo</option>
                    <option value="Técnico Laboral">Técnico Laboral</option>
                    <option value="Operario">Operario</option>
                    <option value="Auxiliar">Auxiliar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Programa de Formación</label>
                <input
                  type="text"
                  required
                  value={newFichaPrograma}
                  onChange={e => setNewFichaPrograma(e.target.value)}
                  placeholder="GESTION DEL DESARROLLO ADMINISTRATIVO E INNOVACION"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Jornada</label>
                  <select
                    value={newFichaJornada}
                    onChange={e => setNewFichaJornada(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  >
                    <option value="Diurna">Diurna</option>
                    <option value="Nocturna">Nocturna</option>
                    <option value="Mixta">Mixta</option>
                    <option value="Madrugada">Madrugada</option>
                    <option value="Fines de semana">Fines de semana</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Horario</label>
                  <input
                    type="text"
                    value={newFichaHorario}
                    onChange={e => setNewFichaHorario(e.target.value)}
                    placeholder="07:00 a 13:00"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Instructor Responsable</label>
                <input
                  type="text"
                  value={newFichaInstructor}
                  onChange={e => setNewFichaInstructor(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFicha(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#39A900] hover:bg-[#2e8800] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
