import { WeatherCondition } from '../types/wildfire';

export interface FireRiskAnalysis {
  is303030Alert: boolean;
  tempViolated: boolean;
  humidityViolated: boolean;
  windViolated: boolean;
  dangerScore: number; // 0 to 100
  dangerCategory: 'BAJO' | 'MODERADO' | 'ALTO' | 'EXTREMO - ALERTA ROJA';
  estimatedFlameLengthMeters: number;
  tacticalRecommendation: string;
  tacticalActionClass: 'safe_direct' | 'water_direct' | 'indirect_only' | 'immediate_retreat';
  spottingRisk: 'Bajo' | 'Medio' | 'Alto (Pavesas >500m)' | 'Crítico (Pavesas >1.5km)';
  hydrationTargetLitersPerHour: number;
  maxRecommendedWorkIntervalMinutes: number;
}

export function evaluateFireConditions(weather: WeatherCondition): FireRiskAnalysis {
  const tempViolated = weather.temperatureC >= 30;
  const humidityViolated = weather.humidityPercent <= 30;
  const windViolated = weather.windSpeedKmh >= 30;
  const is303030Alert = tempViolated && humidityViolated && windViolated;

  // Base score from weather
  let score = 0;
  // Temp contribution: 0-35 pts
  score += Math.min(35, Math.max(0, (weather.temperatureC - 15) * 1.5));
  
  // Humidity contribution (lower humidity = higher score): 0-35 pts
  score += Math.min(35, Math.max(0, (60 - weather.humidityPercent) * 0.75));

  // Wind contribution: 0-30 pts
  score += Math.min(30, (weather.windSpeedKmh / 50) * 30);

  // Puelche or local wind multiplier
  if (weather.localWindType.includes('Puelche') || weather.localWindType.includes('Raco')) {
    score += 15;
  }

  // Slope effect: slope increases fire spread exponentially up-slope
  if (weather.slopePercent > 30) {
    score += 10;
  }

  // Fuel multiplier
  let fuelMultiplier = 1.0;
  if (weather.fuelType === 'pino_eucalipto') fuelMultiplier = 1.45; // Resinous, intense embers
  if (weather.fuelType === 'matorral_esclerofilo') fuelMultiplier = 1.25; // Dense chaparral, espino
  if (weather.fuelType === 'interfaz_urbana') fuelMultiplier = 1.6; // Homes + dry vegetation
  if (weather.fuelType === 'pastizal_seco') fuelMultiplier = 1.1; // Fast run, lower flame height

  const normalizedScore = Math.min(100, Math.round(score * fuelMultiplier * 0.7));

  // Flame length calculation (empirical estimation adapted for Chilean fuels)
  // Base flame length
  let flameLength = 0.8;
  if (weather.fuelType === 'pastizal_seco') {
    flameLength = 0.5 + (weather.windSpeedKmh * 0.04);
  } else if (weather.fuelType === 'matorral_esclerofilo') {
    flameLength = 1.2 + (weather.windSpeedKmh * 0.07) + (weather.slopePercent * 0.02);
  } else if (weather.fuelType === 'pino_eucalipto') {
    flameLength = 2.0 + (weather.windSpeedKmh * 0.12) + (weather.slopePercent * 0.03);
  } else {
    flameLength = 1.5 + (weather.windSpeedKmh * 0.08);
  }

  if (weather.fuelMoisture === 'muy_seco_critico') {
    flameLength *= 1.35;
  }

  const roundedFlame = Math.round(flameLength * 10) / 10;

  // Determine tactical category
  let dangerCategory: FireRiskAnalysis['dangerCategory'] = 'BAJO';
  if (normalizedScore > 80 || is303030Alert || roundedFlame > 3.0) {
    dangerCategory = 'EXTREMO - ALERTA ROJA';
  } else if (normalizedScore > 60 || roundedFlame > 1.8) {
    dangerCategory = 'ALTO';
  } else if (normalizedScore > 35) {
    dangerCategory = 'MODERADO';
  }

  // Determine tactical recommendation based on flame length and Chilean SOPs
  let tacticalRecommendation = '';
  let tacticalActionClass: FireRiskAnalysis['tacticalActionClass'] = 'safe_direct';
  let maxInterval = 60;
  let hydration = 0.75;

  if (roundedFlame < 1.2) {
    tacticalActionClass = 'safe_direct';
    tacticalRecommendation = 'Ataque directo seguro con herramientas manuales (Pulaski, McLeod, mochilas de agua). El personal puede trabajar en el borde mismo de la llama.';
    maxInterval = 60;
    hydration = 0.75;
  } else if (roundedFlame <= 2.5) {
    tacticalActionClass = 'water_direct';
    tacticalRecommendation = 'Ataque directo con chorros de agua y carros bombas forestales (B-1/BF-2). El calor radiante supera el umbral seguro para trabajo manual directo sin agua continua.';
    maxInterval = 45;
    hydration = 1.0;
  } else if (roundedFlame <= 3.5) {
    tacticalActionClass = 'indirect_only';
    tacticalRecommendation = 'Ataque indirecto estricto. Prohibido entrar a la cabeza del fuego. Construir líneas de control ensanchadas y coordinar descargas aéreas (CONAF / Bomberos).';
    maxInterval = 35;
    hydration = 1.25;
  } else {
    tacticalActionClass = 'immediate_retreat';
    tacticalRecommendation = '¡PELIGRO DE ATRAPAMIENTO Y MUERTE! Fuego de copas explosivo y pavesas a gran distancia. Ordenar REPLIEGUE INMEDIATO a Zona de Seguridad. Refugios contra fuego (Fire Shelters) preparados.';
    maxInterval = 25;
    hydration = 1.5;
  }

  // Spotting risk
  let spottingRisk: FireRiskAnalysis['spottingRisk'] = 'Bajo';
  if (weather.windSpeedKmh > 35 && weather.fuelType === 'pino_eucalipto') {
    spottingRisk = 'Crítico (Pavesas >1.5km)';
  } else if (weather.windSpeedKmh > 25 || weather.fuelType === 'pino_eucalipto') {
    spottingRisk = 'Alto (Pavesas >500m)';
  } else if (weather.windSpeedKmh > 18) {
    spottingRisk = 'Medio';
  }

  return {
    is303030Alert,
    tempViolated,
    humidityViolated,
    windViolated,
    dangerScore: normalizedScore,
    dangerCategory,
    estimatedFlameLengthMeters: roundedFlame,
    tacticalRecommendation,
    tacticalActionClass,
    spottingRisk,
    hydrationTargetLitersPerHour: hydration,
    maxRecommendedWorkIntervalMinutes: maxInterval
  };
}

export const CHILEAN_COMMUNAL_PRESETS: Array<{
  name: string;
  region: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  windLabel: string;
  localWind: WeatherCondition['localWindType'];
  fuel: WeatherCondition['fuelType'];
  slope: number;
}> = [
  {
    name: 'Tomé (Menque / El Mirador / Ranguelmo)',
    region: 'Región del Biobío',
    temp: 34,
    humidity: 21,
    windSpeed: 35,
    windDir: 90,
    windLabel: 'E (Puelche)',
    localWind: 'Puelche / Raco (Cálido y Seco)',
    fuel: 'pino_eucalipto',
    slope: 35
  },
  {
    name: 'Valparaíso (Peñuelas / Lago)',
    region: 'Región de Valparaíso',
    temp: 32,
    humidity: 22,
    windSpeed: 34,
    windDir: 210,
    windLabel: 'SSW',
    localWind: 'Brisa Marina Suroeste',
    fuel: 'pino_eucalipto',
    slope: 35
  },
  {
    name: 'Quilpué / Villa Alemana',
    region: 'Región de Valparaíso',
    temp: 34,
    humidity: 19,
    windSpeed: 32,
    windDir: 90,
    windLabel: 'E',
    localWind: 'Puelche / Raco (Cálido y Seco)',
    fuel: 'interfaz_urbana',
    slope: 40
  },
  {
    name: 'Melipilla / San Pedro',
    region: 'Región Metropolitana',
    temp: 36,
    humidity: 18,
    windSpeed: 28,
    windDir: 120,
    windLabel: 'SE',
    localWind: 'Puelche / Raco (Cálido y Seco)',
    fuel: 'matorral_esclerofilo',
    slope: 25
  },
  {
    name: 'Santa Juana / Florida',
    region: 'Región del Biobío',
    temp: 35,
    humidity: 21,
    windSpeed: 38,
    windDir: 100,
    windLabel: 'ESE',
    localWind: 'Puelche / Raco (Cálido y Seco)',
    fuel: 'pino_eucalipto',
    slope: 45
  },
  {
    name: 'Empedrado / Constitución',
    region: 'Región del Maule',
    temp: 33,
    humidity: 25,
    windSpeed: 31,
    windDir: 80,
    windLabel: 'ENE',
    localWind: 'Puelche / Raco (Cálido y Seco)',
    fuel: 'pino_eucalipto',
    slope: 30
  },
  {
    name: 'Collipulli / Galvarino',
    region: 'Región de La Araucanía',
    temp: 31,
    humidity: 26,
    windSpeed: 29,
    windDir: 95,
    windLabel: 'E',
    localWind: 'Puelche / Raco (Cálido y Seco)',
    fuel: 'pastizal_seco',
    slope: 20
  }
];
