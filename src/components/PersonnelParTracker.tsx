import React, { useState } from 'react';
import { 
  Users, 
  Droplet, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Check, 
  CheckCircle2, 
  Flame,
  Coffee,
  RotateCw,
  Phone,
  Shield,
  Activity,
  Award,
  Edit3,
  X
} from 'lucide-react';
import { Firefighter, FirefighterRank, TacticalRole, FatigueLevel } from '../types/wildfire';
import { soundSystem } from '../utils/audioAlarm';

interface PersonnelParTrackerProps {
  firefighters: Firefighter[];
  setFirefighters: React.Dispatch<React.SetStateAction<Firefighter[]>>;
  targetHydrationLiters: number;
}

export const PersonnelParTracker: React.FC<PersonnelParTrackerProps> = ({
  firefighters,
  setFirefighters,
  targetHydrationLiters,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterAnb, setFilterAnb] = useState<string>('all');
  const [isParCheckActive, setIsParCheckActive] = useState<boolean>(false);
  const [editingFf, setEditingFf] = useState<Firefighter | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    rutOrRecord: string;
    companyNumber: string;
    regNacional: string;
    bloodType: string;
    anbLevel: 'Operativo' | 'Inicial';
    emergencyPhone: string;
    rank: FirefighterRank;
    role: TacticalRole;
    assignedUnit: string;
    status: Firefighter['status'];
  }>({
    name: '',
    rutOrRecord: '',
    companyNumber: '',
    regNacional: '',
    bloodType: 'O Rhesus +',
    anbLevel: 'Operativo',
    emergencyPhone: '',
    rank: 'Bombero Activo',
    role: 'Pitonero de Cabeza',
    assignedUnit: 'B-6',
    status: 'en_linea',
  });

  // New Firefighter form
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [regNacional, setRegNacional] = useState('');
  const [bloodType, setBloodType] = useState('O Rhesus +');
  const [anbLevel, setAnbLevel] = useState<'Operativo' | 'Inicial'>('Operativo');
  const [emergencyPhone, setEmergencyPhone] = useState('+569');
  const [rank, setRank] = useState<FirefighterRank>('Bombero Activo');
  const [role, setRole] = useState<TacticalRole>('Pitonero de Cabeza');
  const [assignedUnit, setAssignedUnit] = useState('B-6');

  // Stats
  const totalDeployed = firefighters.filter(f => f.status === 'en_linea').length;
  const inRest = firefighters.filter(f => f.status === 'en_descanso' || f.status === 'cuartel').length;
  const parConfirmedCount = firefighters.filter(f => f.parConfirmed).length;
  const heatStressCount = firefighters.filter(f => f.heatStressSymptoms.length > 0 || f.fatigueScore >= 4).length;
  const overtimeCount = firefighters.filter(f => f.status === 'en_linea' && f.minutesOnLine >= 45).length;
  const countOperativo = firefighters.filter(f => f.anbLevel === 'Operativo').length;
  const countInicial = firefighters.filter(f => f.anbLevel === 'Inicial').length;

  const handleStartParCheck = () => {
    setIsParCheckActive(true);
    soundSystem.playChimeAlert();
    setFirefighters(prev => prev.map(f => ({
      ...f,
      parConfirmed: f.status !== 'en_linea', // Non-line members already safe
    })));
  };

  const handleConfirmParSingle = (id: string) => {
    setFirefighters(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          parConfirmed: true,
          lastCheckinTime: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return f;
    }));
  };

  const handleConfirmAllPar = () => {
    setFirefighters(prev => prev.map(f => ({
      ...f,
      parConfirmed: true,
      lastCheckinTime: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    })));
    setIsParCheckActive(false);
    soundSystem.playChimeAlert();
  };

  const handleAddWater = (id: string, delta: number) => {
    setFirefighters(prev => prev.map(f => {
      if (f.id === id) {
        const next = Math.max(0, Math.round((f.waterIntakeLiters + delta) * 10) / 10);
        return { ...f, waterIntakeLiters: next };
      }
      return f;
    }));
  };

  const handleSetFatigue = (id: string, fatigue: FatigueLevel) => {
    setFirefighters(prev => prev.map(f => f.id === id ? { ...f, fatigueScore: fatigue } : f));
  };

  const handleToggleSymptom = (id: string, symptom: string) => {
    setFirefighters(prev => prev.map(f => {
      if (f.id === id) {
        const exists = f.heatStressSymptoms.includes(symptom);
        const nextSymptoms = exists 
          ? f.heatStressSymptoms.filter(s => s !== symptom)
          : [...f.heatStressSymptoms, symptom];
        return { ...f, heatStressSymptoms: nextSymptoms };
      }
      return f;
    }));
  };

  const handleToggleStatus = (id: string, nextStatus: Firefighter['status']) => {
    setFirefighters(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: nextStatus,
          minutesOnLine: nextStatus === 'en_descanso' ? 0 : f.minutesOnLine,
        };
      }
      return f;
    }));
  };

  const handleAddFirefighter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newFf: Firefighter = {
      id: `ff-${Date.now()}`,
      companyNumber: companyNumber || String(100 + firefighters.length + 1),
      regNacional: regNacional || 'REG-PEND',
      rutOrRecord: rut || 'S/N',
      name,
      rank,
      role,
      assignedUnit,
      status: 'en_linea',
      anbLevel,
      bloodType,
      emergencyPhone,
      yearsOfService: 1,
      eppComplete: {
        cascoForestal: true,
        esclavinaIgnifuga: true,
        antiparrasHumo: true,
        trajeNomex: true,
        botasForestales: true,
        guantesCuero: true,
        mochilaAgua: true,
        fireShelterRefugio: true,
      },
      minutesOnLine: 0,
      waterIntakeLiters: 1.0,
      fatigueScore: 1,
      heatStressSymptoms: [],
      parConfirmed: true,
      lastCheckinTime: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    };

    setFirefighters(prev => [newFf, ...prev]);
    setName('');
    setRut('');
    setCompanyNumber('');
    setRegNacional('');
    setShowAddModal(false);
  };

  const startEditing = (ff: Firefighter) => {
    setEditingFf(ff);
    setEditForm({
      name: ff.name,
      rutOrRecord: ff.rutOrRecord,
      companyNumber: ff.companyNumber || '',
      regNacional: ff.regNacional || '',
      bloodType: ff.bloodType || 'O Rhesus +',
      anbLevel: ff.anbLevel || 'Operativo',
      emergencyPhone: ff.emergencyPhone || '',
      rank: ff.rank,
      role: ff.role,
      assignedUnit: ff.assignedUnit,
      status: ff.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFf) return;
    setFirefighters(prev => prev.map(f => {
      if (f.id === editingFf.id) {
        return {
          ...f,
          name: editForm.name,
          rutOrRecord: editForm.rutOrRecord,
          companyNumber: editForm.companyNumber,
          regNacional: editForm.regNacional,
          bloodType: editForm.bloodType,
          anbLevel: editForm.anbLevel,
          emergencyPhone: editForm.emergencyPhone,
          rank: editForm.rank,
          role: editForm.role,
          assignedUnit: editForm.assignedUnit,
          status: editForm.status,
        };
      }
      return f;
    }));
    setEditingFf(null);
  };

  const filteredList = firefighters.filter(f => {
    if (filterUnit !== 'all' && !f.assignedUnit.includes(filterUnit)) return false;
    if (filterAnb !== 'all' && f.anbLevel !== filterAnb) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top PAR Command Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-white tracking-tight">
                NÓMINA & CONTROL PAR · SEXTA COMPAÑÍA MENQUE
              </span>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                16 VOLUNTARIOS OFICIALES CB TOMÉ
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl">
              Rendición de Cuentas y Seguridad Personal (*Personnel Accountability Report*): Nivel ANB, grupo sanguíneo, teléfono de emergencia, hidratación y relevos obligatorios cada 45 minutos.
            </p>
          </div>

          {/* PAR Trigger & Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleStartParCheck}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 shadow-lg ${
                isParCheckActive
                  ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-amber-900/60'
              }`}
            >
              <RotateCw className="w-4 h-4" />
              <span>{isParCheckActive ? 'RONDA PAR EN CURSO...' : 'INICIAR ROLL-CALL PAR'}</span>
            </button>

            {isParCheckActive && (
              <button
                onClick={handleConfirmAllPar}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar 100% Ubicados</span>
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Incorporar Voluntario</span>
            </button>
          </div>
        </div>

        {/* Accountability KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[11px] font-mono">DOTACIÓN EN COMBATE:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">{totalDeployed}</span>
              <span className="text-zinc-400">en línea activa</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              {inRest} en cuartel / relevo
            </span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[11px] font-mono">PAR CONFIRMADO:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${parConfirmedCount === firefighters.length ? 'text-emerald-400' : 'text-amber-400'}`}>
                {parConfirmedCount} / {firefighters.length}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {parConfirmedCount === firefighters.length ? '100% de la dotación a salvo' : 'Pendientes de confirmación'}
            </span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[11px] font-mono">NIVEL ANB MENQUE:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-400">{countOperativo} Op</span>
              <span className="text-zinc-400">/ {countInicial} Ini</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Academia Nacional de Bomberos
            </span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
            <span className="text-zinc-500 block text-[11px] font-mono">TIEMPO &gt; 45 MIN / ESTRÉS:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${overtimeCount > 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
                {overtimeCount}
              </span>
              <span className="text-zinc-400">en fatiga ({heatStressCount} estrés)</span>
            </div>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Meta: {targetHydrationLiters} L agua/hora
            </span>
          </div>
        </div>

        {/* Filter bar by Unit and ANB */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 font-semibold">Móvil Asignado:</span>
            {['all', 'B-6', 'BF-6', 'Z-Tomé'].map(unitKey => (
              <button
                key={unitKey}
                onClick={() => setFilterUnit(unitKey)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  filterUnit === unitKey
                    ? 'bg-zinc-100 text-zinc-900 font-bold'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                }`}
              >
                {unitKey === 'all' ? 'Todos los Móviles' : unitKey}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-semibold">Nivel ANB:</span>
            {['all', 'Operativo', 'Inicial'].map(anb => (
              <button
                key={anb}
                onClick={() => setFilterAnb(anb)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  filterAnb === anb
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {anb === 'all' ? 'Todos' : anb}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Firefighter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map(ff => {
          const isOvertime = ff.minutesOnLine >= 45;
          const isCriticalOvertime = ff.minutesOnLine >= 60;
          const isDehydrated = ff.waterIntakeLiters < targetHydrationLiters;
          const hasSymptoms = ff.heatStressSymptoms.length > 0;
          const isResting = ff.status === 'en_descanso' || ff.status === 'cuartel';

          return (
            <div
              key={ff.id}
              className={`p-4 rounded-xl border transition-all ${
                !ff.parConfirmed
                  ? 'bg-amber-950/20 border-amber-600/80 shadow-md shadow-amber-950/40'
                  : hasSymptoms
                  ? 'bg-red-950/20 border-red-800/80 shadow-md shadow-red-950/40'
                  : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              {/* Header: Name, Registration, Rank, PAR button */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/60 border border-orange-800/80 px-1.5 py-0.5 rounded">
                      N° {ff.companyNumber || '10X'}
                    </span>
                    <span className="font-bold text-white text-sm">{ff.name}</span>
                    <span className="text-[11px] font-mono text-zinc-400">({ff.rank})</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-1 flex-wrap">
                    <span>RUN: {ff.rutOrRecord}</span>
                    <span>·</span>
                    <span className="text-zinc-300 font-semibold">{ff.regNacional || 'REG-CB'}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-semibold">ANB: {ff.anbLevel || 'Operativo'}</span>
                    <span>·</span>
                    <span className="text-red-400 font-semibold">Sangre: {ff.bloodType || 'S/R'}</span>
                  </div>

                  <p className="text-xs text-orange-400 font-semibold flex items-center gap-1.5 mt-1">
                    <span>{ff.role}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-200 font-mono">Móvil: {ff.assignedUnit}</span>
                    {ff.emergencyPhone && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <a 
                          href={`tel:${ff.emergencyPhone}`} 
                          className="text-zinc-400 hover:text-white flex items-center gap-0.5 font-mono text-[11px]"
                          title="Llamar teléfono de emergencia del voluntario"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{ff.emergencyPhone}</span>
                        </a>
                      </>
                    )}
                  </p>
                </div>

                {/* Actions: Edit & PAR Status */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEditing(ff)}
                    title="Editar datos, escalafón y cargo del voluntario"
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleConfirmParSingle(ff.id)}
                    title="Clic para registrar reporte radial PAR de este voluntario"
                    className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      ff.parConfirmed
                        ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
                        : 'bg-amber-600 text-white border-amber-500 animate-pulse'
                    }`}
                  >
                    {ff.parConfirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{ff.parConfirmed ? 'PAR OK' : 'CONFIRMAR PAR'}</span>
                  </button>
                </div>
              </div>

              {/* Exposure Time & Status Switch */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Tiempo en Frente de Fuego:</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span className={`font-bold ${
                      isCriticalOvertime ? 'text-red-400 animate-pulse' : isOvertime ? 'text-amber-400' : 'text-zinc-200'
                    }`}>
                      {ff.minutesOnLine} min {isCriticalOvertime ? '(¡RELEVO INMEDIATO!)' : isOvertime ? '(ROTACIÓN REQUERIDA)' : ''}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[11px]">Años Servicio / Reporte:</span>
                  <span className="text-zinc-300 font-semibold block mt-0.5">
                    {ff.yearsOfService ? `${ff.yearsOfService} años` : 'Activo'} · {ff.lastCheckinTime || '18:15'} hrs
                  </span>
                </div>
              </div>

              {/* Hydration & Heat Stress Symptoms */}
              <div className="mt-3 space-y-2 text-xs">
                {/* Water control */}
                <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded border border-zinc-800/80">
                  <div className="flex items-center gap-1.5">
                    <Droplet className={`w-3.5 h-3.5 ${isDehydrated ? 'text-amber-400' : 'text-blue-400'}`} />
                    <span className="text-zinc-300">Agua consumida:</span>
                    <span className="font-mono font-bold text-white">{ff.waterIntakeLiters} L</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAddWater(ff.id, 0.5)}
                      className="px-2 py-0.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded text-[11px] font-mono font-semibold"
                    >
                      +0.5L
                    </button>
                    <button
                      onClick={() => handleAddWater(ff.id, 1.0)}
                      className="px-2 py-0.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded text-[11px] font-mono font-semibold"
                    >
                      +1.0L
                    </button>
                  </div>
                </div>

                {/* Fatigue Level Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px] font-semibold">Nivel de Fatiga:</span>
                  <div className="flex items-center gap-1">
                    {([1, 2, 3, 4, 5] as FatigueLevel[]).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => handleSetFatigue(ff.id, lvl)}
                        className={`w-6 h-6 rounded text-xs font-mono font-bold transition-colors ${
                          ff.fatigueScore === lvl
                            ? lvl >= 4
                              ? 'bg-red-600 text-white'
                              : lvl === 3
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heat stress symptoms toggles */}
                <div className="space-y-1">
                  <span className="text-zinc-400 text-[11px] font-semibold block">
                    Alarma de Estrés Térmico / Golpe de Calor:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['Calambres', 'Cefalea', 'Mareos', 'Náuseas', 'Visión Borrosa'].map(sym => {
                      const active = ff.heatStressSymptoms.includes(sym);
                      return (
                        <button
                          key={sym}
                          onClick={() => handleToggleSymptom(ff.id, sym)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors border ${
                            active
                              ? 'bg-red-900 text-red-100 border-red-600'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status Action bar */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">
                  Ubicación: <strong className="text-zinc-200 uppercase">{ff.status.replace(/_/g, ' ')}</strong>
                </span>
                <div className="flex items-center gap-2">
                  {isResting ? (
                    <button
                      onClick={() => handleToggleStatus(ff.id, 'en_linea')}
                      className="px-2.5 py-1 bg-orange-700 hover:bg-orange-600 text-white text-[11px] font-bold rounded flex items-center gap-1"
                    >
                      <Flame className="w-3 h-3" />
                      <span>Despachar a Línea</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(ff.id, 'en_descanso')}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium rounded flex items-center gap-1 border border-zinc-700"
                    >
                      <Coffee className="w-3 h-3 text-amber-400" />
                      <span>Relevar a Cuartel/Descanso</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Firefighter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-md w-full space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Registrar Voluntario en Cuartel Sexta Menque</span>
            </h4>
            <form onSubmit={handleAddFirefighter} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">N° Registro Compañía</label>
                  <input
                    type="text"
                    placeholder="Ej. 117"
                    value={companyNumber}
                    onChange={e => setCompanyNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">N° Registro Nacional</label>
                  <input
                    type="text"
                    placeholder="Ej. REG-550"
                    value={regNacional}
                    onChange={e => setRegNacional(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez González"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">RUN</label>
                  <input
                    type="text"
                    placeholder="Ej. 18.234.567-8"
                    value={rut}
                    onChange={e => setRut(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Grupo Sanguíneo</label>
                  <select
                    value={bloodType}
                    onChange={e => setBloodType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="O Rhesus +">O Rhesus +</option>
                    <option value="O Rhesus -">O Rhesus -</option>
                    <option value="A Rhesus +">A Rhesus +</option>
                    <option value="A Rhesus -">A Rhesus -</option>
                    <option value="B Rhesus +">B Rhesus +</option>
                    <option value="B Rhesus -">B Rhesus -</option>
                    <option value="AB Rhesus +">AB Rhesus +</option>
                    <option value="AB Rhesus -">AB Rhesus -</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Nivel ANB</label>
                  <select
                    value={anbLevel}
                    onChange={e => setAnbLevel(e.target.value as 'Operativo' | 'Inicial')}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="Operativo">Nivel Operativo</option>
                    <option value="Inicial">Nivel Inicial</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Teléfono Emergencia</label>
                  <input
                    type="text"
                    placeholder="+569..."
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Rango / Escalafón</label>
                  <select
                    value={rank}
                    onChange={e => setRank(e.target.value as FirefighterRank)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="Director">Director</option>
                    <option value="Capitán">Capitán</option>
                    <option value="Teniente 1° y Maquinista">Teniente 1° y Maquinista</option>
                    <option value="Teniente 1°">Teniente 1°</option>
                    <option value="Teniente 2°">Teniente 2°</option>
                    <option value="Teniente de Máquinas">Teniente de Máquinas</option>
                    <option value="Maquinista">Maquinista</option>
                    <option value="Secretaria">Secretaria</option>
                    <option value="Tesorero">Tesorero</option>
                    <option value="Ayudante de Compañía">Ayudante de Compañía</option>
                    <option value="Bombero Activo">Bombero Activo</option>
                    <option value="Voluntario Honorario">Voluntario Honorario</option>
                    <option value="Aspirante / Reserva">Aspirante / Reserva</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Función Táctica</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as TacticalRole)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="Director de Compañía">Director de Compañía</option>
                    <option value="Oficial de Seguridad">Oficial de Seguridad</option>
                    <option value="Teniente 1° y Maquinista">Teniente 1° y Maquinista</option>
                    <option value="Teniente de Máquinas">Teniente de Máquinas</option>
                    <option value="Maquinista Conductor">Maquinista Conductor</option>
                    <option value="Secretaría y Registro Operacional">Secretaría y Registro Operacional</option>
                    <option value="Tesorería y Logística">Tesorería y Logística</option>
                    <option value="Ayudante de Compañía">Ayudante de Compañía</option>
                    <option value="Pitonero de Cabeza">Pitonero de Cabeza</option>
                    <option value="Pitonero de Flanco">Pitonero de Flanco</option>
                    <option value="Operador Motobomba">Operador Motobomba</option>
                    <option value="Línea de Rastrillo / Batifuego">Línea de Rastrillo / Batifuego</option>
                    <option value="Vigía / Observador OCEL">Vigía / Observador OCEL</option>
                    <option value="Conductor de Carro">Conductor de Carro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Móvil Asignado</label>
                <select
                  value={assignedUnit}
                  onChange={e => setAssignedUnit(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                >
                  <option value="B-6">B-6 Bomba Renault M 180 (Menque)</option>
                  <option value="BF-6">BF-6 Forestal Liviano</option>
                  <option value="Z-Tomé">Z-Tomé Cisterna / Aljibe</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded"
                >
                  Agregar a Dotación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Firefighter Modal */}
      {editingFf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-400" />
                <span>Editar Voluntario / Oficial de Compañía</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingFf(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">N° Registro Compañía</label>
                  <input
                    type="text"
                    value={editForm.companyNumber}
                    onChange={e => setEditForm(prev => ({ ...prev, companyNumber: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">N° Registro Nacional</label>
                  <input
                    type="text"
                    value={editForm.regNacional}
                    onChange={e => setEditForm(prev => ({ ...prev, regNacional: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">RUN / Cédula</label>
                  <input
                    type="text"
                    value={editForm.rutOrRecord}
                    onChange={e => setEditForm(prev => ({ ...prev, rutOrRecord: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Grupo Sanguíneo</label>
                  <select
                    value={editForm.bloodType}
                    onChange={e => setEditForm(prev => ({ ...prev, bloodType: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="O Rhesus +">O Rhesus +</option>
                    <option value="O Rhesus -">O Rhesus -</option>
                    <option value="A Rhesus +">A Rhesus +</option>
                    <option value="A Rhesus -">A Rhesus -</option>
                    <option value="B Rhesus +">B Rhesus +</option>
                    <option value="B Rhesus -">B Rhesus -</option>
                    <option value="AB Rhesus +">AB Rhesus +</option>
                    <option value="AB Rhesus -">AB Rhesus -</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Nivel ANB</label>
                  <select
                    value={editForm.anbLevel}
                    onChange={e => setEditForm(prev => ({ ...prev, anbLevel: e.target.value as 'Operativo' | 'Inicial' }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="Operativo">Nivel Operativo</option>
                    <option value="Inicial">Nivel Inicial</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Teléfono Emergencia</label>
                  <input
                    type="text"
                    value={editForm.emergencyPhone}
                    onChange={e => setEditForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Rango / Escalafón</label>
                  <select
                    value={editForm.rank}
                    onChange={e => setEditForm(prev => ({ ...prev, rank: e.target.value as FirefighterRank }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-medium"
                  >
                    <option value="Director">Director</option>
                    <option value="Capitán">Capitán</option>
                    <option value="Teniente 1° y Maquinista">Teniente 1° y Maquinista</option>
                    <option value="Teniente 1°">Teniente 1°</option>
                    <option value="Teniente 2°">Teniente 2°</option>
                    <option value="Teniente de Máquinas">Teniente de Máquinas</option>
                    <option value="Maquinista">Maquinista</option>
                    <option value="Secretaria">Secretaria</option>
                    <option value="Tesorero">Tesorero</option>
                    <option value="Ayudante de Compañía">Ayudante de Compañía</option>
                    <option value="Bombero Activo">Bombero Activo</option>
                    <option value="Voluntario Honorario">Voluntario Honorario</option>
                    <option value="Aspirante / Reserva">Aspirante / Reserva</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Función Táctica</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value as TacticalRole }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-medium"
                  >
                    <option value="Director de Compañía">Director de Compañía</option>
                    <option value="Oficial de Seguridad">Oficial de Seguridad</option>
                    <option value="Teniente 1° y Maquinista">Teniente 1° y Maquinista</option>
                    <option value="Teniente de Máquinas">Teniente de Máquinas</option>
                    <option value="Maquinista Conductor">Maquinista Conductor</option>
                    <option value="Secretaría y Registro Operacional">Secretaría y Registro Operacional</option>
                    <option value="Tesorería y Logística">Tesorería y Logística</option>
                    <option value="Ayudante de Compañía">Ayudante de Compañía</option>
                    <option value="Pitonero de Cabeza">Pitonero de Cabeza</option>
                    <option value="Pitonero de Flanco">Pitonero de Flanco</option>
                    <option value="Operador Motobomba">Operador Motobomba</option>
                    <option value="Línea de Rastrillo / Batifuego">Línea de Rastrillo / Batifuego</option>
                    <option value="Vigía / Observador OCEL">Vigía / Observador OCEL</option>
                    <option value="Conductor de Carro">Conductor de Carro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Móvil Asignado</label>
                  <select
                    value={editForm.assignedUnit}
                    onChange={e => setEditForm(prev => ({ ...prev, assignedUnit: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="B-6">B-6 Bomba Renault M 180 (Menque)</option>
                    <option value="BF-6">BF-6 Forestal Liviano</option>
                    <option value="Z-Tomé">Z-Tomé Cisterna / Aljibe</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Estado Operacional</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as Firefighter['status'] }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="en_linea">En Línea de Fuego</option>
                    <option value="en_descanso">En Descanso / Relevo</option>
                    <option value="cuartel">En Cuartel Sexta</option>
                    <option value="no_disponible">No Disponible</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingFf(null)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
