export type FirefighterRank = 
  | 'Director'
  | 'Capitán'
  | 'Teniente 1° y Maquinista'
  | 'Teniente 1°'
  | 'Teniente 2°'
  | 'Teniente 3°'
  | 'Teniente de Máquinas'
  | 'Maquinista'
  | 'Secretaria'
  | 'Tesorero'
  | 'Ayudante de Compañía'
  | 'Ayudante'
  | 'Voluntario Honorario'
  | 'Bombero Activo'
  | 'Aspirante / Reserva';

export type TacticalRole = 
  | 'Director de Compañía'
  | 'Oficial de Seguridad'
  | 'Teniente 1° y Maquinista'
  | 'Teniente de Máquinas'
  | 'Maquinista Conductor'
  | 'Secretaría y Registro Operacional'
  | 'Tesorería y Logística'
  | 'Ayudante de Compañía'
  | 'Pitonero de Cabeza'
  | 'Pitonero de Flanco'
  | 'Operador Motobomba'
  | 'Línea de Rastrillo / Batifuego'
  | 'Vigía / Observador OCEL'
  | 'Conductor de Carro'
  | 'Comunicaciones y Triage';

export type FatigueLevel = 1 | 2 | 3 | 4 | 5; // 1=Fresco, 5=Agotamiento extremo

export interface Firefighter {
  id: string;
  name: string;
  rutOrRecord: string;
  companyNumber?: string; // e.g., '101', '102'
  regNacional?: string; // e.g., 'REG-235'
  anbLevel?: 'Operativo' | 'Inicial';
  bloodType?: string; // e.g., 'A Rhesus +'
  emergencyPhone?: string; // e.g., '+56978483227'
  yearsOfService?: number;
  rank: FirefighterRank;
  role: TacticalRole;
  assignedUnit: string; // e.g., 'B-6', 'B-1 Forestal', 'BF-2', 'Z-1'
  status: 'en_linea' | 'zona_segura' | 'en_descanso' | 'cuartel' | 'evacuando';
  eppComplete: {
    cascoForestal: boolean;
    esclavinaIgnifuga: boolean;
    antiparrasHumo: boolean;
    trajeNomex: boolean;
    botasForestales: boolean;
    guantesCuero: boolean;
    mochilaAgua: boolean;
    fireShelterRefugio: boolean;
  };
  minutesOnLine: number;
  waterIntakeLiters: number;
  fatigueScore: FatigueLevel;
  heatStressSymptoms: string[]; // e.g. 'Calambres', 'Cefalea', 'Mareos', 'Náuseas'
  parConfirmed: boolean;
  lastCheckinTime: string;
}

export interface InventoryItem {
  id: string;
  cod: string;
  desc: string;
  cat: string;
  ubi: string;
  stock: number;
  min: number;
  estado: string;
  resp?: string;
}

export interface UnitApparatus {
  id: string;
  callsign: string; // e.g., 'B-6', 'BF-2', 'Z-1'
  name: string;
  type: 'Forestal 4x4' | 'Ataque Rápido' | 'Aljibe Abastecimiento' | 'Transporte Personal' | 'Comandancia K-1' | 'Bomba Estructural';
  brandModel?: string; // e.g., 'Renault M 180 (1993)'
  patent?: string; // e.g., 'AB-CD-12'
  year?: string;
  motorNumber?: string;
  chassisNumber?: string;
  waterCapacityLiters: number;
  waterCurrentLiters: number;
  fuelPercent: number;
  pumpStatus: 'operativa' | 'en_bombeo' | 'falla' | 'sin_agua';
  driverName: string;
  crewCount: number;
  radioChannel: string;
  missingEquipmentAlerts?: string[];
  techRevisionDue?: string;
  soapDue?: string;
}

export interface EscapeRoute {
  id: string;
  name: string;
  description: string;
  status: 'despejada' | 'humo_denso' | 'bloqueada_por_fuego' | 'en_evaluacion';
  timeToSafetyMinutes: number;
  terrainType: 'camino_vehicular' | 'sendero_matorral' | 'quebrada' | 'cortafuego';
}

export interface SafetyZone {
  id: string;
  name: string;
  locationDetails: string;
  type: 'area_quemada_negra' | 'cancha_deportiva' | 'tranque_abierto' | 'camino_ancho' | 'claro_sin_vegetacion';
  maxCapacityPersons: number;
  separationDistanceMeters: number;
  status: 'activa' | 'saturada' | 'comprometida';
}

export interface OcelState {
  lookout: {
    assigned: boolean;
    lookoutName: string;
    vantagePoint: string;
    visibility: 'excelente' | 'moderada' | 'humo_denso' | 'nula';
    lastRadioPingMinutesAgo: number;
  };
  communications: {
    primaryChannel: string; // e.g. 'Canal 3 VHF Táctico Forestal'
    secondaryChannel: string; // e.g. 'Canal 1 Comandancia Nacional'
    signalStrength: 'optima' | 'regular' | 'debil' | 'sin_cobertura';
    conafLiaisonActive: boolean;
    lastRollCallTime: string;
  };
  escapeRoutes: EscapeRoute[];
  safetyZones: SafetyZone[];
}

export interface WeatherCondition {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDegrees: number; // 0-360
  windDirectionLabel: string; // 'SW', 'E (Puelche)', etc.
  localWindType: 'Normal' | 'Puelche / Raco (Cálido y Seco)' | 'Brisa Marina Suroeste' | 'Terral Valle';
  selectedRegion: string;
  selectedComuna: string;
  fuelType: 'pino_eucalipto' | 'matorral_esclerofilo' | 'pastizal_seco' | 'interfaz_urbana';
  fuelMoisture: 'muy_seco_critico' | 'seco' | 'humedo';
  slopePercent: number; // 0 - 100%
}

export interface MaydayIncident {
  active: boolean;
  timestamp: string;
  unit: string;
  location: string;
  personnelCount: number;
  names: string;
  airAndSituation: string;
  resourcesNeeded: string;
  shelterDeploymentOrdered: boolean;
  resolved: boolean;
}

export interface PreDispatchItem {
  id: string;
  category: 'epp' | 'mecanico' | 'herramientas' | 'sanitario_hidratacion';
  title: string;
  critical: boolean;
  checked: boolean;
}

export type CatastropheType = 
  | 'sismo' 
  | 'erupcion_volcanica' 
  | 'altas_temperaturas' 
  | 'bajas_temperaturas' 
  | 'tromba_marina' 
  | 'tornado' 
  | 'derrumbe' 
  | 'viento_puelche' 
  | 'incendio_forestal' 
  | 'tsunami' 
  | 'aluvion_inundacion';

export type AlertSeverity = 'alerta_roja' | 'alerta_amarilla' | 'alerta_temprana_preventiva' | 'alerta_tecnica_informativa';

export interface CatastropheAlert {
  id: string;
  type: CatastropheType;
  title: string;
  severity: AlertSeverity;
  status: 'activa' | 'en_desarrollo' | 'monitoreo' | 'finalizada';
  affectedZones: string; // Sectores afectados, ej: 'Menque, Tomé, Rafael, Costa de Cocholgüe'
  issuedAt: string; // Timestamp o fecha de emisión
  source: string; // Entidad emisora: 'SENAPRED Biobío', 'DMC', 'CSN Univ. Chile', 'SERNAGEOMIN'
  description: string;
  keyRisks: string[]; // Riesgos primarios para la población y voluntarios
  firefighterProtocols: string[]; // Instrucciones y protocolos específicos para los voluntarios y carros de 6ta Cía Menque
  equipmentRequired: string[]; // Material mayor o menor requerido (e.g. Motosierras, EPP N95 ceniza, Bombas achique, Cuerdas)
  assignedUnits: string[]; // Unidades asignadas (e.g. ['B-6', 'BF-6'])
  notes?: string;
}
