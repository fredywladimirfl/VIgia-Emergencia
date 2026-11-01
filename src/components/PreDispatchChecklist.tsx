import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  Droplet, 
  Fuel, 
  RefreshCw,
  Boxes,
  Search,
  Edit3,
  Plus,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  AlertOctagon,
  Calendar
} from 'lucide-react';
import { PreDispatchItem, UnitApparatus, InventoryItem } from '../types/wildfire';
import { COMPANY_INFO } from '../data/companyData';

interface PreDispatchChecklistProps {
  checklist: PreDispatchItem[];
  setChecklist: React.Dispatch<React.SetStateAction<PreDispatchItem[]>>;
  units: UnitApparatus[];
  setUnits: React.Dispatch<React.SetStateAction<UnitApparatus[]>>;
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export const PreDispatchChecklist: React.FC<PreDispatchChecklistProps> = ({
  checklist,
  setChecklist,
  units,
  setUnits,
  inventoryItems,
  setInventoryItems,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'checklist' | 'inventory'>('checklist');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [filterInvCategory, setFilterInvCategory] = useState<string>('all');

  // Modals state for Material Mayor
  const [editingUnit, setEditingUnit] = useState<UnitApparatus | null>(null);
  const [isNewUnitModal, setIsNewUnitModal] = useState(false);

  // Modals state for Inventory
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isNewItemModal, setIsNewItemModal] = useState(false);

  // Form state for Material Mayor editing
  const [unitForm, setUnitForm] = useState<Partial<UnitApparatus>>({});
  const [missingAlertsText, setMissingAlertsText] = useState('');

  // Form state for Inventory editing
  const [itemForm, setItemForm] = useState<Partial<InventoryItem>>({});

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleRefillWater = (unitId: string) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, waterCurrentLiters: u.waterCapacityLiters } : u));
  };

  const handleRefuel = (unitId: string) => {
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, fuelPercent: 100 } : u));
  };

  // Open Edit Unit modal
  const handleOpenEditUnit = (unit: UnitApparatus) => {
    setEditingUnit(unit);
    setIsNewUnitModal(false);
    setUnitForm({ ...unit });
    setMissingAlertsText((unit.missingEquipmentAlerts || []).join('\n'));
  };

  const handleOpenNewUnit = () => {
    setEditingUnit(null);
    setIsNewUnitModal(true);
    setUnitForm({
      id: `unit-${Date.now()}`,
      callsign: 'B-6',
      name: 'Nueva Bomba Forestal',
      type: 'Bomba Estructural',
      brandModel: 'Renault M 180',
      patent: 'AB-CD-12',
      waterCapacityLiters: 3000,
      waterCurrentLiters: 3000,
      fuelPercent: 90,
      pumpStatus: 'operativa',
      driverName: 'Jorge Mato Garrido (Tte 1° y Maquinista)',
      crewCount: 4,
      radioChannel: 'Radio Motorola DEP 450 (Canal Menque)',
      missingEquipmentAlerts: [],
    });
    setMissingAlertsText('');
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.callsign) return;

    const alerts = missingAlertsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const updated: UnitApparatus = {
      id: unitForm.id || `unit-${Date.now()}`,
      callsign: unitForm.callsign || 'B-6',
      name: unitForm.name || unitForm.callsign || 'Móvil',
      type: unitForm.type || 'Bomba Estructural',
      brandModel: unitForm.brandModel || '',
      patent: unitForm.patent || '',
      year: unitForm.year || '',
      motorNumber: unitForm.motorNumber || '',
      chassisNumber: unitForm.chassisNumber || '',
      waterCapacityLiters: Number(unitForm.waterCapacityLiters) || 0,
      waterCurrentLiters: Number(unitForm.waterCurrentLiters) || 0,
      fuelPercent: Number(unitForm.fuelPercent) || 0,
      pumpStatus: unitForm.pumpStatus || 'operativa',
      driverName: unitForm.driverName || 'Por asignar',
      crewCount: Number(unitForm.crewCount) || 1,
      radioChannel: unitForm.radioChannel || 'Canal Menque',
      missingEquipmentAlerts: alerts,
      techRevisionDue: unitForm.techRevisionDue,
      soapDue: unitForm.soapDue,
    };

    if (isNewUnitModal) {
      setUnits(prev => [...prev, updated]);
    } else {
      setUnits(prev => prev.map(u => u.id === updated.id ? updated : u));
    }

    setEditingUnit(null);
    setIsNewUnitModal(false);
  };

  const handleDeleteUnit = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta unidad de material mayor?')) {
      setUnits(prev => prev.filter(u => u.id !== id));
      setEditingUnit(null);
    }
  };

  // Open Edit Item modal
  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsNewItemModal(false);
    setItemForm({ ...item });
  };

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setIsNewItemModal(true);
    setItemForm({
      id: `inv-${Date.now()}`,
      cod: 'M0' + String(inventoryItems.length + 1).padStart(2, '0'),
      desc: '',
      cat: 'Mangueras',
      ubi: 'Carro B6',
      stock: 1,
      min: 1,
      estado: 'Bueno',
      resp: '',
    });
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.cod || !itemForm.desc) return;

    const updated: InventoryItem = {
      id: itemForm.id || `inv-${Date.now()}`,
      cod: itemForm.cod.trim(),
      desc: itemForm.desc.trim(),
      cat: itemForm.cat || 'Material Menor',
      ubi: itemForm.ubi || 'Carro B6',
      stock: Number(itemForm.stock) || 0,
      min: Number(itemForm.min) || 0,
      estado: itemForm.estado || 'Bueno',
      resp: itemForm.resp || '',
    };

    if (isNewItemModal) {
      setInventoryItems(prev => [updated, ...prev]);
    } else {
      setInventoryItems(prev => prev.map(it => it.id === updated.id ? updated : it));
    }

    setEditingItem(null);
    setIsNewItemModal(false);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Desea eliminar este ítem de inventario?')) {
      setInventoryItems(prev => prev.filter(it => it.id !== id));
      setEditingItem(null);
    }
  };

  const handleQuickStock = (id: string, delta: number) => {
    setInventoryItems(prev => prev.map(it => {
      if (it.id === id) {
        return { ...it, stock: Math.max(0, it.stock + delta) };
      }
      return it;
    }));
  };

  const totalItems = checklist.length;
  const checkedItems = checklist.filter(i => i.checked).length;
  const criticalItems = checklist.filter(i => i.critical);
  const criticalPending = criticalItems.filter(i => !i.checked);
  const isReadyToRoll = criticalPending.length === 0;

  const categories = [
    { id: 'all', label: 'Todos los Ítems' },
    { id: 'epp', label: 'EPP Personal Forestal' },
    { id: 'mecanico', label: 'Mecánica B-6 y Bombas' },
    { id: 'herramientas', label: 'Mangueras y Herramientas' },
    { id: 'sanitario_hidratacion', label: 'Comunicaciones y Salud' },
  ];

  const filteredChecklist = checklist.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const invCategories = ['all', 'Mangueras', 'Pitones hidráulicos', 'Bombas y Motosierras', 'Herramientas de Corte', 'Comunicaciones VHF', 'EPP', 'Sanitario y Trauma'];

  const filteredInventory = inventoryItems.filter(inv => {
    if (filterInvCategory !== 'all' && inv.cat !== filterInvCategory) return false;
    if (!inventorySearch) return true;
    const q = inventorySearch.toLowerCase();
    return inv.desc.toLowerCase().includes(q) || inv.cod.toLowerCase().includes(q) || inv.cat.toLowerCase().includes(q) || inv.ubi.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Dispatch Certification Banner */}
      <div className={`p-5 sm:p-6 rounded-xl border transition-all ${
        isReadyToRoll
          ? 'bg-emerald-950/20 border-emerald-600/70'
          : 'bg-amber-950/30 border-amber-600'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-white tracking-tight">
                CERTIFICACIÓN OPERACIONAL · {COMPANY_INFO.name}
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                isReadyToRoll
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-amber-600 text-white border-amber-400'
              }`}>
                {isReadyToRoll ? 'DESPACHO AUTORIZADO' : 'ÍTEMS CRÍTICOS PENDIENTES'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl">
              Auditoría previa a la salida del Carro B-6 y unidades de relevo: estado de bomba centrífuga, estanque de 3000 litros, mangueras forestales de 38mm, motobomba Honda WH20X y EPP normado.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 shrink-0 font-mono text-xs">
            <div>
              <span className="text-zinc-500 block text-[11px]">AVANCE AUDITORÍA:</span>
              <span className="text-xl font-bold text-white mt-0.5 block">
                {checkedItems} / {totalItems} ({Math.round((checkedItems / totalItems) * 100)}%)
              </span>
            </div>
            {criticalPending.length > 0 && (
              <div className="border-l border-zinc-800 pl-3">
                <span className="text-amber-400 block text-[11px]">CRÍTICOS FALTANTES:</span>
                <span className="text-xl font-bold text-red-400 mt-0.5 block">
                  {criticalPending.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apparatus Fleet Status (MATERIAL MAYOR con EDICIÓN) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-400" />
              <span>MATERIAL MAYOR · FLOTA SEXTA MENQUE</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gestión operativa y técnica de carros bombas, aljibes y unidades técnicas. Puedes editar especificaciones, estanque, chofer y alertas.
            </p>
          </div>
          <button
            onClick={handleOpenNewUnit}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Agregar Móvil</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {units.map(unit => {
            const waterPercent = unit.waterCapacityLiters > 0 
              ? Math.round((unit.waterCurrentLiters / unit.waterCapacityLiters) * 100)
              : 0;
            const isLowWater = unit.waterCapacityLiters > 0 && waterPercent < 30;

            return (
              <div 
                key={unit.id}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="font-mono text-orange-400 font-black">{unit.callsign}</span>
                    <span>· {unit.brandModel || unit.name}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditUnit(unit)}
                      title="Editar datos de Material Mayor"
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-emerald-400 uppercase">
                      {unit.pumpStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <p>Patente: <strong className="text-zinc-200 font-mono">{unit.patent || 'S/P'}</strong> {unit.year ? `(${unit.year})` : ''}</p>
                  <p>Maquinista a cargo: <strong className="text-zinc-200">{unit.driverName}</strong></p>
                  <p>Dotación: <strong className="text-zinc-200">{unit.crewCount} Bomberos</strong> · {unit.radioChannel}</p>
                  {unit.motorNumber && (
                    <p className="text-[11px] font-mono text-zinc-500">Motor: {unit.motorNumber} · Chasis: {unit.chassisNumber || 'S/N'}</p>
                  )}
                </div>

                {/* Missing equipment alerts registered in real data */}
                {unit.missingEquipmentAlerts && unit.missingEquipmentAlerts.length > 0 && (
                  <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 space-y-0.5">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Observaciones / Faltantes:</span>
                    </p>
                    {unit.missingEquipmentAlerts.map((obs, idx) => (
                      <p key={idx} className="pl-4 text-amber-200">· {obs}</p>
                    ))}
                  </div>
                )}

                {/* Water Level Bar */}
                {unit.waterCapacityLiters > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Droplet className={`w-3.5 h-3.5 ${isLowWater ? 'text-amber-400' : 'text-blue-400'}`} />
                        <span>Estanque:</span>
                      </span>
                      <span className={`font-bold ${isLowWater ? 'text-amber-400' : 'text-white'}`}>
                        {unit.waterCurrentLiters.toLocaleString()} / {unit.waterCapacityLiters.toLocaleString()} L ({waterPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${isLowWater ? 'bg-amber-500' : 'bg-blue-500'}`}
                        style={{ width: `${waterPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Fuel Level */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-orange-400" />
                      <span>Diésel:</span>
                    </span>
                    <span className="font-bold text-white">{unit.fuelPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${unit.fuelPercent}%` }}
                    />
                  </div>
                </div>

                {/* Quick actions for apparatus */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenEditUnit(unit)}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    Editar móvil
                  </button>

                  <div className="flex items-center gap-1.5">
                    {unit.waterCapacityLiters > 0 && unit.waterCurrentLiters < unit.waterCapacityLiters && (
                      <button
                        onClick={() => handleRefillWater(unit.id)}
                        className="px-2 py-0.5 bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 rounded text-[11px] font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Llenar</span>
                      </button>
                    )}
                    {unit.fuelPercent < 100 && (
                      <button
                        onClick={() => handleRefuel(unit.id)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px]"
                      >
                        100% Diésel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Switcher: Pre-Dispatch Checklist vs Real Inventory Editor */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('checklist')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'checklist'
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Checklist Pre-Despacho ({checkedItems}/{totalItems})</span>
            </button>
            <button
              onClick={() => setViewMode('inventory')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'inventory'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Control & Edición de Inventario ({inventoryItems.length} ítems)</span>
            </button>
          </div>

          {viewMode === 'inventory' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar código, material o ubicación..."
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 w-56 sm:w-64 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleOpenNewItem}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Ítem</span>
              </button>
            </div>
          )}
        </div>

        {/* View Mode 1: Pre-Dispatch Checklist */}
        {viewMode === 'checklist' && (
          <div className="space-y-4">
            {/* Category switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* List of items */}
            <div className="space-y-2">
              {filteredChecklist.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    item.checked
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      : item.critical
                      ? 'bg-amber-950/20 border-amber-800/70 hover:border-amber-600'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                    item.checked
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-900 border-zinc-700 text-transparent'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>

                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${item.checked ? 'text-zinc-200' : 'text-white'}`}>
                        {item.title}
                      </span>
                      {item.critical && (
                        <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                          CRÍTICO
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode 2: Full Editable Inventory Table */}
        {viewMode === 'inventory' && (
          <div className="space-y-3">
            {/* Category Filter for Inventory */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-zinc-500 font-semibold shrink-0">Categoría:</span>
              {invCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterInvCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                    filterInvCategory === cat
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descripción Material</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/50">
                  {filteredInventory.map((item) => {
                    const isLowStock = item.min > 0 && item.stock <= item.min;
                    return (
                      <tr key={item.id} className="hover:bg-zinc-900/60">
                        <td className="py-2.5 px-3 font-mono text-orange-400 font-bold">{item.cod}</td>
                        <td className="py-2.5 px-3 font-medium text-white max-w-xs">{item.desc}</td>
                        <td className="py-2.5 px-3 text-zinc-400">{item.cat}</td>
                        <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px]">{item.ubi}</td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleQuickStock(item.id, -1)}
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-mono font-bold"
                            >
                              -
                            </button>
                            <span className={`font-mono font-bold px-1.5 ${isLowStock ? 'text-red-400 font-extrabold' : 'text-white'}`}>
                              {item.stock}
                            </span>
                            <button
                              onClick={() => handleQuickStock(item.id, 1)}
                              className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-mono font-bold"
                            >
                              +
                            </button>
                            {isLowStock && (
                              <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-1 py-0.2 rounded border border-red-800 ml-1">
                                Reponer
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[11px] font-semibold ${
                            item.estado === 'Bueno' || item.estado === 'Operativo' || item.estado === 'Al día'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditItem(item)}
                              title="Editar ítem"
                              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Eliminar ítem"
                              className="p-1.5 rounded bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No se encontraron ítems de inventario coincidentes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Edit Material Mayor (Carro/Unidad) */}
      {(editingUnit || isNewUnitModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl max-w-xl w-full p-5 sm:p-6 space-y-4 text-zinc-100 my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-400" />
                <span>{isNewUnitModal ? 'Agregar Móvil / Material Mayor' : `Editar Unidad: ${unitForm.callsign}`}</span>
              </h4>
              <button
                onClick={() => { setEditingUnit(null); setIsNewUnitModal(false); }}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Nomenclatura (Callsign)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. B-6, BF-6, Z-Tomé"
                    value={unitForm.callsign || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, callsign: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Tipo de Unidad</label>
                  <select
                    value={unitForm.type || 'Bomba Estructural'}
                    onChange={e => setUnitForm(prev => ({ ...prev, type: e.target.value as UnitApparatus['type'] }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="Bomba Estructural">Bomba Estructural</option>
                    <option value="Forestal 4x4">Forestal 4x4</option>
                    <option value="Ataque Rápido">Ataque Rápido</option>
                    <option value="Aljibe Abastecimiento">Aljibe Abastecimiento</option>
                    <option value="Transporte Personal">Transporte Personal</option>
                    <option value="Comandancia K-1">Comandancia K-1</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Patente</label>
                  <input
                    type="text"
                    placeholder="Ej. AB-CD-12"
                    value={unitForm.patent || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, patent: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-zinc-400 font-semibold block mb-1">Marca / Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej. Renault M 180"
                    value={unitForm.brandModel || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, brandModel: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Año Fabricación</label>
                  <input
                    type="text"
                    placeholder="Ej. 1993"
                    value={unitForm.year || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">N° Motor</label>
                  <input
                    type="text"
                    placeholder="Ej. 89M0106825"
                    value={unitForm.motorNumber || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, motorNumber: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">N° Chasis</label>
                  <input
                    type="text"
                    placeholder="Ej. 9540"
                    value={unitForm.chassisNumber || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, chassisNumber: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Capacidad Estanque (L)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={unitForm.waterCapacityLiters || 0}
                    onChange={e => setUnitForm(prev => ({ ...prev, waterCapacityLiters: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Agua Actual (L)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={unitForm.waterCurrentLiters || 0}
                    onChange={e => setUnitForm(prev => ({ ...prev, waterCurrentLiters: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Combustible Diésel (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={unitForm.fuelPercent || 0}
                    onChange={e => setUnitForm(prev => ({ ...prev, fuelPercent: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Maquinista a Cargo</label>
                  <input
                    type="text"
                    placeholder="Ej. Jorge Mato Garrido (Tte 1° y Maquinista)"
                    value={unitForm.driverName || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, driverName: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Canal Radial Asignado</label>
                  <input
                    type="text"
                    placeholder="Radio Motorola DEP 450 (Canal Menque)"
                    value={unitForm.radioChannel || ''}
                    onChange={e => setUnitForm(prev => ({ ...prev, radioChannel: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">
                  Observaciones de Equipamiento Faltante (un ítem por línea)
                </label>
                <textarea
                  rows={2}
                  placeholder="Triángulos de pana (No tiene - Reponer)&#10;Chalecos reflectantes amarillos (No tiene - Reponer)"
                  value={missingAlertsText}
                  onChange={e => setMissingAlertsText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                {!isNewUnitModal && editingUnit && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUnit(editingUnit.id)}
                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded font-semibold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Móvil</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => { setEditingUnit(null); setIsNewUnitModal(false); }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded flex items-center gap-1.5 shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Material Mayor</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit / Add Inventory Item */}
      {(editingItem || isNewItemModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-700 rounded-xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-zinc-100 my-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <span>{isNewItemModal ? 'Agregar Nuevo Ítem a Inventario' : `Editar Ítem: ${itemForm.cod}`}</span>
              </h4>
              <button
                onClick={() => { setEditingItem(null); setIsNewItemModal(false); }}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Código del Ítem</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. M001, RAD-01, MM008"
                    value={itemForm.cod || ''}
                    onChange={e => setItemForm(prev => ({ ...prev, cod: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Categoría</label>
                  <select
                    value={itemForm.cat || 'Mangueras'}
                    onChange={e => setItemForm(prev => ({ ...prev, cat: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="Mangueras">Mangueras</option>
                    <option value="Pitones hidráulicos">Pitones hidráulicos</option>
                    <option value="Bombas y Motosierras">Bombas y Motosierras</option>
                    <option value="Herramientas de Corte">Herramientas de Corte</option>
                    <option value="Comunicaciones VHF">Comunicaciones VHF</option>
                    <option value="EPP">EPP</option>
                    <option value="Sanitario y Trauma">Sanitario y Trauma</option>
                    <option value="Material Menor">Material Menor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Descripción Completa del Material</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Manguera de 38 mm forestal c/unión storz"
                  value={itemForm.desc || ''}
                  onChange={e => setItemForm(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Ubicación / Vehículo</label>
                  <input
                    type="text"
                    placeholder="Ej. Carro B6, Cuartel Menque, Cabina"
                    value={itemForm.ubi || ''}
                    onChange={e => setItemForm(prev => ({ ...prev, ubi: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Estado de Conservación</label>
                  <select
                    value={itemForm.estado || 'Bueno'}
                    onChange={e => setItemForm(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                  >
                    <option value="Bueno">Bueno</option>
                    <option value="Operativo">Operativo</option>
                    <option value="Al día">Al día</option>
                    <option value="Regular">Regular</option>
                    <option value="Malo">Malo</option>
                    <option value="En reparación">En reparación</option>
                    <option value="Sin registrar">Sin registrar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Stock Físico Actual</label>
                  <input
                    type="number"
                    min={0}
                    value={itemForm.stock || 0}
                    onChange={e => setItemForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-semibold block mb-1">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    min={0}
                    value={itemForm.min || 0}
                    onChange={e => setItemForm(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Responsable de Custodia (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Teniente de Máquinas / Maquinista"
                  value={itemForm.resp || ''}
                  onChange={e => setItemForm(prev => ({ ...prev, resp: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                {!isNewItemModal && editingItem && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(editingItem.id)}
                    className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded font-semibold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Ítem</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => { setEditingItem(null); setIsNewItemModal(false); }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-1.5 shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Ítem</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
