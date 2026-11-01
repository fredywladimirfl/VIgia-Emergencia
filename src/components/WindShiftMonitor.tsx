import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Wind, 
  Compass, 
  Navigation, 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  Clock, 
  Activity, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Bell, 
  BellOff, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Crosshair,
  Flame,
  FileText
} from 'lucide-react';
import { 
  OFFICIAL_WEATHER_STATIONS, 
  WeatherStation, 
  WindTelemetryReading, 
  WindShiftEvent, 
  findNearestWeatherStation, 
  analyzeWindShift, 
  calculateAngularDifferenceDegrees 
} from '../services/meteorologicalStations';
import { fetchLiveAtmosphericTelemetry, getWindDirectionLabelFromDegrees } from '../services/realTimeWeather';
import { soundSystem } from '../utils/audioAlarm';

interface WindShiftMonitorProps {
  onWindShiftDetected?: (event: WindShiftEvent) => void;
  activeWindShiftAlert?: WindShiftEvent | null;
  setActiveWindShiftAlert?: (event: WindShiftEvent | null) => void;
}

export const WindShiftMonitor: React.FC<WindShiftMonitorProps> = ({
  onWindShiftDetected,
  activeWindShiftAlert,
  setActiveWindShiftAlert,
}) => {
  // Device Geolocation State
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Nearest Station State
  const [nearestStation, setNearestStation] = useState<WeatherStation>(OFFICIAL_WEATHER_STATIONS[0]);
  const [distanceToStationKm, setDistanceToStationKm] = useState<number>(0.4);
  const [selectedStationOverride, setSelectedStationOverride] = useState<string>('auto');

  // Telemetry History
  const [telemetryHistory, setTelemetryHistory] = useState<WindTelemetryReading[]>([]);
  const [currentReading, setCurrentReading] = useState<WindTelemetryReading | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Wind Shift Alerts
  const [recentShiftEvents, setRecentShiftEvents] = useState<WindShiftEvent[]>([]);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Polling interval
  const [pollIntervalSecs, setPollIntervalSecs] = useState<number>(30); // 30s default for safety
  const [isMonitoringActive, setIsMonitoringActive] = useState<boolean>(true);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      setNotificationsEnabled(perm === 'granted');
    } catch (e) {
      console.warn('Notification permission error', e);
    }
  };

  // Start watching device GPS
  const startGpsWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('La geolocalización no está disponible en este dispositivo.');
      return;
    }

    setGpsError(null);
    setIsGpsActive(true);

    const id = navigator.geolocation.watchPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy || 10);
        setDeviceCoords({ lat, lon, accuracy: acc });

        if (selectedStationOverride === 'auto') {
          const nearest = findNearestWeatherStation(lat, lon);
          setNearestStation(nearest.station);
          setDistanceToStationKm(nearest.distanceKm);
        }
      },
      error => {
        setIsGpsActive(false);
        let msg = 'Error al obtener GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso GPS denegado. Monitoreando estación seleccionada.';
        }
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    setWatchId(id);
  }, [selectedStationOverride]);

  const stopGpsWatch = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsGpsActive(false);
  };

  // Start GPS automatically on mount
  useEffect(() => {
    startGpsWatch();
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Fetch telemetry for current target station
  const fetchStationTelemetry = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveAtmosphericTelemetry(
        nearestStation.latitude,
        nearestStation.longitude,
        nearestStation.name,
        'zone_preset'
      );

      const reading: WindTelemetryReading = {
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timeEpochMs: Date.now(),
        windSpeedKmh: data.windSpeedKmh,
        windGustKmh: data.windGustKmh,
        windDirectionDegrees: data.windDirectionDegrees,
        windDirectionLabel: data.windDirectionLabel,
        temperatureC: data.temperatureC,
        humidityPercent: data.humidityPercent,
        stationId: nearestStation.id,
        stationName: nearestStation.name,
      };

      setCurrentReading(prev => {
        if (prev) {
          // Compare with previous reading to detect wind shift
          const shiftEvent = analyzeWindShift(prev, reading, nearestStation, distanceToStationKm);
          if (shiftEvent) {
            setRecentShiftEvents(events => [shiftEvent, ...events.slice(0, 9)]);
            if (setActiveWindShiftAlert) {
              setActiveWindShiftAlert(shiftEvent);
            }
            if (onWindShiftDetected) {
              onWindShiftDetected(shiftEvent);
            }

            // Play warning sound if audio is enabled
            if (audioEnabled) {
              soundSystem.playWindShiftWarning();
            }

            // Fire browser push notification if permitted
            if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`🚨 ALERTA: GIRO DE VIENTO (${nearestStation.name})`, {
                  body: `${shiftEvent.shiftDescription}\n${shiftEvent.tacticalImplication}`,
                  icon: '/favicon.ico',
                  tag: 'wind-shift-alert',
                });
              } catch (_) {}
            }
          }
        }
        return reading;
      });

      setTelemetryHistory(history => [reading, ...history.slice(0, 14)]);
    } catch (e) {
      console.error('Error fetching station telemetry', e);
    } finally {
      setIsLoading(false);
    }
  }, [nearestStation, distanceToStationKm, audioEnabled, notificationsEnabled, onWindShiftDetected, setActiveWindShiftAlert]);

  // Initial and periodic fetch
  useEffect(() => {
    fetchStationTelemetry();
  }, [nearestStation]);

  useEffect(() => {
    if (!isMonitoringActive) return;
    const interval = setInterval(() => {
      fetchStationTelemetry();
    }, pollIntervalSecs * 1000);
    return () => clearInterval(interval);
  }, [isMonitoringActive, pollIntervalSecs, fetchStationTelemetry]);

  // Handle manual station change
  const handleStationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStationOverride(val);
    if (val === 'auto') {
      if (deviceCoords) {
        const nearest = findNearestWeatherStation(deviceCoords.lat, deviceCoords.lon);
        setNearestStation(nearest.station);
        setDistanceToStationKm(nearest.distanceKm);
      } else {
        setNearestStation(OFFICIAL_WEATHER_STATIONS[0]);
        setDistanceToStationKm(0.4);
      }
    } else {
      const found = OFFICIAL_WEATHER_STATIONS.find(s => s.id === val);
      if (found) {
        setNearestStation(found);
        if (deviceCoords) {
          setDistanceToStationKm(findNearestWeatherStation(deviceCoords.lat, deviceCoords.lon).distanceKm);
        }
      }
    }
  };

  // Simulation tool for Fire Drills (Simulacros de Evacuación y Giro de Viento)
  const handleSimulateWindShift = (type: 'puelche_to_sea' | 'sudden_gust' | 'extreme_shear') => {
    if (!currentReading) return;

    let simulatedReading: WindTelemetryReading;

    if (type === 'puelche_to_sea') {
      // Simulate sudden afternoon sea breeze shift: from 90° (E Puelche) to 225° (SW Brisa Marina) +20 km/h
      simulatedReading = {
        ...currentReading,
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timeEpochMs: Date.now(),
        windDirectionDegrees: 225,
        windDirectionLabel: 'SW (Brisa Marina Suroeste)',
        windSpeedKmh: Math.max(35, currentReading.windSpeedKmh + 15),
        windGustKmh: Math.max(50, currentReading.windGustKmh + 22),
      };
    } else if (type === 'sudden_gust') {
      // Violent wind speed spike
      simulatedReading = {
        ...currentReading,
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timeEpochMs: Date.now(),
        windSpeedKmh: currentReading.windSpeedKmh + 18,
        windGustKmh: currentReading.windGustKmh + 28,
      };
    } else {
      // Extreme 180° wind reversal
      const newDeg = (currentReading.windDirectionDegrees + 180) % 360;
      simulatedReading = {
        ...currentReading,
        timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timeEpochMs: Date.now(),
        windDirectionDegrees: newDeg,
        windDirectionLabel: getWindDirectionLabelFromDegrees(newDeg),
        windSpeedKmh: currentReading.windSpeedKmh + 12,
        windGustKmh: currentReading.windGustKmh + 20,
      };
    }

    const event = analyzeWindShift(currentReading, simulatedReading, nearestStation, distanceToStationKm);
    if (event) {
      setRecentShiftEvents(prev => [event, ...prev.slice(0, 9)]);
      if (setActiveWindShiftAlert) {
        setActiveWindShiftAlert(event);
      }
      if (audioEnabled) {
        soundSystem.playWindShiftWarning();
      }
    }

    setCurrentReading(simulatedReading);
    setTelemetryHistory(prev => [simulatedReading, ...prev.slice(0, 14)]);
  };

  const activeAlert = activeWindShiftAlert || (recentShiftEvents.length > 0 && recentShiftEvents[0].severity === 'critica_extrema' ? recentShiftEvents[0] : null);

  // Compute direction delta with previous reading
  const previousReading = telemetryHistory.length > 1 ? telemetryHistory[1] : null;
  const liveDeltaDegrees = currentReading && previousReading
    ? calculateAngularDifferenceDegrees(previousReading.windDirectionDegrees, currentReading.windDirectionDegrees)
    : 0;
  const liveDeltaSpeed = currentReading && previousReading
    ? currentReading.windSpeedKmh - previousReading.windSpeedKmh
    : 0;

  return (
    <div className="space-y-6">
      {/* 🚨 ACTIVE SUDDEN WIND SHIFT EMERGENCY BANNER */}
      {activeAlert && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-zinc-950 border-2 border-red-500 shadow-2xl shadow-red-950/80 animate-pulse">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-950 shrink-0 mt-0.5">
                <ShieldAlert className="w-7 h-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
                    ALERTA TÁCTICA: CAMBIO BRUSCO DE VIENTO
                  </span>
                  <span className="text-xs font-mono text-zinc-300">
                    Detectado: {activeAlert.detectedAt} por {activeAlert.station.name}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {activeAlert.shiftDescription}
                </h3>
                <p className="text-xs text-red-200 leading-relaxed font-medium max-w-3xl">
                  {activeAlert.tacticalImplication}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => soundSystem.playWindShiftWarning()}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-lg text-xs font-bold border border-red-700 transition-colors cursor-pointer"
                title="Hacer sonar bocina de alerta por giro"
              >
                <Volume2 className="w-4 h-4" />
                <span>Sonar Alerta</span>
              </button>
              <button
                onClick={() => {
                  if (setActiveWindShiftAlert) setActiveWindShiftAlert(null);
                }}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                Descartar Alerta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP CONTROLLER & NEAREST STATION BANNER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
                <Wind className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </span>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  MONITOR DE GIROS & CAMBIOS BRUSCOS DE VIENTO
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-700 font-bold uppercase">
                    GPS & RED METEOROLÓGICA
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Rastrea tu posición mediante la API de geolocalización y vigila la estación meteorológica más cercana para alertar giros de viento que puedan atrapar a las cuadrillas de Bomberos.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons: GPS, Audio, Push Notifications */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => (isGpsActive ? stopGpsWatch() : startGpsWatch())}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isGpsActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/60 border border-blue-400'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
            >
              <Crosshair className={`w-4 h-4 ${isGpsActive ? 'animate-spin' : ''}`} />
              <span>{isGpsActive ? 'GPS Activo (Rastreo Continuo)' : 'Activar GPS del Dispositivo'}</span>
            </button>

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                audioEnabled
                  ? 'bg-zinc-800 border-zinc-700 text-orange-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500'
              }`}
              title="Sonido de alarma al detectar giro brusco"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{audioEnabled ? 'Alarma ON' : 'Silencio'}</span>
            </button>

            <button
              onClick={requestNotificationPermission}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                notificationsEnabled
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Notificaciones push del navegador para alertas en segundo plano"
            >
              {notificationsEnabled ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4" />}
              <span>{notificationsEnabled ? 'Notif. Push ON' : 'Activar Notif. Push'}</span>
            </button>

            <button
              onClick={fetchStationTelemetry}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
              <span>{isLoading ? 'Verificando...' : 'Verificar'}</span>
            </button>
          </div>
        </div>

        {/* GPS Info & Station Selector Row */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: Device Position & Nearest Station Discovery */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-400" />
                ESTACIÓN MÁS CERCANA A TU DISPOSITIVO:
              </span>
              <span className="font-mono text-xs text-orange-400 font-bold bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800">
                A {distanceToStationKm} km de tu ubicación
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">{nearestStation.name}</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {nearestStation.description}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400 border-t border-zinc-900">
              <span>Código: <strong className="text-zinc-200">{nearestStation.code}</strong></span>
              <span>·</span>
              <span>Red: <strong className="text-zinc-200">{nearestStation.organization}</strong></span>
              <span>·</span>
              <span>Altitud: <strong className="text-zinc-200">{nearestStation.altitudeMeters} m.s.n.m.</strong></span>
              {deviceCoords && (
                <>
                  <span>·</span>
                  <span className="text-blue-400">GPS: ±{deviceCoords.accuracy}m</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Station Selector & Monitoring Controls */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">
                Selección de Estación Meteorológica Objetivo:
              </label>
              <select
                value={selectedStationOverride}
                onChange={handleStationSelect}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-xs"
              >
                <option value="auto">📡 Detección Automática por GPS (La más cercana)</option>
                {OFFICIAL_WEATHER_STATIONS.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} — {st.commune} ({st.organization})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Frecuencia de Muestreo:</span>
              <div className="flex items-center gap-1.5 font-mono">
                {[15, 30, 60].map(s => (
                  <button
                    key={s}
                    onClick={() => setPollIntervalSecs(s)}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      pollIntervalSecs === s
                        ? 'bg-orange-500/20 border-orange-500 text-orange-200 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              El algoritmo compara variaciones angulares &ge; 45° o aumentos de velocidad &ge; 12 km/h para gatillar alerta inmediata.
            </p>
          </div>
        </div>
      </div>

      {/* CURRENT WIND VECTOR & WIND ROSE GAUGES */}
      {currentReading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Live Compass / Wind Rose Indicator */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-between space-y-4">
            <div className="w-full flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-orange-400" />
                VECTOR DE VIENTO EN ESTACIÓN
              </span>
              <span className="font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                {currentReading.windDirectionDegrees}°
              </span>
            </div>

            {/* Visual Compass Graphic */}
            <div className="relative w-48 h-48 rounded-full border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center shrink-0 shadow-inner my-2">
              <span className="absolute top-2 text-[11px] font-bold text-zinc-400">N</span>
              <span className="absolute right-2 text-[11px] font-bold text-orange-400">E (Puelche)</span>
              <span className="absolute bottom-2 text-[11px] font-bold text-zinc-400">S</span>
              <span className="absolute left-2 text-[11px] font-bold text-blue-400">W (Costa)</span>

              {/* Grid crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-zinc-800" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-px bg-zinc-800" />
              </div>

              {/* Previous Direction Ghost Needle (if delta exists) */}
              {previousReading && liveDeltaDegrees > 10 && (
                <div
                  className="absolute w-1.5 h-20 transition-transform duration-500 origin-bottom opacity-40"
                  style={{
                    transform: `translateY(-50%) rotate(${previousReading.windDirectionDegrees}deg)`,
                  }}
                  title={`Dirección anterior: ${previousReading.windDirectionDegrees}°`}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[14px] border-b-zinc-400 mx-auto" />
                  <div className="w-1 h-16 bg-zinc-400 mx-auto" />
                </div>
              )}

              {/* Active Current Wind Direction Needle */}
              <div
                className="absolute w-2 h-24 transition-transform duration-700 origin-bottom"
                style={{
                  transform: `translateY(-50%) rotate(${currentReading.windDirectionDegrees}deg)`,
                }}
              >
                <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[22px] border-b-orange-500 mx-auto drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                <div className="w-1 h-18 bg-orange-500 mx-auto" />
              </div>

              {/* Center Pivot */}
              <div className="w-5 h-5 rounded-full bg-zinc-200 border-2 border-zinc-950 z-10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
              </div>
            </div>

            <div className="text-center space-y-0.5">
              <span className="text-sm font-black text-white block">
                {currentReading.windDirectionLabel}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {currentReading.windDirectionDegrees}° desde el norte magnético
              </span>
            </div>
          </div>

          {/* 2. Live Speed, Gusts & Delta Shifts */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                VELOCIDAD & RACHAS EN VIVO
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Último reporte: {currentReading.timestamp}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Wind Speed */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[11px] font-mono text-zinc-400">VELOCIDAD SOSTENIDA:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-white">
                    {currentReading.windSpeedKmh}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">km/h</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  {(currentReading.windSpeedKmh / 3.6).toFixed(1)} m/s · {(currentReading.windSpeedKmh / 1.852).toFixed(1)} nudos
                </div>
              </div>

              {/* Gusts */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                <span className="text-[11px] font-mono text-zinc-400">RACHAS MÁXIMAS:</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black font-mono ${
                    currentReading.windGustKmh >= 40 ? 'text-red-400' : 'text-orange-400'
                  }`}>
                    {currentReading.windGustKmh}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">km/h</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  {currentReading.windGustKmh >= 40 ? '⚠️ Racha Crítica Pavesas' : 'Moderada'}
                </div>
              </div>
            </div>

            {/* Delta vs previous reading */}
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold">Variación Angular (Giro):</span>
                <span className={`font-mono font-bold ${liveDeltaDegrees >= 45 ? 'text-red-400' : liveDeltaDegrees >= 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {liveDeltaDegrees}° {liveDeltaDegrees >= 45 ? '🚨 GIRO BRUSCO' : 'Normal'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold">Variación de Velocidad:</span>
                <span className={`font-mono font-bold ${liveDeltaSpeed >= 12 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {liveDeltaSpeed >= 0 ? `+${liveDeltaSpeed}` : liveDeltaSpeed} km/h
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-800">
              <span>Temp: <strong className="text-zinc-200">{currentReading.temperatureC}°C</strong></span>
              <span>·</span>
              <span>HR: <strong className="text-zinc-200">{currentReading.humidityPercent}%</strong></span>
              <span>·</span>
              <span>Muestreo: <strong className="text-zinc-200">{pollIntervalSecs}s</strong></span>
            </div>
          </div>

          {/* 3. Emergency Tactical Simulator & Protocols */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  SIMULACRO & PRÁCTICA DE REPLIEGUE
                </span>
                <span className="text-[10px] font-mono text-zinc-500">ENTRENAMIENTO</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Para entrenar a las cuadrillas de Sexta Menque en respuesta a giros violentos de viento antes de que ocurran en un incendio real:
              </p>

              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => handleSimulateWindShift('puelche_to_sea')}
                  className="w-full text-left p-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500 text-zinc-200 transition-colors cursor-pointer"
                >
                  <strong className="text-orange-400 block text-xs">1. Simular Giro Puelche &rarr; Brisa Marina SW</strong>
                  <span className="text-[10px] text-zinc-400">Giro vespertino violento de 135° con entrada de racha marítima costera.</span>
                </button>

                <button
                  onClick={() => handleSimulateWindShift('sudden_gust')}
                  className="w-full text-left p-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500 text-zinc-200 transition-colors cursor-pointer"
                >
                  <strong className="text-red-400 block text-xs">2. Simular Aceleración Violenta (+18 km/h)</strong>
                  <span className="text-[10px] text-zinc-400">Racha súbita por colapso de columna convectiva o viento de ladera.</span>
                </button>

                <button
                  onClick={() => handleSimulateWindShift('extreme_shear')}
                  className="w-full text-left p-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500 text-zinc-200 transition-colors cursor-pointer"
                >
                  <strong className="text-rose-400 block text-xs">3. Simular Inversión Total 180° (Viento En Contra)</strong>
                  <span className="text-[10px] text-zinc-400">Fuego se devuelve de cabeza hacia las líneas de escape.</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-800/60 text-[11px] text-orange-200 leading-relaxed">
              <strong>PROTOCOLO SEXTA MENQUE:</strong> Ante giro &ge; 45°, el Vigía OCEL debe emitir por Canal 3 VHF: <em>"¡Atención cuadrillas Menque, viento giró a [rumbo]! Suspender combate en flanco y replegar a Zona Segura."</em>
            </div>
          </div>
        </div>
      )}

      {/* TELEMETRY READINGS SLIDING LOG TABLE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white">
              HISTORIAL DE MUESTREO DE LA ESTACIÓN ({nearestStation.name})
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Últimas {telemetryHistory.length} lecturas guardadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[11px]">
                <th className="pb-2">HORA</th>
                <th className="pb-2">DIRECCIÓN</th>
                <th className="pb-2">GRADOS</th>
                <th className="pb-2">VELOCIDAD</th>
                <th className="pb-2">RACHAS</th>
                <th className="pb-2">TEMP / HR</th>
                <th className="pb-2 text-right">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {telemetryHistory.map((item, idx) => {
                const prev = idx < telemetryHistory.length - 1 ? telemetryHistory[idx + 1] : null;
                const degDiff = prev ? calculateAngularDifferenceDegrees(prev.windDirectionDegrees, item.windDirectionDegrees) : 0;
                const isShift = degDiff >= 45 || (prev && item.windSpeedKmh - prev.windSpeedKmh >= 12);

                return (
                  <tr key={`${item.timeEpochMs}-${idx}`} className={idx === 0 ? 'text-white font-bold bg-zinc-950/40' : 'text-zinc-400'}>
                    <td className="py-2.5">{item.timestamp}</td>
                    <td className="py-2.5 font-sans font-semibold text-zinc-200">{item.windDirectionLabel}</td>
                    <td className="py-2.5">
                      {item.windDirectionDegrees}°
                      {degDiff > 0 && (
                        <span className={`ml-1.5 text-[10px] ${degDiff >= 45 ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                          ({degDiff >= 0 ? `Δ${degDiff}°` : ''})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-zinc-200">{item.windSpeedKmh} km/h</td>
                    <td className="py-2.5 text-orange-400">{item.windGustKmh} km/h</td>
                    <td className="py-2.5 text-zinc-400">{item.temperatureC}°C · {item.humidityPercent}%</td>
                    <td className="py-2.5 text-right">
                      {isShift ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 animate-pulse">
                          GIRO BRUSCO
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-[10px]">Estable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
