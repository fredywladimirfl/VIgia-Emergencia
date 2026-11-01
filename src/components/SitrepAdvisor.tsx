import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  ShieldAlert, 
  Sparkles, 
  Bot, 
  Download,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Firefighter, UnitApparatus, OcelState, WeatherCondition } from '../types/wildfire';
import { evaluateFireConditions } from '../utils/fireFormulas';

interface SitrepAdvisorProps {
  firefighters: Firefighter[];
  units: UnitApparatus[];
  ocel: OcelState;
  weather: WeatherCondition;
}

export const SitrepAdvisor: React.FC<SitrepAdvisorProps> = ({
  firefighters,
  units,
  ocel,
  weather,
}) => {
  const [copied, setCopied] = useState(false);
  const [incidentName, setIncidentName] = useState('Incendio Forestal Sector El Mirador / Quebrada Menque (Tomé)');
  const [incidentCode, setIncidentCode] = useState('10-0 (Incendio Forestal Declarado)');
  const [incidentPhase, setIncidentPhase] = useState<'combate_activo' | 'confinamiento' | 'controlado' | 'guardia_cenizas'>('combate_activo');
  const [threatToHomes, setThreatToHomes] = useState(true);
  const [estimatedHectares, setEstimatedHectares] = useState(14.5);
  const [conafBrigadeSupport, setConafBrigadeSupport] = useState('Brigada CONAF Biobío + Helicóptero Bambi Bucket');

  // AI / Expert Query State
  const [tacticalQuery, setTacticalQuery] = useState('');
  const [tacticalAdvice, setTacticalAdvice] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);

  const analysis = evaluateFireConditions(weather);
  const totalWaterInTanks = units.reduce((acc, u) => acc + u.waterCurrentLiters, 0);
  const deployedCrew = firefighters.filter(f => f.status === 'en_linea').length;

  const sitrepText = `========================================================
INFORME TÁCTICO SITREP - SEXTA COMPAÑÍA MENQUE
CUERPO DE BOMBEROS DE TOMÉ (REGIÓN DEL BIOBÍO)
CENTRAL DE ALARMAS & COMANDANCIA DE INCIDENTES
========================================================
FECHA/HORA: ${new Date().toLocaleDateString('es-CL')} - ${new Date().toLocaleTimeString('es-CL')}
INCIDENTE: ${incidentName}
CLAVE RADIAL: ${incidentCode}
COMUNA / REGIÓN: Tomé - Menque (${weather.selectedRegion})
FASE OPERACIONAL: ${incidentPhase.toUpperCase().replace(/_/g, ' ')}
SUPERFICIE AFECTADA: ${estimatedHectares} Hectáreas
AMENAZA A CASAS/INTERFAZ: ${threatToHomes ? 'SÍ (PRIORIDAD DEFENSIVA A ESTRUCTURAS)' : 'NO (COMBATE FORESTAL PURO)'}

CONDICIONES METEOROLÓGICAS (30-30-30):
• Temperatura: ${weather.temperatureC}°C ${analysis.tempViolated ? '(CRÍTICO ≥30°)' : ''}
• Humedad Relativa: ${weather.humidityPercent}% ${analysis.humidityViolated ? '(CRÍTICO ≤30%)' : ''}
• Viento: ${weather.windSpeedKmh} km/h con racha de ${weather.windGustKmh} km/h (${weather.windDirectionLabel})
• Régimen de Viento: ${weather.localWindType}
• Combustible Dominante: ${weather.fuelType.toUpperCase().replace(/_/g, ' ')}
• Longitud Estimada de Llama: ${analysis.estimatedFlameLengthMeters} metros
• Índice de Peligro: ${analysis.dangerScore}/100 (${analysis.dangerCategory})

PROTOCOLO OCEL (SEGURIDAD VITAL):
• O - Observador Vigía: ${ocel.lookout.lookoutName} en ${ocel.lookout.vantagePoint} (Contacto: hace ${ocel.lookout.lastRadioPingMinutesAgo} min)
• C - Comunicaciones: ${ocel.communications.primaryChannel}
• E - Rutas de Escape: ${ocel.escapeRoutes.filter(r => r.status === 'despejada').length} rutas expeditas de ${ocel.escapeRoutes.length} trazadas
• L - Zonas de Seguridad: ${ocel.safetyZones.map(z => z.name).join('; ')}

DOTACIÓN & RECURSOS EN COMBATE:
• Voluntarios en Terreno: ${deployedCrew} bomberos (100% EPP auditado)
• Unidades Móviles en Línea: ${units.map(u => `${u.callsign} (${u.waterCurrentLiters}L)`).join(', ')}
• Reserva Total de Agua en Carros: ${totalWaterInTanks.toLocaleString()} Litros
• Apoyo Inter-Agencias: ${conafBrigadeSupport}

ORDEN TÁCTICA DEL OFICIAL DE SEGURIDAD:
${analysis.tacticalRecommendation}
========================================================`;

  const handleCopySitrep = () => {
    navigator.clipboard.writeText(sitrepText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateAdvice = () => {
    setIsConsulting(true);
    setTimeout(() => {
      // Deterministic expert system reasoning tailored to Chilean wildfire conditions
      let advice = '';
      if (analysis.is303030Alert || weather.localWindType.includes('Puelche')) {
        advice = `🚨 EVALUACIÓN TÁCTICA DE SEGURIDAD:
1. CONDICIÓN CRÍTICA DE PROPAGACIÓN: La regla 30-30-30 o presencia de viento Puelche genera alta probabilidad de salto del fuego (pavesas) a distancias superiores a 500 metros sobre cortafuegos.
2. DISPOSICIÓN DEFENSIVA EN INTERFAZ: Si hay casas o estructuras en la línea de avance, ubique los carros B-1 y BF-2 en posición de escape (hacia adelante, no culata contra el fuego, con motores en marcha y aspersores de autoprotección listos).
3. CONTROL DE FATIGA VITAL: Rotación obligatoria cada ${analysis.maxRecommendedWorkIntervalMinutes} minutos. Mantener hidratación de al menos ${analysis.hydrationTargetLitersPerHour}L por hora.
4. PLAN DE REPLIEGUE: Si la longitud de llama supera los 2.5 metros, suspenda el combate directo y evacúe a la cuadrilla por la Ruta 1 hacia la Zona Segura Alfa (área negra fría).`;
      } else {
        advice = `✅ EVALUACIÓN TÁCTICA DE SEGURIDAD:
1. CONDICIONES CONTROLABLES: El viento y humedad permiten el avance con ataque directo apoyado por líneas de agua de 38mm y herramientas manuales (Pulaski/McLeod).
2. PROTOCOLO OCEL ACTIVO: Asegure mantener el vigía con radio abierta en todo momento y no trabaje nunca en quebradas cerradas sin línea de escape confirmada.
3. RIEGO DE BORDE Y LÍNEA FRÍA: Establezca una faja limpia de al menos 1.5 veces la altura del matorral para evitar rebrotes por raíces subterráneas.`;
      }
      setTacticalAdvice(advice);
      setIsConsulting(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tracking-tight">
                INFORME SITREP & ASESOR TÁCTICO DE SEGURIDAD
              </span>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                SITUATION REPORT
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Generación de informe estandarizado de incidentes para Comandancia del Cuerpo de Bomberos, Central de Alarmas y coordinación con CONAF / SENAPRED.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySitrep}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-lg"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡SITREP Copiado!' : 'Copiar para Transmisión Radial / WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* Incident Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-3 border-t border-zinc-800">
          <div>
            <label className="text-zinc-400 font-semibold block mb-1">Nombre del Incendio</label>
            <input
              type="text"
              value={incidentName}
              onChange={e => setIncidentName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 font-semibold block mb-1">Clave Radial Despacho</label>
            <select
              value={incidentCode}
              onChange={e => setIncidentCode(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
            >
              <option value="10-0 (Incendio Forestal Declarado)">10-0 (Incendio Forestal Declarado)</option>
              <option value="10-2 (Pastizal con Peligro de Propagación)">10-2 (Pastizal con Peligro de Propagación)</option>
              <option value="10-0-1 (Alarma General de Incendio)">10-0-1 (Alarma General de Incendio)</option>
              <option value="10-12 (Apoyo a Otro Cuerpo de Bomberos)">10-12 (Apoyo a Otro Cuerpo de Bomberos)</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 font-semibold block mb-1">Fase Operacional</label>
            <select
              value={incidentPhase}
              onChange={e => setIncidentPhase(e.target.value as typeof incidentPhase)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
            >
              <option value="combate_activo">Combate Ofensivo Activo</option>
              <option value="confinamiento">Fase de Confinamiento</option>
              <option value="controlado">Incendio Controlado</option>
              <option value="guardia_cenizas">Guardia de Cenizas / Liquidación</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 font-semibold block mb-1">Superficie Estimada (Ha)</label>
            <input
              type="number"
              step="0.5"
              value={estimatedHectares}
              onChange={e => setEstimatedHectares(parseFloat(e.target.value) || 1)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
            <input
              type="checkbox"
              checked={threatToHomes}
              onChange={e => setThreatToHomes(e.target.checked)}
              className="accent-red-500 w-4 h-4 rounded"
            />
            <span className="font-semibold text-white">
              Amenaza a viviendas o Interfaz Urbano-Forestal (Requiere priorizar defensa de estructuras)
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Apoyo CONAF:</span>
            <input
              type="text"
              value={conafBrigadeSupport}
              onChange={e => setConafBrigadeSupport(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs w-64"
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout: SITREP Preview & Tactical AI Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: SITREP Text Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span>TEXTO FORMATEADO DEL REPORTE SITREP</span>
            </h4>
            <span className="text-[11px] font-mono text-zinc-500">FORMATO RADIOTELEGRÁFICO</span>
          </div>

          <pre className="w-full h-[380px] bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
            {sitrepText}
          </pre>
        </div>

        {/* Right: Tactical Safety Advisor Engine */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-bold text-white">
                ASESOR TÁCTICO DE SEGURIDAD OPERACIONAL
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              MOTOR EXPERTO ACTIVO
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Analiza de forma continua el vector de viento actual ({weather.windSpeedKmh} km/h {weather.windDirectionLabel}), el tipo de vegetación ({weather.fuelType.replace(/_/g, ' ')}) y el tiempo en línea de la dotación para emitir recomendaciones de supervivencia.
          </p>

          <button
            onClick={handleGenerateAdvice}
            disabled={isConsulting}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-orange-400 font-bold text-xs rounded-lg border border-orange-500/40 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isConsulting ? 'Evaluando Matriz de Riesgo...' : 'Generar Dictamen de Seguridad para el Frente'}</span>
          </button>

          {tacticalAdvice && (
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 space-y-2 whitespace-pre-wrap leading-relaxed font-mono">
              {tacticalAdvice}
            </div>
          )}

          {/* Quick Life Safety Golden Rules */}
          <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>10 NORMAS DE COMBATE FORESTAL (CONAF / BOMBEROS)</span>
            </h5>
            <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
              <li>Manténgase informado sobre el pronóstico del tiempo y el viento local.</li>
              <li>Sepa siempre lo que el fuego está haciendo en todo momento (vía Observador OCEL).</li>
              <li>Base todas las acciones en el comportamiento actual y futuro del incendio.</li>
              <li>Tenga rutas de escape claras para cada bombero y déjelas conocidas por todos.</li>
              <li>Nunca trabaje directamente ladera arriba de un incendio activo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
