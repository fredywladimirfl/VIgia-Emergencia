/**
 * Red de Estaciones Meteorológicas y Algoritmo de Detección de Giros Bruscos de Viento
 * para la Jurisdicción de Tomé, Menque y Región del Biobío / Bomberos de Chile.
 */

import { calculateDistanceKm, getWindDirectionLabelFromDegrees } from './realTimeWeather';

export interface WeatherStation {
  id: string;
  code: string;
  name: string;
  organization: 'DMC' | 'ARMADA' | 'INIA_AGROMET' | 'CORMA_FORESTAL' | 'SENAPRED';
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  commune: string;
  region: string;
  frequencyReportMins: number;
  description: string;
}

export const OFFICIAL_WEATHER_STATIONS: WeatherStation[] = [
  {
    id: 'st-menque',
    code: 'MET-MENQUE-6TA',
    name: 'Estación Menque Forestal & Comunal',
    organization: 'CORMA_FORESTAL',
    latitude: -36.6583,
    longitude: -72.8833,
    altitudeMeters: 140,
    commune: 'Tomé',
    region: 'Región del Biobío',
    frequencyReportMins: 5,
    description: 'Estación táctica en base Menque. Mide aceleración por topografía de quebrada y viento Puelche cordillerano.',
  },
  {
    id: 'st-tome-bellavista',
    code: 'DMC-TOME-01',
    name: 'Estación Automática Bellavista Tomé',
    organization: 'DMC',
    latitude: -36.6180,
    longitude: -72.9560,
    altitudeMeters: 25,
    commune: 'Tomé',
    region: 'Región del Biobío',
    frequencyReportMins: 10,
    description: 'Estación costera-urbana Tomé. Sensor ultrasónico de viento y radiación solar directa.',
  },
  {
    id: 'st-dichato',
    code: 'ARM-DICHATO-04',
    name: 'Estación Costera Capitanía de Puerto Dichato',
    organization: 'ARMADA',
    latitude: -36.5510,
    longitude: -72.9320,
    altitudeMeters: 12,
    commune: 'Tomé',
    region: 'Región del Biobío',
    frequencyReportMins: 10,
    description: 'Monitoreo de brisa marina SW, frentes de viento costero y trombas marinas en bahía de Dichato.',
  },
  {
    id: 'st-rafael',
    code: 'INIA-RAFAEL-08',
    name: 'Estación Agromet INIA Rafael',
    organization: 'INIA_AGROMET',
    latitude: -36.6340,
    longitude: -72.7980,
    altitudeMeters: 95,
    commune: 'Tomé',
    region: 'Región del Biobío',
    frequencyReportMins: 15,
    description: 'Secano interior. Registro de temperaturas extremas y viento cálido desde el valle del Itata.',
  },
  {
    id: 'st-punta-parra',
    code: 'DMC-PDP-12',
    name: 'Estación Punta de Parra - Lirquén',
    organization: 'DMC',
    latitude: -36.6850,
    longitude: -72.9820,
    altitudeMeters: 45,
    commune: 'Tomé / Penco',
    region: 'Región del Biobío',
    frequencyReportMins: 10,
    description: 'Borde costero sur de Tomé sobre acantilados. Vigilancia de canalización de viento en la bahía de Concepción.',
  },
  {
    id: 'st-carriel-sur',
    code: 'DMC-SCIE-85682',
    name: 'Estación Aeropuerto Carriel Sur (WMO 85682)',
    organization: 'DMC',
    latitude: -36.7728,
    longitude: -73.0631,
    altitudeMeters: 8,
    commune: 'Talcahuano / Concepción',
    region: 'Región del Biobío',
    frequencyReportMins: 10,
    description: 'Estación sinóptica principal oficial de la DMC y Aeronáutica Civil (DGAC) para la Región del Biobío.',
  },
  {
    id: 'st-quiriquina',
    code: 'ARM-QUIR-02',
    name: 'Faro Isla Quiriquina',
    organization: 'ARMADA',
    latitude: -36.6260,
    longitude: -73.0500,
    altitudeMeters: 60,
    commune: 'Talcahuano',
    region: 'Región del Biobío',
    frequencyReportMins: 10,
    description: 'Sensor marítimo de alta exposición a rachas oceánicas y giros vespertinos.',
  },
  {
    id: 'st-chillan',
    code: 'DMC-SCCH-85672',
    name: 'Estación Chillán - Bernardo O\'Higgins',
    organization: 'DMC',
    latitude: -36.5869,
    longitude: -72.0322,
    altitudeMeters: 150,
    commune: 'Chillán',
    region: 'Región de Ñuble',
    frequencyReportMins: 15,
    description: 'Referencia de vientos continentales secos y viento Puelche en secano interior.',
  },
];

export interface WindTelemetryReading {
  timestamp: string; // ISO string o local time
  timeEpochMs: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDegrees: number;
  windDirectionLabel: string;
  temperatureC: number;
  humidityPercent: number;
  stationId: string;
  stationName: string;
}

export type WindShiftSeverity = 'critica_extrema' | 'peligro_moderado' | 'aviso_preventivo' | 'estable';

export interface WindShiftEvent {
  id: string;
  detectedAt: string;
  severity: WindShiftSeverity;
  station: WeatherStation;
  distanceToStationKm: number;
  deltaDegrees: number; // Cambio angular en grados (0 - 180°)
  prevDirectionDegrees: number;
  newDirectionDegrees: number;
  prevDirectionLabel: string;
  newDirectionLabel: string;
  deltaSpeedKmh: number; // Aumento o variación de velocidad
  prevSpeedKmh: number;
  newSpeedKmh: number;
  prevGustKmh: number;
  newGustKmh: number;
  shiftDescription: string;
  tacticalImplication: string;
  evacuationRecommended: boolean;
}

/**
 * Encuentra la estación meteorológica más cercana a un par de coordenadas (GPS)
 */
export function findNearestWeatherStation(lat: number, lon: number): { station: WeatherStation; distanceKm: number } {
  let nearestStation = OFFICIAL_WEATHER_STATIONS[0];
  let minDistance = calculateDistanceKm(lat, lon, nearestStation.latitude, nearestStation.longitude);

  for (let i = 1; i < OFFICIAL_WEATHER_STATIONS.length; i++) {
    const dist = calculateDistanceKm(lat, lon, OFFICIAL_WEATHER_STATIONS[i].latitude, OFFICIAL_WEATHER_STATIONS[i].longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestStation = OFFICIAL_WEATHER_STATIONS[i];
    }
  }

  return {
    station: nearestStation,
    distanceKm: minDistance,
  };
}

/**
 * Calcula la diferencia angular mínima entre dos rumbos (0° a 180°)
 */
export function calculateAngularDifferenceDegrees(deg1: number, deg2: number): number {
  const diff = Math.abs(deg1 - deg2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Evalúa si entre una lectura previa y una lectura actual se produjo un cambio brusco
 */
export function analyzeWindShift(
  prev: WindTelemetryReading,
  current: WindTelemetryReading,
  station: WeatherStation,
  distanceToStationKm: number
): WindShiftEvent | null {
  const deltaDegrees = calculateAngularDifferenceDegrees(prev.windDirectionDegrees, current.windDirectionDegrees);
  const deltaSpeed = current.windSpeedKmh - prev.windSpeedKmh;
  const deltaGust = current.windGustKmh - prev.windGustKmh;

  const isExtremeDirectionShift = deltaDegrees >= 45; // Giro de más de 45° (ej: de Este Puelche a Suroeste)
  const isViolentSpeedSpike = deltaSpeed >= 12 || current.windGustKmh >= 40; // Aumento de más de 12 km/h o racha >= 40 km/h
  const isModerateShift = deltaDegrees >= 30 || deltaSpeed >= 8;

  if (!isExtremeDirectionShift && !isViolentSpeedSpike && !isModerateShift) {
    return null;
  }

  let severity: WindShiftSeverity = 'aviso_preventivo';
  let evacuationRecommended = false;
  let shiftDescription = '';
  let tacticalImplication = '';

  if (isExtremeDirectionShift && (current.windSpeedKmh >= 20 || deltaSpeed > 0)) {
    severity = 'critica_extrema';
    evacuationRecommended = true;
    shiftDescription = `GIRO BRUSCO DE VIENTO DE ${deltaDegrees}°: Cambió de ${prev.windDirectionLabel} (${prev.windDirectionDegrees}°) a ${current.windDirectionLabel} (${current.windDirectionDegrees}°).`;
    tacticalImplication = `¡PELIGRO INMEDIATO DE ATRAPAMIENTO! El flanco del incendio se transforma repentinamente en la nueva cabeza de fuego con avance violento. Las rutas de escape hacia barlovento pueden quedar bloqueadas por pavesas. ORDENAR REPLIEGUE A ZONAS SEGURAS.`;
  } else if (isViolentSpeedSpike) {
    severity = current.windGustKmh >= 45 ? 'critica_extrema' : 'peligro_moderado';
    evacuationRecommended = current.windGustKmh >= 45;
    shiftDescription = `RÁFAGA BRUSCA DE VIENTO: La velocidad aumentó +${deltaSpeed} km/h (actual ${current.windSpeedKmh} km/h) con rachas de ${current.windGustKmh} km/h.`;
    tacticalImplication = `Aumento drástico en la longitud de llama y generación masiva de pavesas a media y larga distancia (>200 metros). Despejar copa de árboles y detener ataque directo con herramientas manuales.`;
  } else {
    severity = 'peligro_moderado';
    shiftDescription = `VARIACIÓN SIGNIFICATIVA: Giro de ${deltaDegrees}° y variación de velocidad de ${deltaSpeed >= 0 ? `+${deltaSpeed}` : deltaSpeed} km/h.`;
    tacticalImplication = `Monitoreo estricto del Vigía OCEL. Evaluar reubicación de líneas de mangueras de 38mm y verificar anclajes en zona fría.`;
  }

  return {
    id: `wshift-${Date.now()}`,
    detectedAt: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    severity,
    station,
    distanceToStationKm,
    deltaDegrees,
    prevDirectionDegrees: prev.windDirectionDegrees,
    newDirectionDegrees: current.windDirectionDegrees,
    prevDirectionLabel: prev.windDirectionLabel,
    newDirectionLabel: current.windDirectionLabel,
    deltaSpeedKmh: deltaSpeed,
    prevSpeedKmh: prev.windSpeedKmh,
    newSpeedKmh: current.windSpeedKmh,
    prevGustKmh: prev.windGustKmh,
    newGustKmh: current.windGustKmh,
    shiftDescription,
    tacticalImplication,
    evacuationRecommended,
  };
}
