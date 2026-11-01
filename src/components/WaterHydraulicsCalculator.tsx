import React, { useState } from 'react';
import { 
  Droplet, 
  Clock, 
  AlertTriangle, 
  Gauge, 
  Truck, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  RefreshCw,
  Flame
} from 'lucide-react';
import { UnitApparatus } from '../types/wildfire';

interface WaterHydraulicsCalculatorProps {
  units: UnitApparatus[];
  setUnits?: React.Dispatch<React.SetStateAction<UnitApparatus[]>>;
}

export const WaterHydraulicsCalculator: React.FC<WaterHydraulicsCalculatorProps> = ({
  units,
  setUnits,
}) => {
  // Primary apparatus: B-6
  const b6Unit = units.find(u => u.callsign === 'B-6') || {
    id: 'b-6',
    callsign: 'B-6',
    name: 'Renault M 180 Forestal 4x4',
    waterCapacityLiters: 3000,
    waterCurrentLiters: 2750,
    fuelPercent: 88,
    pumpStatus: 'operativa',
    driverName: 'Ricardo Jara / Jorge Mato',
    crewCount: 5,
    radioChannel: 'Canal 3 VHF Táctico Forestal'
  };

  const [currentTankLiters, setCurrentTankLiters] = useState<number>(b6Unit.waterCurrentLiters || 2800);
  const tankCapacity = b6Unit.waterCapacityLiters || 3000;

  // Active nozzle lines
  const [piton50Count, setPiton50Count] = useState<number>(1);
  const [piton50FlowGpm, setPiton50FlowGpm] = useState<number>(95); // 30, 60, 95, 125, 150, 200 GPM

  const [piton38Count, setPiton38Count] = useState<number>(1);
  const [piton38FlowGpm, setPiton38FlowGpm] = useState<number>(30); // 30, 60 GPM

  // Water replenishment (e.g. motobomba Honda WH 20X or motobomba flotante in pool/stream)
  const [isReplenishing, setIsReplenishing] = useState<boolean>(false);
  const [pumpInputLitersPerMin, setPumpInputLitersPerMin] = useState<number>(500); // Honda WH 20X nominal 500-600 L/min

  // Shuttle Aljibe Z-Tomé
  const [zTomeArrivalMinutes, setZTomeArrivalMinutes] = useState<number>(12); // Tiempo estimado de arribo de Z-Tomé por Cuesta Menque

  // Hose layout for friction loss calculations
  const [hoseTiradas38mm, setHoseTiradas38mm] = useState<number>(4); // Cada tirada son 15 metros = 60m
  const [elevationMeters, setElevationMeters] = useState<number>(15); // Pendiente cerro

  // Conversions: 1 GPM = 3.78541 Liters / min
  const gpmToLpm = (gpm: number) => gpm * 3.78541;

  const flow50Lpm = piton50Count * gpmToLpm(piton50FlowGpm);
  const flow38Lpm = piton38Count * gpmToLpm(piton38FlowGpm);
  const totalDischargeLpm = flow50Lpm + flow38Lpm;

  const netLossLpm = isReplenishing ? Math.max(0, totalDischargeLpm - pumpInputLitersPerMin) : totalDischargeLpm;

  // Autonomy time
  const remainingMinutes = netLossLpm > 0 ? currentTankLiters / netLossLpm : 999;
  const remainingSecsTotal = Math.floor(remainingMinutes * 60);
  const displayMins = Math.floor(remainingSecsTotal / 60);
  const displaySecs = remainingSecsTotal % 60;

  // Pump pressure recommendation for Maquinista (Ricardo Jara / Jorge Mato):
  // Rule of thumb: Piton pressure (7 Bar / 100 PSI) + Friction loss (~0.2 Bar per tirada 38mm) + Head loss (0.1 Bar per meter elevation)
  const baseNozzlePressureBar = 7.0;
  const frictionLossBar = hoseTiradas38mm * 0.25;
  const elevationLossBar = (elevationMeters * 0.1);
  const targetPumpPressureBar = (baseNozzlePressureBar + frictionLossBar + elevationLossBar).toFixed(1);

  // Sync to B-6 state if callback provided
  const handleUpdateTank = (liters: number) => {
    const val = Math.max(0, Math.min(tankCapacity, liters));
    setCurrentTankLiters(val);
    if (setUnits) {
      setUnits(prev => prev.map(u => u.callsign === 'B-6' ? { ...u, waterCurrentLiters: val } : u));
    }
  };

  const isLowWaterCritical = remainingMinutes <= 3.5 && totalDischargeLpm > 0;
  const isModerateWater = remainingMinutes > 3.5 && remainingMinutes <= 7.0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Droplet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-wide">
                  CALCULADOR HIDRÁULICO & AUTONOMÍA DE AGUA — CARRO B-6
                </h2>
                <p className="text-xs text-zinc-400">
                  Herramienta de supervivencia táctica para Maquinistas (Ricardo Jara / Jorge Mato) y Pitoneros en incendios forestales de Menque.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              Estanque B-6: <strong className="text-white">{currentTankLiters} L</strong> / {tankCapacity} L ({Math.round((currentTankLiters / tankCapacity) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Main Tactical Autonomy Monitor Display */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLowWaterCritical
          ? 'bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-950 border-red-600 shadow-2xl shadow-red-950/70 animate-pulse'
          : isModerateWater
          ? 'bg-gradient-to-br from-amber-950/50 via-zinc-950 to-zinc-950 border-amber-600'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* 1. Time Remaining Counter */}
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              AUTONOMÍA CONTINUA RESTANTE:
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              {netLossLpm === 0 ? (
                <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">∞ EQUILIBRIO</span>
              ) : (
                <>
                  <span className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${
                    isLowWaterCritical ? 'text-red-500' : isModerateWater ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {String(displayMins).padStart(2, '0')}:{String(displaySecs).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-mono text-zinc-400">min:seg</span>
                </>
              )}
            </div>
            <p className="text-xs font-medium text-zinc-300">
              {isLowWaterCritical ? (
                <span className="text-red-400 font-bold flex items-center gap-1 justify-center md:justify-start">
                  <ShieldAlert className="w-4 h-4" /> ALERTA: ORDENAR RETIRO TÁCTICO DE LÍNEA DE PITONES
                </span>
              ) : isModerateWater ? (
                <span className="text-amber-400 font-semibold">
                  Nivel de advertencia: Notificar a Central Tomé solicitar despacho de Aljibe Z
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">
                  Caudal y abastecimiento en rango seguro de operación
                </span>
              )}
            </p>
          </div>

          {/* 2. Discharge & Input Flow Metrics */}
          <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Descarga Total Pitones:</span>
              <span className="font-mono font-bold text-red-400 text-sm">
                -{Math.round(totalDischargeLpm)} L/min ({Math.round(totalDischargeLpm / 3.785)} GPM)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Entrada Honda WH20X:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                +{isReplenishing ? pumpInputLitersPerMin : 0} L/min
              </span>
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 font-semibold">Flujo Neto Resultante:</span>
              <span className={`font-mono font-bold text-sm ${netLossLpm > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                {netLossLpm > 0 ? `-${Math.round(netLossLpm)} L/min` : '+0 L/min (Sustentable)'}
              </span>
            </div>
          </div>

          {/* 3. Z-Tomé Convoy Relay Sync */}
          <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-400" />
                CONVOY ALJIBE Z-TOMÉ
              </span>
              <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                10.000 Litros
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Tiempo estimado de arribo a Menque: <strong className="text-white">{zTomeArrivalMinutes} min</strong>
            </p>
            {remainingMinutes < zTomeArrivalMinutes && netLossLpm > 0 ? (
              <div className="p-2 rounded bg-red-950/50 border border-red-800 text-[11px] text-red-200">
                <strong>CRÍTICO:</strong> El agua de B-6 se agotará ({displayMins}m) ANTES de la llegada de Z-Tomé ({zTomeArrivalMinutes}m). Bajar caudal de pitones o usar batefuegos.
              </div>
            ) : (
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800 text-[11px] text-emerald-200">
                <strong>CONTINUIDAD ASEGURADA:</strong> B-6 mantendrá agua suficiente para empalmar con el aljibe.
              </div>
            )}
          </div>
        </div>

        {/* Tank Level Interactive Slider */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="text-zinc-400">Nivel de Agua en Estanque B-6:</span>
            <span className="text-white font-bold">{currentTankLiters} Litros ({Math.round((currentTankLiters / tankCapacity) * 100)}%)</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={tankCapacity}
              step={50}
              value={currentTankLiters}
              onChange={e => handleUpdateTank(parseInt(e.target.value) || 0)}
              className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-500 mt-1">
            <button onClick={() => handleUpdateTank(500)} className="hover:text-red-400 transition-colors">500L (Crítico)</button>
            <button onClick={() => handleUpdateTank(1500)} className="hover:text-amber-400 transition-colors">1.500L (Medio)</button>
            <button onClick={() => handleUpdateTank(2500)} className="hover:text-blue-400 transition-colors">2.500L (Operativo)</button>
            <button onClick={() => handleUpdateTank(3000)} className="hover:text-emerald-400 transition-colors">3.000L (Lleno)</button>
          </div>
        </div>
      </div>

      {/* Hydraulic Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pitones Activos y Líneas de Ataque */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            LÍNEAS DE ATAQUE ACTIVAS (DESCARGA)
          </h3>

          {/* Pitón 50 mm */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Pitón de 50 mm (Ataque y Protección de Estructuras)</span>
                <span className="text-[11px] text-zinc-400">P011 Regulador de Caudal (30 a 200 GPM)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPiton50Count(Math.max(0, piton50Count - 1))}
                  className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-6 text-center font-mono font-bold text-white">{piton50Count}</span>
                <button
                  onClick={() => setPiton50Count(Math.min(3, piton50Count + 1))}
                  className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {piton50Count > 0 && (
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                  Caudal Seleccionado por Pitón: <strong className="text-orange-400">{piton50FlowGpm} GPM ({Math.round(gpmToLpm(piton50FlowGpm))} L/min)</strong>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[30, 60, 95, 125, 150, 200].map(gpm => (
                    <button
                      key={gpm}
                      onClick={() => setPiton50FlowGpm(gpm)}
                      className={`p-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                        piton50FlowGpm === gpm
                          ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {gpm} GPM
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pitón Forestal 38 mm */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Pitón Forestal de 38 mm (Línea Ligera de Penetración)</span>
                <span className="text-[11px] text-zinc-400">P017 Caudal forestal estándar</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPiton38Count(Math.max(0, piton38Count - 1))}
                  className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-6 text-center font-mono font-bold text-white">{piton38Count}</span>
                <button
                  onClick={() => setPiton38Count(Math.min(4, piton38Count + 1))}
                  className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {piton38Count > 0 && (
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                  Caudal Seleccionado por Pitón: <strong className="text-cyan-400">{piton38FlowGpm} GPM ({Math.round(gpmToLpm(piton38FlowGpm))} L/min)</strong>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[30, 60].map(gpm => (
                    <button
                      key={gpm}
                      onClick={() => setPiton38FlowGpm(gpm)}
                      className={`p-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                        piton38FlowGpm === gpm
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {gpm} GPM ({Math.round(gpmToLpm(gpm))} L/min)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Abastecimiento, Motobomba & Presión de Bomba */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            ABASTECIMIENTO CONTINUO & PRESIÓN EN BOMBA
          </h3>

          {/* Motobomba Honda WH 20X */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Motobomba Honda Pressure WH 20X (MM001)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Aspiración desde piscina de 10.000 L, estero o tranque rural
                </span>
              </div>
              <button
                onClick={() => setIsReplenishing(!isReplenishing)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  isReplenishing
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {isReplenishing ? 'BOMBEANDO' : 'DETENIDA'}
              </button>
            </div>

            {isReplenishing && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Caudal de inyección a estanque:</span>
                  <span className="font-mono text-emerald-400 font-bold">{pumpInputLitersPerMin} L/min</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={700}
                  step={50}
                  value={pumpInputLitersPerMin}
                  onChange={e => setPumpInputLitersPerMin(parseInt(e.target.value) || 400)}
                  className="w-full accent-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Presión Recomendada para el Maquinista */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Presión Sugerida en Bomba B-6:</span>
              <span className="text-xl font-mono font-black text-amber-400">
                {targetPumpPressureBar} Bar / {Math.round(parseFloat(targetPumpPressureBar) * 14.5)} PSI
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">
                  Tiradas de 38mm ({hoseTiradas38mm * 15}m):
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={hoseTiradas38mm}
                  onChange={e => setHoseTiradas38mm(parseInt(e.target.value) || 1)}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">
                  Elevación Ladera Cerro (+{elevationMeters}m):
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={elevationMeters}
                  onChange={e => setElevationMeters(parseInt(e.target.value) || 0)}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              Cálculo para Maquinista: 7.0 Bar en pitón + {(hoseTiradas38mm * 0.25).toFixed(1)} Bar pérdida fricción + {(elevationMeters * 0.1).toFixed(1)} Bar por columna de agua en pendiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
