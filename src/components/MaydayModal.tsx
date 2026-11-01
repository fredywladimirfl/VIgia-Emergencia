import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertOctagon, Volume2, VolumeX, CheckCircle, Radio, Flame, PhoneCall, Copy, Check } from 'lucide-react';
import { MaydayIncident, UnitApparatus } from '../types/wildfire';
import { soundSystem } from '../utils/audioAlarm';

interface MaydayModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitApparatus[];
  currentIncident: MaydayIncident | null;
  onSaveIncident: (incident: MaydayIncident) => void;
}

export const MaydayModal: React.FC<MaydayModalProps> = ({
  isOpen,
  onClose,
  units,
  currentIncident,
  onSaveIncident,
}) => {
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [unit, setUnit] = useState(currentIncident?.unit || 'B-6 (Renault M 180 - Menque)');
  const [location, setLocation] = useState(currentIncident?.location || 'Ladera Este Cerro El Mirador, Cota 420, Sector Menque (Tomé)');
  const [personnelCount, setPersonnelCount] = useState<number>(currentIncident?.personnelCount || 4);
  const [names, setNames] = useState(currentIncident?.names || 'Fredy Flores (Capitán), Hector Gutierrez (Tte 1°), Rodrigo Zapata, 1 Bombero');
  const [airAndSituation, setAirAndSituation] = useState(currentIncident?.airAndSituation || 'Frente de fuego volteó violentamente por racha de viento Puelche hacia Quebrada Menque. Ruta de escape 1 comprometida.');
  const [resourcesNeeded, setResourcesNeeded] = useState(currentIncident?.resourcesNeeded || 'Descarga aérea inmediata de helicóptero CONAF + Línea de protección de 38mm Carro B-6 + Ambulancia SAMU en camino principal.');
  const [shelterDeploymentOrdered, setShelterDeploymentOrdered] = useState(currentIncident?.shelterDeploymentOrdered || false);

  useEffect(() => {
    if (isOpen) {
      soundSystem.startMaydayAlarm();
      setIsSoundMuted(false);
    } else {
      soundSystem.stopAlarm();
    }
    return () => {
      soundSystem.stopAlarm();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSound = () => {
    if (isSoundMuted) {
      soundSystem.startMaydayAlarm();
      setIsSoundMuted(false);
    } else {
      soundSystem.stopAlarm();
      setIsSoundMuted(true);
    }
  };

  const handleOrderShelter = () => {
    setShelterDeploymentOrdered(true);
    soundSystem.playEvacuationHorn();
  };

  const handleTransmitBroadcast = () => {
    const incident: MaydayIncident = {
      active: true,
      timestamp: new Date().toLocaleTimeString('es-CL'),
      unit,
      location,
      personnelCount,
      names,
      airAndSituation,
      resourcesNeeded,
      shelterDeploymentOrdered,
      resolved: false,
    };
    onSaveIncident(incident);
  };

  const handleResolve = () => {
    soundSystem.stopAlarm();
    if (currentIncident) {
      onSaveIncident({
        ...currentIncident,
        active: false,
        resolved: true,
      });
    }
    onClose();
  };

  const maydayScript = `*** MAYDAY - MAYDAY - MAYDAY ***
BOMBEROS DE CHILE - COMANDANCIA Y CENTRAL DE ALARMAS
• UNIDAD: ${unit}
• LOCALIZACIÓN: ${location}
• DOTACIÓN EN PELIGRO: ${personnelCount} Voluntarios (${names})
• SITUACIÓN TÁCTICA: ${airAndSituation}
• RECURSOS URGENTES REQUERIDOS: ${resourcesNeeded}
${shelterDeploymentOrdered ? '⚠️ ATENCIÓN: ORDEN DE DESPLIEGUE DE REFUGIO TÉRMICO (FIRE SHELTER) EMITIDA' : ''}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(maydayScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-950 border-2 border-red-600 rounded-xl shadow-2xl shadow-red-950/90 text-zinc-100 overflow-hidden my-auto">
        {/* Urgent Header */}
        <div className="bg-red-700 px-6 py-4 flex items-center justify-between text-white border-b border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900 rounded-lg animate-pulse">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-widest uppercase">
                  MAYDAY - HOMBRE ATRAPADO / CAÍDO
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                Protocolo LUNAR de Emergencia Vital · Cuerpo de Bomberos de Chile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isSoundMuted
                  ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300'
                  : 'bg-white text-red-700 border-white hover:bg-red-50 font-bold'
              }`}
              title={isSoundMuted ? 'Activar sirena de baliza' : 'Silenciar sirena'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
              <span className="hidden sm:inline">{isSoundMuted ? 'Silenciado' : 'Sirena Activa'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white px-2 py-1 text-sm rounded bg-red-800 hover:bg-red-900 border border-red-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Warning Callout */}
          <div className="bg-red-950/50 border border-red-700/60 p-4 rounded-lg flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-red-200">
              <p className="font-bold text-red-100">
                ORDEN OPERACIONAL INMEDIATA:
              </p>
              <p className="mt-0.5">
                Todas las demás unidades deben cesar el tráfico radial no urgente (Radio Silence). La frecuencia queda reservada exclusivamente para la unidad en emergencia y el Oficial de Seguridad.
              </p>
            </div>
          </div>

          {/* Form fields in LUNAR format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* L - Location */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-red-900/80 text-white font-mono flex items-center justify-center text-[11px] font-bold">L</span>
                <span>Localización Exacta</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Coordenadas, cota, quebrada o punto de referencia"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* U - Unit */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-red-900/80 text-white font-mono flex items-center justify-center text-[11px] font-bold">U</span>
                <span>Unidad / Móvil Comprometido</span>
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-red-500"
              >
                {units.map(u => (
                  <option key={u.id} value={`${u.callsign} (${u.name})`}>
                    {u.callsign} - {u.name}
                  </option>
                ))}
                <option value="Brigada Terrestre A Pie (Línea de Rastrillo)">Brigada Terrestre A Pie (Línea de Rastrillo)</option>
                <option value="Observador Vigía OCEL">Observador Vigía OCEL</option>
              </select>
            </div>

            {/* N - Names & Personnel count */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-red-900/80 text-white font-mono flex items-center justify-center text-[11px] font-bold">N</span>
                <span>Número y Nombre de Voluntarios Comprometidos</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={personnelCount}
                  onChange={e => setPersonnelCount(parseInt(e.target.value) || 1)}
                  className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-center font-mono text-zinc-100"
                />
                <input
                  type="text"
                  value={names}
                  onChange={e => setNames(e.target.value)}
                  placeholder="Nombres de los bomberos en riesgo"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-zinc-100"
                />
              </div>
            </div>

            {/* A - Air / Trap / Equipment Situation */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-red-900/80 text-white font-mono flex items-center justify-center text-[11px] font-bold">A</span>
                <span>Atrapamiento / Amenaza Inminente</span>
              </label>
              <input
                type="text"
                value={airAndSituation}
                onChange={e => setAirAndSituation(e.target.value)}
                placeholder="Ej. Rodeados por fuego, quemaduras, ruta cortada"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-zinc-100"
              />
            </div>

            {/* R - Resources Needed */}
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-red-900/80 text-white font-mono flex items-center justify-center text-[11px] font-bold">R</span>
                <span>Recursos Tácticos Urgentes Requeridos</span>
              </label>
              <textarea
                rows={2}
                value={resourcesNeeded}
                onChange={e => setResourcesNeeded(e.target.value)}
                placeholder="Descarga de agua aérea, apoyo de carro aljibe Z-1, rescate aeromédico, línea de protección..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-zinc-100 resize-none"
              />
            </div>
          </div>

          {/* Tactical Fire Shelter Button */}
          <div className="p-4 rounded-xl border border-amber-800/80 bg-amber-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-900/60 text-amber-300 shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-amber-200 text-sm">
                  DESPLIEGUE DE REFUGIO TÉRMICO (FIRE SHELTER)
                </h4>
                <p className="text-zinc-300 mt-0.5">
                  Si no hay escape posible a zona segura, ordene buscar suelo mineral sin combustible y desplegar el refugio de protección personal boca abajo.
                </p>
                {shelterDeploymentOrdered && (
                  <p className="text-amber-400 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> ¡ORDEN DE DESPLIEGUE REGISTRADA Y TRANSMITIDA!
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleOrderShelter}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
                shelterDeploymentOrdered
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-amber-900/60 hover:bg-amber-800 text-amber-200 border-amber-700'
              }`}
            >
              {shelterDeploymentOrdered ? 'ORDEN CONFIRMADA' : 'ORDENAR DESPLIEGUE'}
            </button>
          </div>

          {/* Radio Script Ready to Read */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-zinc-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400" />
                GUIÓN RADIAL TÁCTICO PARA TRANSMISIÓN:
              </span>
              <button
                onClick={copyScriptToClipboard}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado al portapapeles' : 'Copiar Texto Radio'}</span>
              </button>
            </div>
            <pre className="font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950 p-2.5 rounded border border-zinc-800">
              {maydayScript}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResolve}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Declarar Situación Controlada / Resuelta</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-lg transition-colors"
            >
              Cerrar Panel
            </button>
            <button
              onClick={handleTransmitBroadcast}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-950 transition-colors flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Guardar & Registrar en Bitácora Táctica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
