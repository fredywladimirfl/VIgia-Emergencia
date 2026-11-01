/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_FIREFIGHTERS, 
  INITIAL_UNITS, 
  INITIAL_OCEL, 
  INITIAL_WEATHER, 
  INITIAL_PREDISPATCH,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_CATASTROPHE_ALERTS
} from './data/initialData';
import { 
  Firefighter, 
  UnitApparatus, 
  OcelState, 
  WeatherCondition, 
  PreDispatchItem, 
  MaydayIncident,
  InventoryItem,
  CatastropheAlert
} from './types/wildfire';
import { evaluateFireConditions } from './utils/fireFormulas';
import { soundSystem } from './utils/audioAlarm';

import { HeaderTactical } from './components/HeaderTactical';
import { MaydayModal } from './components/MaydayModal';
import { OcelDashboard } from './components/OcelDashboard';
import { PersonnelParTracker } from './components/PersonnelParTracker';
import { Weather3030Tracker } from './components/Weather3030Tracker';
import { TacticalMapCanvas } from './components/TacticalMapCanvas';
import { PreDispatchChecklist } from './components/PreDispatchChecklist';
import { SitrepAdvisor } from './components/SitrepAdvisor';
import { CatastropheAlertCenter } from './components/CatastropheAlertCenter';
import { WaterHydraulicsCalculator } from './components/WaterHydraulicsCalculator';
import { RadioCodesGuide } from './components/RadioCodesGuide';
import { LogbookNotes } from './components/LogbookNotes';
import { WindShiftMonitor } from './components/WindShiftMonitor';
import { WindShiftEvent } from './services/meteorologicalStations';

const DATA_VERSION = 'v6_windshift_station_monitor';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('catastrophes'); // Open directly on Catastrophes Alert Center!

  // Check version and load from localStorage or defaults
  const [firefighters, setFirefighters] = useState<Firefighter[]>(() => {
    try {
      const ver = localStorage.getItem('vigia_data_version');
      if (ver !== DATA_VERSION) {
        localStorage.setItem('vigia_data_version', DATA_VERSION);
        localStorage.removeItem('vigia_firefighters');
        localStorage.removeItem('vigia_units');
        localStorage.removeItem('vigia_ocel');
        localStorage.removeItem('vigia_weather');
        localStorage.removeItem('vigia_checklist');
        localStorage.removeItem('vigia_inventory');
        localStorage.removeItem('vigia_catastrophes');
        return INITIAL_FIREFIGHTERS;
      }
      const saved = localStorage.getItem('vigia_firefighters');
      return saved ? JSON.parse(saved) : INITIAL_FIREFIGHTERS;
    } catch {
      return INITIAL_FIREFIGHTERS;
    }
  });

  const [units, setUnits] = useState<UnitApparatus[]>(() => {
    try {
      const saved = localStorage.getItem('vigia_units');
      return saved ? JSON.parse(saved) : INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
    }
  });

  const [ocel, setOcel] = useState<OcelState>(() => {
    try {
      const saved = localStorage.getItem('vigia_ocel');
      return saved ? JSON.parse(saved) : INITIAL_OCEL;
    } catch {
      return INITIAL_OCEL;
    }
  });

  const [weather, setWeather] = useState<WeatherCondition>(() => {
    try {
      const saved = localStorage.getItem('vigia_weather');
      return saved ? JSON.parse(saved) : INITIAL_WEATHER;
    } catch {
      return INITIAL_WEATHER;
    }
  });

  const [checklist, setChecklist] = useState<PreDispatchItem[]>(() => {
    try {
      const saved = localStorage.getItem('vigia_checklist');
      return saved ? JSON.parse(saved) : INITIAL_PREDISPATCH;
    } catch {
      return INITIAL_PREDISPATCH;
    }
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vigia_inventory');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY_ITEMS;
    } catch {
      return INITIAL_INVENTORY_ITEMS;
    }
  });

  const [catastropheAlerts, setCatastropheAlerts] = useState<CatastropheAlert[]>(() => {
    try {
      const saved = localStorage.getItem('vigia_catastrophes');
      return saved ? JSON.parse(saved) : INITIAL_CATASTROPHE_ALERTS;
    } catch {
      return INITIAL_CATASTROPHE_ALERTS;
    }
  });

  const [maydayIncident, setMaydayIncident] = useState<MaydayIncident | null>(null);
  const [isMaydayModalOpen, setIsMaydayModalOpen] = useState(false);
  const [activeWindShiftAlert, setActiveWindShiftAlert] = useState<WindShiftEvent | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vigia_firefighters', JSON.stringify(firefighters));
    } catch (_) {}
  }, [firefighters]);

  useEffect(() => {
    try {
      localStorage.setItem('vigia_units', JSON.stringify(units));
    } catch (_) {}
  }, [units]);

  useEffect(() => {
    try {
      localStorage.setItem('vigia_ocel', JSON.stringify(ocel));
    } catch (_) {}
  }, [ocel]);

  useEffect(() => {
    try {
      localStorage.setItem('vigia_weather', JSON.stringify(weather));
    } catch (_) {}
  }, [weather]);

  useEffect(() => {
    try {
      localStorage.setItem('vigia_checklist', JSON.stringify(checklist));
    } catch (_) {}
  }, [checklist]);

  useEffect(() => {
    try {
      localStorage.setItem('vigia_inventory', JSON.stringify(inventoryItems));
    } catch (_) {}
  }, [inventoryItems]);

  useEffect(() => {
    try {
      localStorage.setItem('vigia_catastrophes', JSON.stringify(catastropheAlerts));
    } catch (_) {}
  }, [catastropheAlerts]);

  // Evaluate 30-30-30 condition and flame length
  const analysis = evaluateFireConditions(weather);

  const handleTriggerMayday = () => {
    setIsMaydayModalOpen(true);
  };

  const handleSaveMayday = (incident: MaydayIncident) => {
    setMaydayIncident(incident);
    if (!incident.active) {
      soundSystem.stopAlarm();
    }
  };

  const unresolvedMaydayCount = maydayIncident?.active && !maydayIncident.resolved ? 1 : 0;
  const activeCatastropheCount = catastropheAlerts.filter(a => a.status === 'activa').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Tactical Top Header */}
      <HeaderTactical
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weather={weather}
        is303030Alert={analysis.is303030Alert}
        onTriggerMayday={handleTriggerMayday}
        unresolvedMaydayCount={unresolvedMaydayCount}
        activeCatastropheCount={activeCatastropheCount}
        activeWindShiftAlert={activeWindShiftAlert}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'catastrophes' && (
          <CatastropheAlertCenter
            alerts={catastropheAlerts}
            setAlerts={setCatastropheAlerts}
            units={units}
          />
        )}

        {activeTab === 'windshift' && (
          <WindShiftMonitor
            activeWindShiftAlert={activeWindShiftAlert}
            setActiveWindShiftAlert={setActiveWindShiftAlert}
            onWindShiftDetected={(event) => {
              setActiveWindShiftAlert(event);
            }}
          />
        )}

        {activeTab === 'ocel' && (
          <OcelDashboard
            ocel={ocel}
            setOcel={setOcel}
            flameLengthMeters={analysis.estimatedFlameLengthMeters}
          />
        )}

        {activeTab === 'par' && (
          <PersonnelParTracker
            firefighters={firefighters}
            setFirefighters={setFirefighters}
            targetHydrationLiters={analysis.hydrationTargetLitersPerHour}
          />
        )}

        {activeTab === 'weather' && (
          <Weather3030Tracker
            weather={weather}
            setWeather={setWeather}
          />
        )}

        {activeTab === 'water' && (
          <WaterHydraulicsCalculator
            units={units}
            setUnits={setUnits}
          />
        )}

        {activeTab === 'map' && (
          <TacticalMapCanvas
            weather={weather}
            ocel={ocel}
            units={units}
          />
        )}

        {activeTab === 'radiocodes' && (
          <RadioCodesGuide />
        )}

        {activeTab === 'logbook' && (
          <LogbookNotes />
        )}

        {activeTab === 'checklist' && (
          <PreDispatchChecklist
            checklist={checklist}
            setChecklist={setChecklist}
            units={units}
            setUnits={setUnits}
            inventoryItems={inventoryItems}
            setInventoryItems={setInventoryItems}
          />
        )}

        {activeTab === 'sitrep' && (
          <SitrepAdvisor
            firefighters={firefighters}
            units={units}
            ocel={ocel}
            weather={weather}
          />
        )}
      </main>

      {/* Active Mayday Emergency Modal */}
      <MaydayModal
        isOpen={isMaydayModalOpen}
        onClose={() => setIsMaydayModalOpen(false)}
        units={units}
        currentIncident={maydayIncident}
        onSaveIncident={handleSaveMayday}
      />

      {/* Tactical Quiet Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-4 px-4 sm:px-6 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-zinc-300">Sexta Compañía Menque</span>
            <span>·</span>
            <span>Cuerpo de Bomberos de Tomé</span>
            <span>·</span>
            <span className="text-orange-400">Disciplina y Trabajo</span>
            <span>·</span>
            <span>Región del Biobío, Chile</span>
          </div>
          <div className="text-zinc-400 font-mono text-[11px]">
            Hora Operacional: {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} CLST
          </div>
        </div>
      </footer>
    </div>
  );
}
