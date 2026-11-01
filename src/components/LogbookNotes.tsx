import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Download, 
  Trash2, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Filter,
  Truck
} from 'lucide-react';
import { COMPANY_INFO } from '../data/companyData';

export interface LogEntry {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: string;
  category: 'despacho' | 'relevo' | 'alerta_senapred' | 'abastecimiento' | 'mantenimiento' | 'general';
  title: string;
  content: string;
  unitInvolved?: string;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: 'Hoy, 18:45',
    authorName: 'Karla Andrea Retamal Urrutia',
    authorRole: 'Secretaria',
    category: 'alerta_senapred',
    title: 'Activación Alerta Temprana Preventiva por Viento Puelche',
    content: 'SENAPRED Biobío emite alerta por ráfagas sobre 45 km/h y temperaturas de 34°C en secano interior. Cuartel Sexta Menque en acuartelamiento preventivo grado 1.',
  },
  {
    id: 'log-2',
    timestamp: 'Hoy, 18:20',
    authorName: 'Ricardo Alejandro Jara Jara',
    authorRole: 'Maquinista',
    category: 'abastecimiento',
    title: 'Revisión y Llenado Estanque Carro B-6',
    content: 'Estanque de 3.000 Litros completado al 100%. Nivel de combustible diésel al 90%. Motobomba Honda WH20X chequeada con estanque lleno y cebador operativo.',
    unitInvolved: 'B-6',
  },
  {
    id: 'log-3',
    timestamp: 'Hoy, 17:50',
    authorName: 'Miguel Ángel Palma González',
    authorRole: 'Ayudante de Compañía',
    category: 'relevo',
    title: 'Pase de Lista PAR — 16 Voluntarios de Sexta Menque',
    content: 'Se verifica dotación completa en cuartel y líneas. Todo el personal cuenta con EPP forestal normado y raciones de hidratación 1.5 L/hora entregadas.',
  },
  {
    id: 'log-4',
    timestamp: 'Hoy, 16:30',
    authorName: 'Guillermo Hernán Retamal Vergara',
    authorRole: 'Director',
    category: 'general',
    title: 'Coordinación con Central de Alarmas CB Tomé y CONAF',
    content: 'Se coordina canal táctico 3 VHF para operaciones en Cuesta Menque y apoyo con aeronaves cisterna en caso de avance hacia interfaces habitadas.',
  }
];

export const LogbookNotes: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('vigia_logbook_entries');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form State
  const [authorName, setAuthorName] = useState('Miguel Ángel Palma González');
  const [authorRole, setAuthorRole] = useState('Ayudante de Compañía');
  const [category, setCategory] = useState<LogEntry['category']>('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unitInvolved, setUnitInvolved] = useState('B-6');

  useEffect(() => {
    try {
      localStorage.setItem('vigia_logbook_entries', JSON.stringify(logs));
    } catch (_) {}
  }, [logs]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newEntry: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: `Hoy, ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`,
      authorName,
      authorRole,
      category,
      title,
      content,
      unitInvolved: unitInvolved || undefined,
    };

    setLogs([newEntry, ...logs]);
    setTitle('');
    setContent('');
    setIsAddModalOpen(false);
  };

  const handleDeleteLog = (id: string) => {
    setLogs(logs.filter(l => l.id !== id));
  };

  const handleExportText = () => {
    const textData = [
      `=============================================================`,
      `LIBRO OFICIAL DE NOVEDADES Y GUARDIA OPERACIONAL`,
      `${COMPANY_INFO.name} — ${COMPANY_INFO.department}`,
      `FECHA: ${new Date().toLocaleDateString('es-CL')} — HORA: ${new Date().toLocaleTimeString('es-CL')}`,
      `=============================================================`,
      '',
      ...logs.map(l => (
        `[${l.timestamp}] [CATEGORÍA: ${l.category.toUpperCase()}] ${l.unitInvolved ? `[UNIDAD: ${l.unitInvolved}]` : ''}\n` +
        `OFICIAL: ${l.authorName} (${l.authorRole})\n` +
        `TÍTULO: ${l.title}\n` +
        `DETALLE: ${l.content}\n` +
        `-------------------------------------------------------------`
      )),
    ].join('\n');

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LIBRO_GUARDIA_6TA_MENQUE_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(l => filterCategory === 'all' || l.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-wide">
                  LIBRO DE NOVEDADES & BITÁCORA DE GUARDIA — SEXTA MENQUE
                </h2>
                <p className="text-xs text-zinc-400">
                  Registro digital cronológico oficial de actos de servicio, relevos, novedades de máquinas y comunicaciones.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Novedad</span>
            </button>
            <button
              onClick={handleExportText}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold border border-zinc-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Libro (.txt)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'all', label: 'Todas las Novedades' },
          { id: 'despacho', label: 'Despacho Máquinas' },
          { id: 'relevo', label: 'Relevos & PAR' },
          { id: 'abastecimiento', label: 'Agua & Motobombas' },
          { id: 'alerta_senapred', label: 'Alertas SENAPRED' },
          { id: 'general', label: 'Generales' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterCategory === cat.id
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-500 text-xs">
            No hay registros en esta categoría.
          </div>
        ) : (
          filteredLogs.map(entry => (
            <div
              key={entry.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/40 px-2.5 py-0.5 rounded border border-orange-800">
                    {entry.timestamp}
                  </span>
                  <span className="text-xs font-bold text-white">{entry.title}</span>
                  {entry.unitInvolved && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-red-950/60 text-red-300 rounded border border-red-800">
                      Unidad: {entry.unitInvolved}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Por: <strong className="text-zinc-200">{entry.authorName}</strong> ({entry.authorRole})
                  </span>
                  <button
                    onClick={() => handleDeleteLog(entry.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-zinc-300 mt-3 leading-relaxed whitespace-pre-line">
                {entry.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Nueva Entrada al Libro de Novedades
            </h3>

            <form onSubmit={handleAddLog} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Oficial / Responsable del Registro:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white"
                  >
                    <option value="Guillermo Hernán Retamal Vergara">Guillermo Retamal (Director)</option>
                    <option value="Karla Andrea Retamal Urrutia">Karla Retamal (Secretaria)</option>
                    <option value="Miguel Ángel Palma González">Miguel Palma (Ayudante)</option>
                    <option value="Manuel Segundo Zapata Aguilera">Manuel Zapata (Tesorero)</option>
                    <option value="Jorge Eduardo Mato Garrido">Jorge Mato (Teniente 1°/Maq)</option>
                    <option value="Eduardo Albornoz Gutiérrez">Eduardo Albornoz (Teniente Maq)</option>
                    <option value="Ricardo Alejandro Jara Jara">Ricardo Jara (Maquinista)</option>
                  </select>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={e => setAuthorRole(e.target.value)}
                    placeholder="Cargo táctico"
                    className="bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Categoría:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white"
                  >
                    <option value="despacho">Despacho de Máquina</option>
                    <option value="relevo">Relevo de Dotación / PAR</option>
                    <option value="abastecimiento">Agua & Motobombas</option>
                    <option value="alerta_senapred">Alerta SENAPRED / Catástrofe</option>
                    <option value="mantenimiento">Mantenimiento B-6</option>
                    <option value="general">Novedad General</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Unidad Involucrada:</label>
                  <select
                    value={unitInvolved}
                    onChange={e => setUnitInvolved(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white"
                  >
                    <option value="B-6">Carro B-6 Renault</option>
                    <option value="BF-6">Carro BF-6 Ataque Rápido</option>
                    <option value="Z-Tomé">Aljibe Z-Tomé</option>
                    <option value="K-1">K-1 Comandancia</option>
                    <option value="Todas">Toda la Compañía</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Título de la Novedad:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Salida de B-6 a 10-2 Cuesta Menque"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Descripción / Minuta Operacional:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detallar personal tripulante, condiciones de ruta, órdenes impartidas o materiales empleados..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Guardar Novedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
