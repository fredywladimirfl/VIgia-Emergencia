import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Binoculars, 
  Radio, 
  Route, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Clock, 
  MapPin, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { OcelState, EscapeRoute, SafetyZone } from '../types/wildfire';
import { soundSystem } from '../utils/audioAlarm';

interface OcelDashboardProps {
  ocel: OcelState;
  setOcel: React.Dispatch<React.SetStateAction<OcelState>>;
  flameLengthMeters: number;
}

export const OcelDashboard: React.FC<OcelDashboardProps> = ({
  ocel,
  setOcel,
  flameLengthMeters,
}) => {
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);

  // New Route Form State
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteDesc, setNewRouteDesc] = useState('');
  const [newRouteTime, setNewRouteTime] = useState(5);
  const [newRouteType, setNewRouteType] = useState<EscapeRoute['terrainType']>('cortafuego');

  // New Zone Form State
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneLocation, setNewZoneLocation] = useState('');
  const [newZoneCapacity, setNewZoneCapacity] = useState(30);
  const [newZoneDistance, setNewZoneDistance] = useState(50);
  const [newZoneType, setNewZoneType] = useState<SafetyZone['type']>('area_quemada_negra');

  // Minimum required safe separation distance from flames: rule of thumb is at least 4 times flame height
  const minimumSafetyDistanceMeters = Math.round(flameLengthMeters * 4);

  // Active clear routes count
  const clearRoutesCount = ocel.escapeRoutes.filter(r => r.status === 'despejada').length;
  const isEscapeThreatened = clearRoutesCount < 2;

  // Toggle escape route status
  const handleToggleRouteStatus = (id: string, newStatus: EscapeRoute['status']) => {
    setOcel(prev => ({
      ...prev,
      escapeRoutes: prev.escapeRoutes.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      )
    }));

    if (newStatus === 'bloqueada_por_fuego') {
      soundSystem.playChimeAlert();
    }
  };

  // Toggle safety zone status
  const handleToggleZoneStatus = (id: string, newStatus: SafetyZone['status']) => {
    setOcel(prev => ({
      ...prev,
      safetyZones: prev.safetyZones.map(z => 
        z.id === id ? { ...z, status: newStatus } : z
      )
    }));
  };

  const handlePingLookout = () => {
    setOcel(prev => ({
      ...prev,
      lookout: {
        ...prev.lookout,
        lastRadioPingMinutesAgo: 0,
      }
    }));
    soundSystem.playChimeAlert();
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName.trim()) return;

    const newRoute: EscapeRoute = {
      id: `route-${Date.now()}`,
      name: newRouteName,
      description: newRouteDesc || 'Ruta identificada por el jefe de cuadrilla.',
      status: 'despejada',
      timeToSafetyMinutes: newRouteTime,
      terrainType: newRouteType,
    };

    setOcel(prev => ({
      ...prev,
      escapeRoutes: [...prev.escapeRoutes, newRoute],
    }));

    setNewRouteName('');
    setNewRouteDesc('');
    setShowAddRouteModal(false);
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    const newZone: SafetyZone = {
      id: `sz-${Date.now()}`,
      name: newZoneName,
      locationDetails: newZoneLocation || 'Zona de seguridad delimitada en terreno.',
      type: newZoneType,
      maxCapacityPersons: newZoneCapacity,
      separationDistanceMeters: newZoneDistance,
      status: 'activa',
    };

    setOcel(prev => ({
      ...prev,
      safetyZones: [...prev.safetyZones, newZone],
    }));

    setNewZoneName('');
    setNewZoneLocation('');
    setShowAddZoneModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Protocol Status Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tracking-tight">
                PROTOCOLO OCEL (LACES)
              </span>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                NORMA OFICIAL CONAF / BOMBEROS DE CHILE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl">
              Regla innegociable de supervivencia en incendios de vegetación: <strong>O</strong>bservador permanente, <strong>C</strong>omunicaciones activas, <strong>E</strong>scape (mínimo 2 rutas libres) y <strong>L</strong>ugar de Seguridad dimensionado contra radiación térmica.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2.5 ${
              isEscapeThreatened || ocel.lookout.lastRadioPingMinutesAgo > 15
                ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
            }`}>
              {isEscapeThreatened ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-white">
                  {isEscapeThreatened ? 'ATENCIÓN: REVISAR RUTAS DE ESCAPE' : 'PROTOCOLO OCEL OPERATIVO'}
                </p>
                <p className="text-[11px] opacity-80">
                  {clearRoutesCount} de {ocel.escapeRoutes.length} rutas despejadas · Vigía activo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Pillar 1: O - Observador */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Binoculars className="w-4 h-4 text-orange-400" />
                O · OBSERVADOR
              </span>
              <span className="text-[11px] font-mono text-emerald-400">EN POSICIÓN</span>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">{ocel.lookout.lookoutName}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{ocel.lookout.vantagePoint}</p>
            </div>
            <div className="text-xs text-zinc-400 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
              <span>Último contacto radial:</span>
              <span className="font-mono font-semibold text-zinc-200">
                hace {ocel.lookout.lastRadioPingMinutesAgo} min
              </span>
            </div>
            <button
              onClick={handlePingLookout}
              className="w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
              <span>Confirmar Enlace con Vigía</span>
            </button>
          </div>

          {/* Pillar 2: C - Comunicaciones */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-400" />
                C · COMUNICACIONES
              </span>
              <span className="text-[11px] font-mono text-emerald-400">ENLACE ACTIVO</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-200">Canal Táctico Principal:</p>
              <p className="text-xs font-mono text-blue-300 bg-blue-950/40 px-2 py-1 rounded border border-blue-900/60">
                {ocel.communications.primaryChannel}
              </p>
            </div>
            <div className="text-xs text-zinc-400 border-t border-zinc-800/80 pt-2">
              <p className="text-[11px] text-zinc-400">Canal Inter-Agencias CONAF:</p>
              <p className="font-mono text-zinc-300 text-xs">{ocel.communications.secondaryChannel}</p>
            </div>
          </div>

          {/* Pillar 3: E - Rutas de Escape */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Route className="w-4 h-4 text-amber-400" />
                E · RUTAS DE ESCAPE
              </span>
              <span className={`text-[11px] font-mono ${clearRoutesCount >= 2 ? 'text-emerald-400' : 'text-red-400'}`}>
                {clearRoutesCount} DISPONIBLES
              </span>
            </div>
            <div>
              <p className="text-xs text-zinc-300">
                {clearRoutesCount >= 2 ? (
                  <span>Mínimo reglamentario cumplido. 2 rutas expeditas hacia zonas seguras.</span>
                ) : (
                  <span className="text-red-300 font-bold">¡ALERTA! Menos de 2 rutas activas. Riesgo de encajonamiento.</span>
                )}
              </p>
            </div>
            <div className="text-xs text-zinc-400 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
              <span>Tiempo promedio evacuación:</span>
              <span className="font-mono font-semibold text-zinc-200">4 a 7 min</span>
            </div>
          </div>

          {/* Pillar 4: L - Lugares de Seguridad */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                L · ZONAS DE SEGURIDAD
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {ocel.safetyZones.length} ACTIVAS
              </span>
            </div>
            <div>
              <p className="text-xs text-zinc-300">
                Distancia mínima requerida contra radiación:
              </p>
              <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                $\ge$ {minimumSafetyDistanceMeters} metros libres
              </p>
            </div>
            <div className="text-xs text-zinc-400 border-t border-zinc-800/80 pt-2 flex items-center justify-between">
              <span>Capacidad total refugio:</span>
              <span className="font-mono font-semibold text-zinc-200">
                {ocel.safetyZones.reduce((acc, z) => acc + z.maxCapacityPersons, 0)} Voluntarios
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Escape Routes Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Route className="w-4 h-4 text-amber-400" />
              <span>RUTAS DE ESCAPE ACTIVAS (CAMINOS DE REPLIEGUE)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Mantener actualizadas en tiempo real. Si el humo o pavesas invaden una ruta, cámbiela de estado de inmediato.
            </p>
          </div>
          <button
            onClick={() => setShowAddRouteModal(true)}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Ruta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ocel.escapeRoutes.map((route, idx) => {
            const isBlocked = route.status === 'bloqueada_por_fuego';
            const isSmoke = route.status === 'humo_denso';
            const isClear = route.status === 'despejada';

            return (
              <div 
                key={route.id}
                className={`p-4 rounded-lg border transition-all ${
                  isBlocked
                    ? 'bg-red-950/40 border-red-800 text-red-200'
                    : isSmoke
                    ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    RUTA #{idx + 1} · {route.terrainType.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-[11px] font-bold uppercase ${
                    isClear ? 'text-emerald-400' : isSmoke ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {route.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{route.name}</h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{route.description}</p>

                <div className="mt-3 flex items-center justify-between text-xs font-mono text-zinc-300 border-t border-zinc-800/60 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-orange-400" />
                    <span>A Zona Segura: {route.timeToSafetyMinutes} min</span>
                  </span>
                </div>

                {/* State switch buttons */}
                <div className="mt-3 grid grid-cols-3 gap-1 pt-1 border-t border-zinc-800/80">
                  <button
                    onClick={() => handleToggleRouteStatus(route.id, 'despejada')}
                    className={`py-1 text-[11px] font-semibold rounded ${
                      isClear ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Despejada
                  </button>
                  <button
                    onClick={() => handleToggleRouteStatus(route.id, 'humo_denso')}
                    className={`py-1 text-[11px] font-semibold rounded ${
                      isSmoke ? 'bg-amber-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Humo
                  </button>
                  <button
                    onClick={() => handleToggleRouteStatus(route.id, 'bloqueada_por_fuego')}
                    className={`py-1 text-[11px] font-semibold rounded ${
                      isBlocked ? 'bg-red-700 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Bloqueada
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Zones Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ZONAS DE SEGURIDAD (ÁREAS DE REFUGIO OPERACIONAL)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Ubicaciones donde el personal bomberil no requiere despliegue de refugio térmico (Fire Shelter) al no existir vegetación combustible.
            </p>
          </div>
          <button
            onClick={() => setShowAddZoneModal(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Zona</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ocel.safetyZones.map((zone) => {
            const isSafe = zone.status === 'activa';
            const meetsSeparation = zone.separationDistanceMeters >= minimumSafetyDistanceMeters;

            return (
              <div 
                key={zone.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {zone.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Capacidad: {zone.maxCapacityPersons} personas
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{zone.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{zone.locationDetails}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-900/80 p-2.5 rounded border border-zinc-800">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Radio de separación:</span>
                    <span className={`font-bold ${meetsSeparation ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {zone.separationDistanceMeters}m (Req: {minimumSafetyDistanceMeters}m)
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Estado de zona:</span>
                    <span className={`font-bold ${isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
                      {zone.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleToggleZoneStatus(zone.id, isSafe ? 'comprometida' : 'activa')}
                    className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                      isSafe
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-600 hover:text-red-400'
                        : 'border-emerald-600 bg-emerald-950/60 text-emerald-300'
                    }`}
                  >
                    {isSafe ? 'Marcar Comprometida' : 'Reactivar como Segura'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Route Modal */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-md w-full space-y-4">
            <h4 className="text-sm font-bold text-white">Registrar Nueva Ruta de Escape</h4>
            <form onSubmit={handleAddRoute} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Nombre / Identificador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ruta 4: Pista Forestal Oeste"
                  value={newRouteName}
                  onChange={e => setNewRouteName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Descripción del terreno</label>
                <textarea
                  placeholder="Terreno, obstáculos, ancho, libre de combustible..."
                  value={newRouteDesc}
                  onChange={e => setNewRouteDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Tiempo a pie (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newRouteTime}
                    onChange={e => setNewRouteTime(parseInt(e.target.value) || 5)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Tipo de camino</label>
                  <select
                    value={newRouteType}
                    onChange={e => setNewRouteType(e.target.value as EscapeRoute['terrainType'])}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="camino_vehicular">Camino Vehicular</option>
                    <option value="cortafuego">Cortafuego Limpio</option>
                    <option value="sendero_matorral">Sendero Matorral</option>
                    <option value="quebrada">Quebrada Seca</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded"
                >
                  Guardar Ruta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Zone Modal */}
      {showAddZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-md w-full space-y-4">
            <h4 className="text-sm font-bold text-white">Registrar Nueva Zona de Seguridad</h4>
            <form onSubmit={handleAddZone} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Nombre de la Zona</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Zona Segura Charlie: Tranque El Peñón"
                  value={newZoneName}
                  onChange={e => setNewZoneName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Ubicación y características</label>
                <textarea
                  placeholder="Suelo mineral, sin vegetación, acceso despejado..."
                  value={newZoneLocation}
                  onChange={e => setNewZoneLocation(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Capacidad (voluntarios)</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={newZoneCapacity}
                    onChange={e => setNewZoneCapacity(parseInt(e.target.value) || 20)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Separación de llama (m)</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={newZoneDistance}
                    onChange={e => setNewZoneDistance(parseInt(e.target.value) || 50)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded"
                >
                  Guardar Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
