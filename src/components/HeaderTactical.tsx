import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Clock, 
  Radio, 
  Users, 
  MapPin, 
  Compass, 
  ClipboardCheck, 
  FileText,
  Droplet,
  BookOpen,
  Navigation,
  Wind
} from 'lucide-react';
import { WeatherCondition } from '../types/wildfire';
import { soundSystem } from '../utils/audioAlarm';
import { COMPANY_INFO } from '../data/companyData';
import { WindShiftEvent } from '../services/meteorologicalStations';

interface HeaderTacticalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  weather: WeatherCondition;
  is303030Alert: boolean;
  onTriggerMayday: () => void;
  unresolvedMaydayCount: number;
  activeCatastropheCount?: number;
  activeWindShiftAlert?: WindShiftEvent | null;
}

export const HeaderTactical: React.FC<HeaderTacticalProps> = ({
  activeTab,
  setActiveTab,
  weather,
  is303030Alert,
  onTriggerMayday,
  unresolvedMaydayCount,
  activeCatastropheCount = 0,
  activeWindShiftAlert = null,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(3600 + 42 * 60 + 15);
  const [isHornPlaying, setIsHornPlaying] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `T+${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEvacuationHorn = () => {
    setIsHornPlaying(true);
    soundSystem.playEvacuationHorn();
    setTimeout(() => setIsHornPlaying(false), 3000);
  };

  const navTabs = [
    { id: 'catastrophes', label: 'Catástrofes & Emergencias', icon: AlertTriangle, badge: activeCatastropheCount },
    { id: 'windshift', label: 'Monitor Giro Viento (GPS)', icon: Wind, badge: activeWindShiftAlert ? 1 : 0 },
    { id: 'weather', label: 'Regla 30-30-30 & Telemetría en Vivo', icon: Compass },
    { id: 'water', label: 'Autonomía de Agua B-6 (Hidráulica)', icon: Droplet },
    { id: 'ocel', label: 'Protocolo OCEL (LACES)', icon: ShieldAlert },
    { id: 'par', label: 'Control Dotación & PAR (16 Voluntarios)', icon: Users },
    { id: 'map', label: 'Mapa Táctico & GPS Menque', icon: MapPin },
    { id: 'radiocodes', label: 'Claves Radiales (Sistema 10)', icon: Radio },
    { id: 'logbook', label: 'Libro de Guardia & Novedades', icon: BookOpen },
    { id: 'checklist', label: 'Carro B-6 & Inventario', icon: ClipboardCheck },
    { id: 'sitrep', label: 'Informe SITREP & Asesor', icon: FileText },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-40 backdrop-blur-md">
      {/* Highest Urgency: Sudden Wind Shift Detected at Nearest Station */}
      {activeWindShiftAlert && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-2 flex items-center justify-between text-xs text-white flex-wrap gap-2 animate-pulse shadow-lg shadow-red-950">
          <div className="flex items-center gap-2 font-black tracking-wide">
            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            <Wind className="w-4 h-4 shrink-0" />
            <span>
              🚨 ¡ALERTA DE GIRO BRUSCO DE VIENTO ({activeWindShiftAlert.deltaDegrees}°)! {activeWindShiftAlert.station.name}: Cambió a {activeWindShiftAlert.newDirectionLabel} ({activeWindShiftAlert.newSpeedKmh} km/h). REPLIEGUE INMEDIATO.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('windshift')}
            className="font-mono text-xs font-bold text-red-900 bg-white hover:bg-zinc-100 uppercase tracking-wider px-3 py-1 rounded shadow transition-colors cursor-pointer"
          >
            Ver Monitor de Viento &rarr;
          </button>
        </div>
      )}

      {/* Top Banner Alert Bar if Catastrophe Alert or 30-30-30 is active */}
      {!activeWindShiftAlert && (is303030Alert || activeCatastropheCount > 0) && (
        <div className="bg-red-950/85 border-b border-red-700/60 px-4 py-1.5 flex items-center justify-between text-xs text-red-200 flex-wrap gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              {activeCatastropheCount > 0 
                ? `🚨 ${activeCatastropheCount} ALERTA(S) DE CATÁSTROFE ACTIVA(S) EN JURISDICCIÓN SEXTA MENQUE`
                : 'ALERTA ROJA 30-30-30 ACTIVA EN SECTOR MENQUE / TOMÉ'}
            </span>
            <span className="hidden md:inline text-red-300 font-normal">
              (Viento Puelche · Calor Extremo · Sismos · Trombas · Tornados · Derrumbes)
            </span>
          </div>
          <button
            onClick={() => setActiveTab('catastrophes')}
            className="font-mono text-red-200 bg-red-900/80 hover:bg-red-800 uppercase tracking-wider text-[11px] px-2.5 py-0.5 rounded border border-red-600 transition-colors cursor-pointer"
          >
            Ver Protocolos POE &rarr;
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Emblem and Real Station Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            {/* Logo Sexta Compañía Menque */}
            <img 
              src={COMPANY_INFO.logoMenque} 
              alt="Logo 6ta Cía Menque" 
              className="w-11 h-11 rounded-full border border-red-500/80 shadow-md shadow-red-950/60 object-cover bg-zinc-900" 
            />
            {/* Escudo Cuerpo de Bomberos de Tomé */}
            <img 
              src={COMPANY_INFO.logoTome} 
              alt="Escudo CB Tomé" 
              className="h-11 w-auto object-contain hidden xs:block" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-sm sm:text-base tracking-tight text-white uppercase flex items-center gap-1.5">
                <span>{COMPANY_INFO.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                  {COMPANY_INFO.mainApparatus}
                </span>
              </h1>
              <span className="hidden md:inline text-xs font-semibold text-zinc-400">
                · {COMPANY_INFO.department}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <span>Fundada: {COMPANY_INFO.foundation}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-orange-400 italic">"{COMPANY_INFO.motto}"</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-300 font-mono">Región del Biobío</span>
            </p>
          </div>
        </div>

        {/* Center: Live Sector Telemetry & Operational Timer */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>ZONA EN VIVO:</span>
            <span className="font-bold text-white max-w-[150px] truncate" title={weather.selectedComuna}>
              {weather.selectedComuna || 'Menque Cuartel'}
            </span>
          </div>
          <div className="h-3 w-px bg-zinc-700" />
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>OPERACIONAL:</span>
            <span className="font-bold text-white tracking-widest">{formatElapsedTime(elapsedSeconds)}</span>
          </div>
          <div className="h-3 w-px bg-zinc-700" />
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>CANAL:</span>
            <span className="text-emerald-400 font-semibold">VHF CH-3</span>
          </div>
        </div>

        {/* Right: Quick Safety Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Evacuation Horn sound trigger */}
          <button
            onClick={handleEvacuationHorn}
            title="Emitir 3 toques de sirena/bocina de evacuación de emergencia"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isHornPlaying
                ? 'bg-amber-600 text-white border-amber-500 scale-95 shadow-md shadow-amber-900/40'
                : 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-amber-900/60 hover:border-amber-700'
            }`}
          >
            {isHornPlaying ? <VolumeX className="w-4 h-4 animate-bounce" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">SIRENA REPLIEGUE</span>
          </button>

          {/* MAYDAY High Urgency Button */}
          <button
            onClick={onTriggerMayday}
            className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-700 via-red-600 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-xs sm:text-sm font-extrabold rounded-lg shadow-lg shadow-red-950/80 border border-red-500 transition-all hover:scale-[1.02] active:scale-[0.98] animate-pulse cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span>BOTÓN MAYDAY</span>
            {unresolvedMaydayCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-red-700 text-[10px] font-black">
                {unresolvedMaydayCount} ACTIVO
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar with smooth horizontal scroll */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-zinc-900 py-1.5 no-scrollbar">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasBadge = (tab.badge ?? 0) > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-400' : hasBadge ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
              {hasBadge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-900 text-red-100 border border-red-700">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
