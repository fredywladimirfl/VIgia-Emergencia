/**
 * Servicio de Telemetría en Tiempo Real para Bomberos de Chile
 * Obtiene datos atmosféricos en vivo vía Open-Meteo API sin necesidad de keys,
 * con soporte para GPS del dispositivo o selección de zonas de la Comuna de Tomé y Biobío.
 */

export interface TacticalZone {
  id: string;
  name: string;
  shortName: string;
  commune: string;
  region: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  description: string;
  fuelTypeDefault: 'pino_eucalipto' | 'matorral_esclerofilo' | 'pastizal_seco' | 'interfaz_urbana';
  isFireStation?: boolean;
}

export const TOME_BIOBIO_TACTICAL_ZONES: TacticalZone[] = [
  {
    id: 'menque-cuartel',
    name: 'Cuartel Sexta Menque (Base Operacional)',
    shortName: 'Menque Cuartel',
    commune: 'Tomé',
    region: 'Región del Biobío',
    latitude: -36.6583,
    longitude: -72.8833,
    altitudeMeters: 140,
    description: 'Cuartel General 6ta Compañía Menque, Ruta O-252. Base de Carro B-6 y telecomunicaciones.',
    fuelTypeDefault: 'interfaz_urbana',
    isFireStation: true,
  },
  {
    id: 'cuesta-menque',
    name: 'Cuesta Menque / Curva La Mula',
    shortName: 'Cuesta Menque',
    commune: 'Tomé',
    region: 'Región del Biobío',
    latitude: -36.6450,
    longitude: -72.8910,
    altitudeMeters: 260,
    description: 'Zona de alta pendiente forestal con plantaciones densas de pino y eucalipto. Fuerte exposición al viento puelche.',
    fuelTypeDefault: 'pino_eucalipto',
  },
  {
    id: 'rafael',
    name: 'Sector Rural Rafael / Ruta N-48-O',
    shortName: 'Rafael',
    commune: 'Tomé',
    region: 'Región del Biobío',
    latitude: -36.6341,
    longitude: -72.7989,
    altitudeMeters: 95,
    description: 'Valle interior con pastizales secos de secano, viñedos patrimoniales e interfaz con viviendas dispersas.',
    fuelTypeDefault: 'pastizal_seco',
  },
  {
    id: 'dichato-costero',
    name: 'Dichato / Bahía & Humedal Villarrica',
    shortName: 'Dichato Costero',
    commune: 'Tomé',
    region: 'Región del Biobío',
    latitude: -36.5540,
    longitude: -72.9340,
    altitudeMeters: 8,
    description: 'Borde costero con fuerte entrada de brisa marina vespertina del SW, riesgo de trombas y tsunamis.',
    fuelTypeDefault: 'interfaz_urbana',
  },
  {
    id: 'tome-centro',
    name: 'Tomé Centro / Cuartel General CB Tomé',
    shortName: 'Tomé Centro',
    commune: 'Tomé',
    region: 'Región del Biobío',
    latitude: -36.6175,
    longitude: -72.9567,
    altitudeMeters: 15,
    description: 'Casco urbano e interfaz cerros (Cerro Alegre, Cerro La Pampa). Base de Comandancia y Central de Alarmas.',
    fuelTypeDefault: 'interfaz_urbana',
  },
  {
    id: 'cocholgue',
    name: 'Caleta Cocholgüe / Acantilados Norte',
    shortName: 'Cocholgüe',
    commune: 'Tomé',
    region: 'Región del Biobío',
    latitude: -36.5950,
    longitude: -72.9710,
    altitudeMeters: 35,
    description: 'Zona de riscos y quebradas marítimas con matorral costero y caminos estrechos de evacuación.',
    fuelTypeDefault: 'matorral_esclerofilo',
  },
  {
    id: 'coliumo',
    name: 'Península de Coliumo / Vegas de Coliumo',
    shortName: 'Coliumo',
    commune: 'Tomé',
    region: 'Región del Biobío',
    latitude: -36.5360,
    longitude: -72.9610,
    altitudeMeters: 22,
    description: 'Península con ruta única de acceso vehicular, vulnerable a aislamiento por cortes en ruta.',
    fuelTypeDefault: 'matorral_esclerofilo',
  },
  {
    id: 'quebrada-honda',
    name: 'Quebrada Honda / Límite Comunal Penco-Tomé',
    shortName: 'Quebrada Honda',
    commune: 'Tomé / Penco',
    region: 'Región del Biobío',
    latitude: -36.6800,
    longitude: -72.9800,
    altitudeMeters: 180,
    description: 'Corredor boscoso de pino con quebradas profundas y difícil acceso para carros aljibes Z.',
    fuelTypeDefault: 'pino_eucalipto',
  },
  {
    id: 'penco-lirquen',
    name: 'Penco / Lirquén Borde Costero',
    shortName: 'Penco / Lirquén',
    commune: 'Penco',
    region: 'Región del Biobío',
    latitude: -36.7350,
    longitude: -73.0010,
    altitudeMeters: 25,
    description: 'Zona de apoyo interinstitucional en interfaz Cerro Verde y Ruta 150.',
    fuelTypeDefault: 'interfaz_urbana',
  },
  {
    id: 'concepcion',
    name: 'Concepción Metropolitano / Nonguén',
    shortName: 'Concepción',
    commune: 'Concepción',
    region: 'Región del Biobío',
    latitude: -36.8270,
    longitude: -73.0503,
    altitudeMeters: 30,
    description: 'Referencia regional Biobío para despacho provincial y apoyo en catástrofes SENAPRED.',
    fuelTypeDefault: 'pino_eucalipto',
  },
];

export interface LiveTelemetryData {
  latitude: number;
  longitude: number;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDegrees: number;
  windDirectionLabel: string;
  surfacePressureHpa: number;
  timestamp: string;
  source: 'gps_live' | 'zone_preset' | 'cache_fallback';
  zoneName: string;
  distanceToCuartelKm: number;
  bearingToCuartelDeg: number;
}

/**
 * Convierte grados a etiqueta de dirección cardinal
 */
export function getWindDirectionLabelFromDegrees(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'N (Norte)';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE (Nororiente)';
  if (normalized >= 67.5 && normalized < 112.5) return 'E (Puelche / Cordillera)';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE (Suroriente / Puelche)';
  if (normalized >= 157.5 && normalized < 202.5) return 'S (Sur)';
  if (normalized >= 202.5 && normalized < 247.5) return 'SW (Brisa Marina Suroeste)';
  if (normalized >= 247.5 && normalized < 292.5) return 'W (Poniente / Costa)';
  return 'NW (Norponiente)';
}

/**
 * Fórmula de Haversine para calcular distancia entre dos coordenadas en km
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calcula el rumbo magnético / bearing inicial en grados desde punto 1 a punto 2
 */
export function calculateBearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((bearing + 360) % 360);
}

/**
 * Consulta la API de Open-Meteo en tiempo real para las coordenadas dadas
 */
export async function fetchLiveAtmosphericTelemetry(
  latitude: number,
  longitude: number,
  zoneName: string = 'Ubicación Actual',
  source: 'gps_live' | 'zone_preset' = 'zone_preset'
): Promise<LiveTelemetryData> {
  const cuartel = TOME_BIOBIO_TACTICAL_ZONES[0]; // Cuartel Menque
  const dist = calculateDistanceKm(latitude, longitude, cuartel.latitude, cuartel.longitude);
  const bearing = calculateBearingDeg(latitude, longitude, cuartel.latitude, cuartel.longitude);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&timezone=America%2FSantiago`;
    
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP error: ${response.status}`);
    }
    const data = await response.json();
    const cur = data.current;

    const temp = Math.round(cur.temperature_2m);
    const hum = Math.round(cur.relative_humidity_2m);
    const windSpeed = Math.round(cur.wind_speed_10m);
    const windGust = Math.round(cur.wind_gusts_10m || cur.wind_speed_10m * 1.35);
    const windDir = Math.round(cur.wind_direction_10m || 0);

    return {
      latitude,
      longitude,
      temperatureC: temp,
      humidityPercent: hum,
      windSpeedKmh: windSpeed,
      windGustKmh: windGust,
      windDirectionDegrees: windDir,
      windDirectionLabel: getWindDirectionLabelFromDegrees(windDir),
      surfacePressureHpa: Math.round(cur.surface_pressure || 1013),
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source,
      zoneName,
      distanceToCuartelKm: dist,
      bearingToCuartelDeg: bearing,
    };
  } catch (err) {
    console.warn('[Telemetry] Error fetching live Open-Meteo, using estimated telemetry:', err);
    // Graceful fallback values
    return {
      latitude,
      longitude,
      temperatureC: 28,
      humidityPercent: 29,
      windSpeedKmh: 32,
      windGustKmh: 45,
      windDirectionDegrees: 90,
      windDirectionLabel: 'E (Puelche / Cordillera)',
      surfacePressureHpa: 1012,
      timestamp: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source: 'cache_fallback',
      zoneName,
      distanceToCuartelKm: dist,
      bearingToCuartelDeg: bearing,
    };
  }
}
