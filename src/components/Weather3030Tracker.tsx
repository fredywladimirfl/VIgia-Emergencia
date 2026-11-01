import React, { useState, useEffect, useCallback } from 'react';
import { 
  Compass, 
  Wind, 
  Thermometer, 
  Droplets, 
  Flame, 
  AlertTriangle, 
  Mountain, 
  Gauge, 
  ShieldCheck, 
  ShieldAlert,
  Navigation,
  RefreshCw,
  MapPin,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Crosshair
} from 'lucide-react';
import { WeatherCondition } from '../types/wildfire';
import { CHILEAN_COMMUNAL_PRESETS, evaluateFireConditions } from '../utils/fireFormulas';
import { 
  TOME_BIOBIO_TACTICAL_ZONES, 
  fetchLiveAtmosphericTelemetry, 
  LiveTelemetryData,
  TacticalZone 
} from '../services/realTimeWeather';

interface Weather3030TrackerProps {
  weather: WeatherCondition;
  setWeather: React.Dispatch<React.SetStateAction<WeatherCondition>>;
  onZoneChange?: (zone: TacticalZone | null, liveData: LiveTelemetryData | null) => void;
}

export const Weather3030Tracker: React.FC<Weather3030TrackerProps> = ({
  weather,
  setWeather,
  onZoneChange,
}) => {
  const analysis = evaluateFireConditions(weather);

  // Real-time telemetry state
  const [activeZoneId, setActiveZoneId] = useState<string>('menque-cuartel');
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<LiveTelemetryData | null>(null);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lon: number; accuracyMeters?: number } | null>(null);

  // Fetch telemetry for specific zone
  const fetchZoneWeather = useCallback(async (zone: TacticalZone) => {
    setIsLoadingLive(true);
    setGpsError(null);
    try {
      const data = await fetchLiveAtmosphericTelemetry(zone.latitude, zone.longitude, zone.name, 'zone_preset');
      setLiveData(data);
      setWeather(prev => ({
        ...prev,
        temperatureC: data.temperatureC,
        humidityPercent: data.humidityPercent,
        windSpeedKmh: data.windSpeedKmh,
        windGustKmh: data.windGustKmh,
        windDirectionDegrees: data.windDirectionDegrees,
        windDirectionLabel: data.windDirectionLabel,
        selectedComuna: zone.name,
        selectedRegion: zone.region,
        fuelType: zone.fuelTypeDefault || prev.fuelType,
      }));
      if (onZoneChange) {
        onZoneChange(zone, data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLive(false);
    }
  }, [setWeather, onZoneChange]);

  // Handle GPS location
  const handleActivateGps = () => {
    if (!navigator.geolocation) {
      setGpsError('La geolocalización no es compatible con este navegador.');
      return;
    }

    setIsLoadingLive(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy || 10);
        setGpsCoordinates({ lat, lon, accuracyMeters: acc });
        setIsGpsActive(true);
        setActiveZoneId('gps-custom');

        try {
          const data = await fetchLiveAtmosphericTelemetry(lat, lon, `Mi Posición GPS (±${acc}m)`, 'gps_live');
          setLiveData(data);
          setWeather(prev => ({
            ...prev,
            temperatureC: data.temperatureC,
            humidityPercent: data.humidityPercent,
            windSpeedKmh: data.windSpeedKmh,
            windGustKmh: data.windGustKmh,
            windDirectionDegrees: data.windDirectionDegrees,
            windDirectionLabel: data.windDirectionLabel,
            selectedComuna: `GPS en Vivo (Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)})`,
          }));
          if (onZoneChange) {
            onZoneChange(null, data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingLive(false);
        }
      },
      error => {
        setIsLoadingLive(false);
        setIsGpsActive(false);
        let msg = 'No se pudo obtener la posición GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso GPS denegado. Puedes seleccionar manualmente una de las zonas tácticas de Tomé abajo.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Señal de GPS no disponible en este momento.';
        }
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const handleSelectZone = (zone: TacticalZone) => {
    setActiveZoneId(zone.id);
    setIsGpsActive(false);
    setGpsError(null);
    fetchZoneWeather(zone);
  };

  // Initial load
  useEffect(() => {
    const defaultZone = TOME_BIOBIO_TACTICAL_ZONES.find(z => z.id === 'menque-cuartel') || TOME_BIOBIO_TACTICAL_ZONES[0];
    fetchZoneWeather(defaultZone);
  }, []);

  // Auto-refresh interval (every 60 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (isGpsActive && gpsCoordinates) {
        fetchLiveAtmosphericTelemetry(gpsCoordinates.lat, gpsCoordinates.lon, 'Mi Posición GPS', 'gps_live').then(data => {
          setLiveData(data);
          setWeather(prev => ({
            ...prev,
            temperatureC: data.temperatureC,
            humidityPercent: data.humidityPercent,
            windSpeedKmh: data.windSpeedKmh,
            windGustKmh: data.windGustKmh,
            windDirectionDegrees: data.windDirectionDegrees,
            windDirectionLabel: data.windDirectionLabel,
          }));
        });
      } else {
        const zone = TOME_BIOBIO_TACTICAL_ZONES.find(z => z.id === activeZoneId);
        if (zone) fetchZoneWeather(zone);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, isGpsActive, gpsCoordinates, activeZoneId, fetchZoneWeather, setWeather]);

  const handleApplyPreset = (presetName: string) => {
    const preset = CHILEAN_COMMUNAL_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    setWeather(prev => ({
      ...prev,
      temperatureC: preset.temp,
      humidityPercent: preset.humidity,
      windSpeedKmh: preset.windSpeed,
      windGustKmh: Math.round(preset.windSpeed * 1.35),
      windDirectionDegrees: preset.windDir,
      windDirectionLabel: preset.windLabel,
      localWindType: preset.localWind,
      fuelType: preset.fuel,
      slopePercent: preset.slope,
      selectedComuna: preset.name,
      selectedRegion: preset.region,
    }));
  };

  return (
    <div className="space-y-6">
      {/* 📡 REAL-TIME ZONE TELEMETRY & GPS CONTROLLER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Navigation className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  TELEMETRÍA ATMOSFÉRICA EN TIEMPO REAL
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-bold uppercase">
                    EN VIVO · OPEN-METEO API
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Transmisión continua de temperatura, humedad, viento y presión barométrica según tu ubicación satelital GPS o sector de Tomé.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: GPS + Auto-Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleActivateGps}
              disabled={isLoadingLive}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isGpsActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/60 border border-blue-400'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              }`}
            >
              <Crosshair className={`w-4 h-4 ${isGpsActive ? 'animate-spin' : ''}`} />
              <span>{isGpsActive ? 'GPS Activo (Mi Posición)' : 'Activar GPS de mi Dispositivo'}</span>
            </button>

            <button
              onClick={() => {
                if (isGpsActive && gpsCoordinates) {
                  fetchLiveAtmosphericTelemetry(gpsCoordinates.lat, gpsCoordinates.lon, 'Mi Posición GPS', 'gps_live').then(data => {
                    setLiveData(data);
                    setWeather(prev => ({
                      ...prev,
                      temperatureC: data.temperatureC,
                      humidityPercent: data.humidityPercent,
                      windSpeedKmh: data.windSpeedKmh,
                      windGustKmh: data.windGustKmh,
                      windDirectionDegrees: data.windDirectionDegrees,
                      windDirectionLabel: data.windDirectionLabel,
                    }));
                  });
                } else {
                  const z = TOME_BIOBIO_TACTICAL_ZONES.find(item => item.id === activeZoneId);
                  if (z) fetchZoneWeather(z);
                }
              }}
              disabled={isLoadingLive}
              className="flex items-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              title="Refrescar datos en vivo ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-orange-400' : ''}`} />
              <span>{isLoadingLive ? 'Actualizando...' : 'Actualizar'}</span>
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title="Actualización automática cada 60 segundos"
            >
              Auto 60s: <strong>{autoRefresh ? 'ON' : 'OFF'}</strong>
            </button>
          </div>
        </div>

        {/* GPS Error message if any */}
        {gpsError && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Live Status Bar */}
        {liveData && (
          <div className="mt-4 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <span className="text-zinc-400">Sector Monitoreado: </span>
                <strong className="text-white font-sans">{liveData.zoneName}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-zinc-400">
              <span>Coord: <strong className="text-zinc-200">{liveData.latitude.toFixed(4)}°, {liveData.longitude.toFixed(4)}°</strong></span>
              <span>Distancia a Cuartel Menque: <strong className="text-orange-400">{liveData.distanceToCuartelKm} km (Rumbo {liveData.bearingToCuartelDeg}°)</strong></span>
              <span>Presión: <strong className="text-zinc-200">{liveData.surfacePressureHpa} hPa</strong></span>
              <span>Hora Reporte: <strong className="text-zinc-300">{liveData.timestamp}</strong></span>
            </div>
          </div>
        )}

        {/* Zone Selector Buttons */}
        <div className="mt-4">
          <label className="text-zinc-400 text-xs font-semibold block mb-2">
            Seleccionar Zona Táctica de la Jurisdicción Tomé / Biobío (1-Click para Telemetría en Vivo):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {TOME_BIOBIO_TACTICAL_ZONES.map(zone => {
              const isActive = activeZoneId === zone.id && !isGpsActive;
              return (
                <button
                  key={zone.id}
                  onClick={() => handleSelectZone(zone)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-500/20 border-orange-500 text-orange-200 font-bold shadow-md shadow-orange-950/40'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="block truncate text-xs font-bold">{zone.shortName}</span>
                    {zone.isFireStation && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-red-950 text-red-400 font-mono">BASE</span>
                    )}
                  </div>
                  <span className="block text-[10px] text-zinc-500 mt-0.5 truncate">{zone.commune} · {zone.altitudeMeters}m</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 30-30-30 Master Hero Card */}
      <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        analysis.is303030Alert
          ? 'bg-gradient-to-br from-red-950 via-zinc-950 to-zinc-950 border-red-600 shadow-xl shadow-red-950/60'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                REGLA 30-30-30 DE CONAF & BOMBEROS
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                analysis.is303030Alert
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {analysis.dangerCategory}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
              Criterio crítico de megaincendio: Temperatura &ge; 30°C, Humedad &le; 30%, y Viento &ge; 30 km/h. La combinación de estos tres factores detona comportamiento explosivo con avance violento y pavesas a distancia.
            </p>
          </div>

          {/* Danger Score Gauge */}
          <div className="flex items-center gap-4 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800">
            <div>
              <span className="text-[11px] font-mono text-zinc-400 block">ÍNDICE DE PELIGRO:</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-3xl font-black font-mono ${
                  analysis.dangerScore >= 80 ? 'text-red-500' : analysis.dangerScore >= 50 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {analysis.dangerScore}
                </span>
                <span className="text-zinc-500 text-xs font-mono">/ 100</span>
              </div>
            </div>
            <div className="h-10 w-px bg-zinc-800" />
            <div>
              <span className="text-[11px] font-mono text-zinc-400 block">LONG. DE LLAMA:</span>
              <span className="text-xl font-bold font-mono text-orange-400 mt-0.5 block">
                {analysis.estimatedFlameLengthMeters} metros
              </span>
            </div>
          </div>
        </div>

        {/* The 3 Pillars of 30-30-30 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* 1. Temp */}
          <div className={`p-4 rounded-xl border ${
            analysis.tempViolated 
              ? 'bg-red-950/30 border-red-700/80 text-red-200' 
              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-red-400" />
                TEMPERATURA
              </span>
              <span className={`text-xs font-bold font-mono ${analysis.tempViolated ? 'text-red-400' : 'text-emerald-400'}`}>
                {analysis.tempViolated ? 'UMBRAL CRÍTICO (≥30°)' : 'NORMAL'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-white">{weather.temperatureC}°C</span>
              <span className="text-xs text-zinc-500">Umbral: ≥ 30°C</span>
            </div>
            <input
              type="range"
              min={10}
              max={45}
              value={weather.temperatureC}
              onChange={e => setWeather(prev => ({ ...prev, temperatureC: parseInt(e.target.value) || 20 }))}
              className="w-full mt-3 accent-red-500 cursor-pointer"
            />
          </div>

          {/* 2. Humidity */}
          <div className={`p-4 rounded-xl border ${
            analysis.humidityViolated 
              ? 'bg-red-950/30 border-red-700/80 text-red-200' 
              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-blue-400" />
                HUMEDAD RELATIVA (HR)
              </span>
              <span className={`text-xs font-bold font-mono ${analysis.humidityViolated ? 'text-red-400' : 'text-emerald-400'}`}>
                {analysis.humidityViolated ? 'AIRE MUY SECO (≤30%)' : 'NORMAL'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-white">{weather.humidityPercent}%</span>
              <span className="text-xs text-zinc-500">Umbral: ≤ 30%</span>
            </div>
            <input
              type="range"
              min={5}
              max={85}
              value={weather.humidityPercent}
              onChange={e => setWeather(prev => ({ ...prev, humidityPercent: parseInt(e.target.value) || 30 }))}
              className="w-full mt-3 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* 3. Wind */}
          <div className={`p-4 rounded-xl border ${
            analysis.windViolated 
              ? 'bg-red-950/30 border-red-700/80 text-red-200' 
              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-teal-400" />
                VIENTO & RACHAS
              </span>
              <span className={`text-xs font-bold font-mono ${analysis.windViolated ? 'text-red-400' : 'text-emerald-400'}`}>
                {analysis.windViolated ? 'VIENTO PELIGROSO (≥30)' : 'NORMAL'}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-white">
                {weather.windSpeedKmh} <span className="text-sm font-normal text-zinc-400">km/h</span>
              </span>
              <span className="text-xs font-mono text-orange-400">Racha: {weather.windGustKmh} km/h</span>
            </div>
            <input
              type="range"
              min={5}
              max={80}
              value={weather.windSpeedKmh}
              onChange={e => {
                const spd = parseInt(e.target.value) || 10;
                setWeather(prev => ({ ...prev, windSpeedKmh: spd, windGustKmh: Math.round(spd * 1.35) }));
              }}
              className="w-full mt-3 accent-teal-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Tactical Safe Working Boundary based on Flame Length */}
        <div className={`mt-5 p-4 rounded-xl border flex items-start gap-3.5 ${
          analysis.tacticalActionClass === 'immediate_retreat'
            ? 'bg-red-950/60 border-red-600 text-red-100'
            : analysis.tacticalActionClass === 'indirect_only'
            ? 'bg-amber-950/40 border-amber-600 text-amber-100'
            : 'bg-zinc-950 border-zinc-800 text-zinc-200'
        }`}>
          {analysis.tacticalActionClass === 'immediate_retreat' ? (
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-bounce" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm text-white">
              DIRECTRIZ TÁCTICA PARA CUADRILLAS EN TERRENO:
            </h4>
            <p className="leading-relaxed">
              {analysis.tacticalRecommendation}
            </p>
            <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-zinc-400">
              <span>Riesgo de Pavesas: <strong className="text-white">{analysis.spottingRisk}</strong></span>
              <span>·</span>
              <span>Tiempo Máx de Rotación: <strong className="text-white">{analysis.maxRecommendedWorkIntervalMinutes} min</strong></span>
              <span>·</span>
              <span>Consumo Mínimo Agua: <strong className="text-white">{analysis.hydrationTargetLitersPerHour} L/hora</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Wind Rose and Fuel Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rosa de los Vientos & Chilean Local Winds */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-400" />
              <span>ROSA DE LOS VIENTOS & VIENTO PUELCHE</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {weather.windDirectionDegrees}° ({weather.windDirectionLabel})
            </span>
          </div>

          {/* Visual Compass Graphic */}
          <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
            <div className="relative w-40 h-40 rounded-full border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center shrink-0 shadow-inner">
              <span className="absolute top-1 text-[11px] font-bold text-zinc-400">N</span>
              <span className="absolute right-2 text-[11px] font-bold text-orange-400">E (Puelche)</span>
              <span className="absolute bottom-1 text-[11px] font-bold text-zinc-400">S</span>
              <span className="absolute left-2 text-[11px] font-bold text-blue-400">W (Costa)</span>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-zinc-800" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-px bg-zinc-800" />
              </div>

              {/* Wind Direction Needle */}
              <div 
                className="absolute w-2 h-20 transition-transform duration-500 origin-bottom"
                style={{
                  transform: `translateY(-50%) rotate(${weather.windDirectionDegrees}deg)`,
                }}
              >
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[20px] border-b-orange-500 mx-auto" />
                <div className="w-1 h-14 bg-orange-500/60 mx-auto" />
              </div>

              <div className="w-4 h-4 rounded-full bg-zinc-200 border-2 border-zinc-950 z-10" />
            </div>

            <div className="space-y-3 text-xs flex-1">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">
                  Dirección del Viento ({weather.windDirectionDegrees}°):
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={weather.windDirectionDegrees}
                  onChange={e => {
                    const deg = parseInt(e.target.value) || 0;
                    let label = 'N';
                    if (deg >= 45 && deg < 135) label = 'E (Puelche / Cordillera)';
                    else if (deg >= 135 && deg < 225) label = 'S / SE';
                    else if (deg >= 225 && deg < 315) label = 'W (Brisa Marina)';
                    else label = 'N / NW';
                    setWeather(prev => ({ ...prev, windDirectionDegrees: deg, windDirectionLabel: label }));
                  }}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Fenómeno de Viento Local en Chile:</label>
                <select
                  value={weather.localWindType}
                  onChange={e => setWeather(prev => ({ ...prev, localWindType: e.target.value as WeatherCondition['localWindType'] }))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-xs"
                >
                  <option value="Normal">Viento Gradiente Normal</option>
                  <option value="Puelche / Raco (Cálido y Seco)">Viento Puelche / Raco (Cálido, racheado y muy seco desde Cordillera)</option>
                  <option value="Brisa Marina Suroeste">Brisa Marina Suroeste (Giro violento por la tarde en la costa)</option>
                  <option value="Terral Valle">Viento Terral de Quebrada</option>
                </select>
              </div>

              {weather.localWindType.includes('Puelche') && (
                <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800 text-amber-200 text-[11px] leading-relaxed">
                  <strong>ALERTA DE PUELCHE/RACO:</strong> El aire desciende comprimido desde la cordillera, calentándose adiabáticamente y bajando la humedad a valores bajo 15%. Extrema precaución: alta probabilidad de fuego saltando cortafuegos.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chilean Region & Fuel Selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Mountain className="w-4 h-4 text-emerald-400" />
              <span>VEGETACIÓN COMBUSTIBLE & TOPOGRAFÍA</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Pendiente: {weather.slopePercent}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Tipo de Vegetación</label>
              <select
                value={weather.fuelType}
                onChange={e => setWeather(prev => ({ ...prev, fuelType: e.target.value as WeatherCondition['fuelType'] }))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
              >
                <option value="pino_eucalipto">Plantación Pino Radiata / Eucalipto (Copas y Pavesas)</option>
                <option value="matorral_esclerofilo">Matorral Esclerófilo / Espino / Boldo / Litre</option>
                <option value="pastizal_seco">Pastizal Seco de Secano (Avance Rápido)</option>
                <option value="interfaz_urbana">Interfaz Urbano-Forestal (Casas + Arboleda)</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Humedad de Combustibles</label>
              <select
                value={weather.fuelMoisture}
                onChange={e => setWeather(prev => ({ ...prev, fuelMoisture: e.target.value as WeatherCondition['fuelMoisture'] }))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
              >
                <option value="muy_seco_critico">Muy Seco / Crítico (&lt; 5%)</option>
                <option value="seco">Seco de Verano (6 - 10%)</option>
                <option value="humedo">Humedad Moderada (&gt; 12%)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-semibold">Pendiente del Terreno:</span>
              <span className="font-mono text-white font-bold">{weather.slopePercent}% de inclinación</span>
            </div>
            <input
              type="range"
              min={0}
              max={70}
              value={weather.slopePercent}
              onChange={e => setWeather(prev => ({ ...prev, slopePercent: parseInt(e.target.value) || 0 }))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Cada 10° de aumento en pendiente duplica la velocidad de propagación ladera arriba debido a la precalefacción por radiación y convección.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
