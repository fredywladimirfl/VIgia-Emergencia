import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Wind, 
  CloudRain, 
  Activity, 
  Mountain, 
  ThermometerSun, 
  ThermometerSnowflake, 
  Radio, 
  ShieldAlert, 
  Plus, 
  Edit3, 
  Trash2, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X,
  Compass,
  Truck
} from 'lucide-react';
import { CatastropheAlert, CatastropheType, AlertSeverity, UnitApparatus } from '../types/wildfire';
import { soundSystem } from '../utils/audioAlarm';

interface CatastropheAlertCenterProps {
  alerts: CatastropheAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<CatastropheAlert[]>>;
  units: UnitApparatus[];
}

export const CatastropheAlertCenter: React.FC<CatastropheAlertCenterProps> = ({
  alerts,
  setAlerts,
  units,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>('cat-puelche-01');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    type: CatastropheType;
    title: string;
    severity: AlertSeverity;
    status: CatastropheAlert['status'];
    affectedZones: string;
    source: string;
    description: string;
    keyRisksText: string;
    protocolsText: string;
    equipmentText: string;
    assignedUnits: string[];
    notes: string;
  }>({
    type: 'viento_puelche',
    title: '',
    severity: 'alerta_amarilla',
    status: 'activa',
    affectedZones: 'Menque, Tomé, Región del Biobío',
    source: 'SENAPRED Biobío / CB Tomé',
    description: '',
    keyRisksText: '',
    protocolsText: '',
    equipmentText: '',
    assignedUnits: ['B-6'],
    notes: '',
  });

  const [broadcastPlayingId, setBroadcastPlayingId] = useState<string | null>(null);

  // Helper icons and styles by catastrophe type
  const getTypeMeta = (type: CatastropheType) => {
    switch (type) {
      case 'viento_puelche':
        return { label: 'Viento Puelche', icon: Wind, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/80' };
      case 'sismo':
        return { label: 'Sismo / Tsunami', icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-950/40 border-yellow-800/80' };
      case 'erupcion_volcanica':
        return { label: 'Erupción Volcánica', icon: Mountain, color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-800/80' };
      case 'altas_temperaturas':
        return { label: 'Altas Temperaturas', icon: ThermometerSun, color: 'text-red-400', bg: 'bg-red-950/40 border-red-800/80' };
      case 'bajas_temperaturas':
        return { label: 'Bajas Temperaturas / Heladas', icon: ThermometerSnowflake, color: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-800/80' };
      case 'tromba_marina':
        return { label: 'Tromba Marina', icon: Compass, color: 'text-teal-400', bg: 'bg-teal-950/40 border-teal-800/80' };
      case 'tornado':
        return { label: 'Tornado', icon: Wind, color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-800/80' };
      case 'derrumbe':
        return { label: 'Derrumbe / Remoción', icon: AlertTriangle, color: 'text-amber-300', bg: 'bg-amber-950/40 border-amber-800/80' };
      case 'incendio_forestal':
        return { label: 'Incendio Forestal', icon: Flame, color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-800/80' };
      case 'aluvion_inundacion':
      case 'tsunami':
        return { label: 'Aluvión / Tsunami', icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-800/80' };
      default:
        return { label: 'Emergencia', icon: AlertTriangle, color: 'text-zinc-300', bg: 'bg-zinc-800 border-zinc-700' };
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'alerta_roja':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-950 text-red-200 border border-red-600/80">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Alerta Roja SENAPRED
          </span>
        );
      case 'alerta_amarilla':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-950 text-amber-200 border border-amber-600/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Alerta Amarilla
          </span>
        );
      case 'alerta_temprana_preventiva':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-orange-950 text-orange-200 border border-orange-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Alerta Temprana Preventiva
          </span>
        );
      case 'alerta_tecnica_informativa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-200 border border-cyan-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Alerta Técnica Informativa
          </span>
        );
    }
  };

  // Filtered List
  const filteredAlerts = alerts.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchZone = a.affectedZones.toLowerCase().includes(q);
      const matchDesc = a.description.toLowerCase().includes(q);
      if (!matchTitle && !matchZone && !matchDesc) return false;
    }
    return true;
  });

  // KPI counts
  const activeRedCount = alerts.filter(a => a.severity === 'alerta_roja' && a.status === 'activa').length;
  const activeYellowCount = alerts.filter(a => a.severity === 'alerta_amarilla' && a.status === 'activa').length;
  const inMonitoringCount = alerts.filter(a => a.status === 'monitoreo' || a.status === 'en_desarrollo').length;

  const handleOpenAddModal = () => {
    setEditingAlertId(null);
    setFormData({
      type: 'viento_puelche',
      title: '',
      severity: 'alerta_amarilla',
      status: 'activa',
      affectedZones: 'Menque, Tomé, Región del Biobío',
      source: 'SENAPRED Biobío / CB Tomé',
      description: '',
      keyRisksText: '• Riesgo de propagación rápida\n• Foco secundario por pavesas',
      protocolsText: '• Mantener Carro B-6 posicionado con ruta despejada\n• Verificación PAR continua cada 20 min\n• Hidratación obligatoria 1L/h',
      equipmentText: 'Motosierra Stihl 381, Mochilas de agua 20L, Radios VHF',
      assignedUnits: ['B-6'],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (alert: CatastropheAlert) => {
    setEditingAlertId(alert.id);
    setFormData({
      type: alert.type,
      title: alert.title,
      severity: alert.severity,
      status: alert.status,
      affectedZones: alert.affectedZones,
      source: alert.source,
      description: alert.description,
      keyRisksText: alert.keyRisks.join('\n'),
      protocolsText: alert.firefighterProtocols.join('\n'),
      equipmentText: alert.equipmentRequired.join(', '),
      assignedUnits: alert.assignedUnits,
      notes: alert.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const parsedRisks = formData.keyRisksText
      .split('\n')
      .map(s => s.trim().replace(/^[•\-*]\s*/, ''))
      .filter(Boolean);

    const parsedProtocols = formData.protocolsText
      .split('\n')
      .map(s => s.trim().replace(/^[•\-*]\s*/, ''))
      .filter(Boolean);

    const parsedEquipment = formData.equipmentText
      .split(/[,;\n]/)
      .map(s => s.trim().replace(/^[•\-*]\s*/, ''))
      .filter(Boolean);

    if (editingAlertId) {
      setAlerts(prev => prev.map(a => {
        if (a.id === editingAlertId) {
          return {
            ...a,
            type: formData.type,
            title: formData.title,
            severity: formData.severity,
            status: formData.status,
            affectedZones: formData.affectedZones,
            source: formData.source,
            description: formData.description,
            keyRisks: parsedRisks.length > 0 ? parsedRisks : a.keyRisks,
            firefighterProtocols: parsedProtocols.length > 0 ? parsedProtocols : a.firefighterProtocols,
            equipmentRequired: parsedEquipment.length > 0 ? parsedEquipment : a.equipmentRequired,
            assignedUnits: formData.assignedUnits,
            notes: formData.notes,
          };
        }
        return a;
      }));
    } else {
      const newAlert: CatastropheAlert = {
        id: `cat-${formData.type}-${Date.now()}`,
        type: formData.type,
        title: formData.title,
        severity: formData.severity,
        status: formData.status,
        affectedZones: formData.affectedZones || 'Sector Comunal Tomé / Menque',
        issuedAt: `Hoy, ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} CLST`,
        source: formData.source || 'Sexta Compañía Menque - CB Tomé',
        description: formData.description,
        keyRisks: parsedRisks.length > 0 ? parsedRisks : ['Riesgo para personal y estructuras'],
        firefighterProtocols: parsedProtocols.length > 0 ? parsedProtocols : ['Resguardo de dotación y material mayor B-6'],
        equipmentRequired: parsedEquipment.length > 0 ? parsedEquipment : ['EPP normado completo'],
        assignedUnits: formData.assignedUnits,
        notes: formData.notes,
      };
      setAlerts(prev => [newAlert, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteAlert = (id: string) => {
    if (confirm('¿Eliminar esta alerta de catástrofe del registro?')) {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleUpdateStatus = (id: string, newStatus: CatastropheAlert['status']) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handlePlayAlertTone = (alertId: string) => {
    setBroadcastPlayingId(alertId);
    soundSystem.playSirenBroadcast();
    setTimeout(() => {
      setBroadcastPlayingId(null);
    }, 2000);
  };

  const handleGeneralBroadcast = () => {
    soundSystem.playSirenBroadcast();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Command Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                <span>CENTRO DE ALERTAS DE CATÁSTROFES & EMERGENCIAS</span>
              </span>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                SENAPRED · CUERPO DE BOMBEROS DE TOMÉ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl">
              Monitoreo y protocolos tácticos inmediatos para la dotación de la <strong>Sexta Compañía Menque</strong> frente a Sismos, Erupción Volcánica, Viento Puelche, Altas y Bajas Temperaturas, Trombas Marinas, Tornados y Remociones en Masa.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleGeneralBroadcast}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-900/60 transition-colors flex items-center gap-2"
              title="Emitir tono bi-tonal de despacho de emergencia de Bomberos de Chile"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>SONAR TONO RADIAL GENERAL</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-orange-950/60"
            >
              <Plus className="w-4 h-4" />
              <span>+ Declarar Nueva Alerta</span>
            </button>
          </div>
        </div>

        {/* Accountability KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-950 p-3.5 rounded-lg border border-red-900/40">
            <span className="text-zinc-500 block text-[11px] font-mono">ALERTAS ROJAS ACTIVAS:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-red-400">{activeRedCount}</span>
              <span className="text-red-300 text-xs">Peligro Crítico</span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Puelche & Calor 30-30-30
            </span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-lg border border-amber-900/40">
            <span className="text-zinc-500 block text-[11px] font-mono">ALERTAS AMARILLAS:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400">{activeYellowCount}</span>
              <span className="text-amber-300 text-xs">Preparación & Enlace</span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Sismo, Tornados & Derrumbes
            </span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[11px] font-mono">EN MONITOREO / PREVENTIVA:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-cyan-400">{inMonitoringCount}</span>
              <span className="text-zinc-400 text-xs">Eventos Vigentes</span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Cenizas, Heladas & Trombas
            </span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[11px] font-mono">ESTADO CUARTEL SEXTA:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-400">OPERATIVO 100%</span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Carro B-6 listo (3000L)
            </span>
          </div>
        </div>

        {/* Filter bar: By Catastrophe Type */}
        <div className="pt-2 border-t border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por catástrofe, sector (Menque, Tomé, Rafael)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-semibold">Nivel:</span>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-white rounded px-2.5 py-1 text-xs"
              >
                <option value="all">Todos los Niveles</option>
                <option value="alerta_roja">Alerta Roja</option>
                <option value="alerta_amarilla">Alerta Amarilla</option>
                <option value="alerta_temprana_preventiva">Temprana Preventiva</option>
                <option value="alerta_tecnica_informativa">Técnica Informativa</option>
              </select>
            </div>
          </div>

          {/* Catastrophe Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'Todas las Catástrofes' },
              { id: 'viento_puelche', label: 'Viento Puelche' },
              { id: 'altas_temperaturas', label: 'Altas Temperaturas' },
              { id: 'sismo', label: 'Sismos & Tsunami' },
              { id: 'tromba_marina', label: 'Trombas Marinas' },
              { id: 'tornado', label: 'Tornados' },
              { id: 'derrumbe', label: 'Derrumbes' },
              { id: 'erupcion_volcanica', label: 'Erupción Volcánica' },
              { id: 'bajas_temperaturas', label: 'Bajas Temp. / Heladas' },
              { id: 'incendio_forestal', label: 'Incendio Forestal' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setFilterType(pill.id)}
                className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap text-xs font-medium ${
                  filterType === pill.id
                    ? 'bg-orange-600 text-white font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catastrophe Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400 space-y-2">
            <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="font-semibold text-white">No se encontraron alertas para el filtro seleccionado.</p>
            <p className="text-xs text-zinc-500">Prueba cambiando la categoría o declara una nueva alerta de emergencia.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const meta = getTypeMeta(alert.type);
            const Icon = meta.icon;
            const isExpanded = expandedAlertId === alert.id;
            const isBroadcasting = broadcastPlayingId === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition-all ${
                  alert.severity === 'alerta_roja' && alert.status === 'activa'
                    ? 'bg-red-950/20 border-red-700/80 shadow-lg shadow-red-950/40'
                    : alert.severity === 'alerta_amarilla' && alert.status === 'activa'
                    ? 'bg-amber-950/20 border-amber-600/70 shadow-md shadow-amber-950/30'
                    : 'bg-zinc-900/90 border-zinc-800'
                }`}
              >
                {/* Alert Card Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(alert.severity)}
                        <span className={`text-xs font-mono flex items-center gap-1 px-2 py-0.5 rounded border ${meta.bg} ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {alert.issuedAt}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {alert.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-300">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span>Zona: {alert.affectedZones}</span>
                        </span>
                        <span>·</span>
                        <span className="text-zinc-400">Fuente: {alert.source}</span>
                      </div>
                    </div>

                    {/* Action buttons on card header */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Audio Alert Tone */}
                      <button
                        onClick={() => handlePlayAlertTone(alert.id)}
                        title="Tocar alarma sonora bi-tonal para esta emergencia"
                        className={`p-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isBroadcasting
                            ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-700'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="hidden xs:inline">Tono Radial</span>
                      </button>

                      {/* Status Selector */}
                      <select
                        value={alert.status}
                        onChange={e => handleUpdateStatus(alert.id, e.target.value as CatastropheAlert['status'])}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border transition-colors ${
                          alert.status === 'activa'
                            ? 'bg-red-950 text-red-200 border-red-600'
                            : alert.status === 'en_desarrollo'
                            ? 'bg-amber-950 text-amber-200 border-amber-600'
                            : alert.status === 'monitoreo'
                            ? 'bg-cyan-950 text-cyan-200 border-cyan-600'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        <option value="activa">🔴 En Curso / Activa</option>
                        <option value="en_desarrollo">🟠 En Desarrollo</option>
                        <option value="monitoreo">🟡 En Monitoreo</option>
                        <option value="finalizada">🟢 Finalizada</option>
                      </select>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(alert)}
                        title="Editar parámetros y protocolos de esta alerta"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        title="Eliminar alerta del registro"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description Box */}
                  <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                    {alert.description}
                  </p>

                  {/* Quick Tags: Assigned Units & Expand trigger */}
                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-500 font-semibold flex items-center gap-1 text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Móviles Asignados:</span>
                      </span>
                      {alert.assignedUnits.map(unitCode => (
                        <span
                          key={unitCode}
                          className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-orange-400 border border-zinc-700"
                        >
                          {unitCode}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                      className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Ocultar Protocolos & POE' : 'Ver Protocolos de Seguridad & POE'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Protocols, Risks, Equipment */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/90 bg-zinc-950/80 p-4 sm:p-5 rounded-b-xl space-y-4 text-xs">
                    {/* Firefighter Specific Standard Operating Guidelines */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                          Protocolos Operativos y de Seguridad para Voluntarios (Sexta Compañía Menque):
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                        {alert.firefighterProtocols.map((protocol, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold shrink-0 font-mono">{i + 1}.</span>
                            <span className="text-zinc-200">{protocol}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Risks & Equipment Required */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary Risks */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-red-300 text-xs uppercase tracking-wider block">
                          Riesgos Críticos en Terreno:
                        </span>
                        <ul className="space-y-1 bg-red-950/20 border border-red-900/40 p-3 rounded-lg text-red-200">
                          {alert.keyRisks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-red-400 font-bold">⚠️</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Required Equipment */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-cyan-300 text-xs uppercase tracking-wider block">
                          Equipamiento y Material Menor Necesario:
                        </span>
                        <div className="bg-cyan-950/20 border border-cyan-900/40 p-3 rounded-lg flex flex-wrap gap-1.5">
                          {alert.equipmentRequired.map((eq, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 rounded bg-zinc-900 text-cyan-200 border border-cyan-800/60 text-[11px]"
                            >
                              ✓ {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {alert.notes && (
                      <div className="text-[11px] text-zinc-400 italic bg-zinc-900 p-2.5 rounded border border-zinc-800">
                        <strong>Nota de Guardia:</strong> {alert.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Catastrophe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                <span>{editingAlertId ? 'Editar Alerta de Catástrofe' : 'Declarar Nueva Alerta de Catástrofe / Emergencia'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Tipo de Catástrofe / Fenómeno</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as CatastropheType }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="viento_puelche">Viento Puelche (Cálido y Seco)</option>
                    <option value="altas_temperaturas">Altas Temperaturas (Ola de Calor)</option>
                    <option value="sismo">Sismo / Terremoto</option>
                    <option value="tromba_marina">Tromba Marina (Costera)</option>
                    <option value="tornado">Tornado (Convectivo)</option>
                    <option value="derrumbe">Derrumbe / Remoción en Masa</option>
                    <option value="erupcion_volcanica">Erupción Volcánica / Cenizas</option>
                    <option value="bajas_temperaturas">Bajas Temperaturas / Heladas</option>
                    <option value="incendio_forestal">Incendio Forestal de Interfaz</option>
                    <option value="tsunami">Tsunami Borde Costero</option>
                    <option value="aluvion_inundacion">Aluvión / Inundación</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Nivel de Alerta SENAPRED</label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value as AlertSeverity }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-bold"
                  >
                    <option value="alerta_roja">🔴 Alerta Roja (Peligro Inminente)</option>
                    <option value="alerta_amarilla">🟡 Alerta Amarilla (Amenaza en Incremento)</option>
                    <option value="alerta_temprana_preventiva">🟠 Alerta Temprana Preventiva</option>
                    <option value="alerta_tecnica_informativa">🔵 Alerta Técnica Informativa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Título de la Alerta u Operación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alerta Roja por Viento Puelche Extremo & Ráfagas en Cordillera de la Costa"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Zonas Afectadas / Sectores</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Menque, Tomé, Rafael, Cuesta Menque"
                    value={formData.affectedZones}
                    onChange={e => setFormData(prev => ({ ...prev, affectedZones: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Organismo Emisor / Fuente</label>
                  <input
                    type="text"
                    placeholder="Ej. SENAPRED Biobío / DMC / CB Tomé"
                    value={formData.source}
                    onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Descripción del Fenómeno & Escenario</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe las condiciones meteorológicas, sísmicas o geológicas observadas..."
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">
                  Protocolos Específicos para Voluntarios de Sexta Menque (1 por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder="• Sacar carros B-6 a explanada abierta&#10;• Línea visual con vigía OCEL&#10;• Hidratación obligatoria 1L/h"
                  value={formData.protocolsText}
                  onChange={e => setFormData(prev => ({ ...prev, protocolsText: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Riesgos Críticos (1 por línea)</label>
                  <textarea
                    rows={2}
                    placeholder="• Pavesas volantes&#10;• Corte de ruta por caída de árboles"
                    value={formData.keyRisksText}
                    onChange={e => setFormData(prev => ({ ...prev, keyRisksText: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Equipamiento Necesario (separado por comas)</label>
                  <textarea
                    rows={2}
                    placeholder="Motosierra Stihl 381, Mochilas de agua, EPP N95, Focos"
                    value={formData.equipmentText}
                    onChange={e => setFormData(prev => ({ ...prev, equipmentText: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-[11px]"
                  />
                </div>
              </div>

              {/* Units Selection & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Móviles Asignados</label>
                  <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded border border-zinc-700">
                    {['B-6', 'BF-6', 'Z-Tomé', 'K-1'].map(unitKey => {
                      const checked = formData.assignedUnits.includes(unitKey);
                      return (
                        <label key={unitKey} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setFormData(prev => ({ ...prev, assignedUnits: prev.assignedUnits.filter(u => u !== unitKey) }));
                              } else {
                                setFormData(prev => ({ ...prev, assignedUnits: [...prev.assignedUnits, unitKey] }));
                              }
                            }}
                            className="rounded border-zinc-700 text-orange-600 focus:ring-0"
                          />
                          <span className="text-white font-mono text-xs font-semibold">{unitKey}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Estado de la Alerta</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as CatastropheAlert['status'] }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="activa">Activa / En Combate</option>
                    <option value="en_desarrollo">En Desarrollo</option>
                    <option value="monitoreo">En Monitoreo</option>
                    <option value="finalizada">Finalizada / Desactivada</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow-md"
                >
                  {editingAlertId ? 'Guardar Cambios' : 'Emitir Alerta de Catástrofe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
