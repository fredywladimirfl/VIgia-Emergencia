import React, { useRef, useEffect, useState } from 'react';
import { 
  MapPin, 
  Wind, 
  Layers, 
  Eye, 
  Flame, 
  Truck, 
  ShieldCheck, 
  AlertCircle, 
  PlusCircle,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { WeatherCondition, OcelState, UnitApparatus } from '../types/wildfire';

interface TacticalMapCanvasProps {
  weather: WeatherCondition;
  ocel: OcelState;
  units: UnitApparatus[];
}

interface MapMarker {
  id: string;
  type: 'unit' | 'lookout' | 'safety_zone' | 'spot_fire' | 'water_point';
  label: string;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  color: string;
}

export const TacticalMapCanvas: React.FC<TacticalMapCanvasProps> = ({
  weather,
  ocel,
  units,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<'view' | 'spot_fire' | 'water_point'>('view');
  
  // Tactical interactive markers
  const [markers, setMarkers] = useState<MapMarker[]>([
    { id: 'm-lookout', type: 'lookout', label: 'Vigía El Mirador Menque (OCEL)', x: 78, y: 22, color: '#f97316' },
    { id: 'm-b6', type: 'unit', label: 'B-6 Renault (Pitoneros)', x: 38, y: 64, color: '#ef4444' },
    { id: 'm-bf6', type: 'unit', label: 'BF-6 Ataque Rápido', x: 26, y: 48, color: '#ef4444' },
    { id: 'm-ztome', type: 'unit', label: 'Z-Tomé Aljibe (Ruta N-252)', x: 18, y: 82, color: '#3b82f6' },
    { id: 'm-sz1', type: 'safety_zone', label: 'Zona Segura Alfa (Gimnasio Menque)', x: 20, y: 25, color: '#10b981' },
    { id: 'm-sz2', type: 'safety_zone', label: 'Zona Segura Bravo (Área Negra)', x: 12, y: 75, color: '#10b981' },
    { id: 'm-water', type: 'water_point', label: 'Piscina Abastecimiento 10.000L', x: 22, y: 80, color: '#06b6d4' },
  ]);

  const [activeSpotFires, setActiveSpotFires] = useState<Array<{ id: string; x: number; y: number; time: string }>>([
    { id: 'sp-1', x: 48, y: 56, time: '18:15' }
  ]);

  // Handle map click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (selectedTool === 'spot_fire') {
      setActiveSpotFires(prev => [
        ...prev,
        {
          id: `sp-${Date.now()}`,
          x: Math.round(clickX),
          y: Math.round(clickY),
          time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setSelectedTool('view');
    } else if (selectedTool === 'water_point') {
      setMarkers(prev => [
        ...prev,
        {
          id: `wp-${Date.now()}`,
          type: 'water_point',
          label: 'Punto de Abastecimiento',
          x: Math.round(clickX),
          y: Math.round(clickY),
          color: '#06b6d4'
        }
      ]);
      setSelectedTool('view');
    }
  };

  const handleClearSpotFires = () => {
    setActiveSpotFires([]);
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particleOffset = 0;

    const render = () => {
      particleOffset += 0.5;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Background Grid & Terrain Contours
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Topographic elevation contour lines (decorative realistic topographic effect)
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 40; i < width; i += 70) {
        ctx.beginPath();
        ctx.ellipse(i, height * 0.45, i * 0.5, i * 0.35, Math.PI / 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Tactical Grid
      ctx.strokeStyle = 'rgba(39, 39, 42, 0.4)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Escape Routes Drawn Across Canvas
      // Route 1 (Green/Vehicular road)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(width * 0.38, height * 0.64); // From B-1
      ctx.lineTo(width * 0.22, height * 0.75);
      ctx.lineTo(width * 0.12, height * 0.75); // To Safety Zone Bravo
      ctx.stroke();

      // Route 2 (East fire break)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(width * 0.26, height * 0.48); // From BF-2
      ctx.lineTo(width * 0.24, height * 0.35);
      ctx.lineTo(width * 0.20, height * 0.25); // To Safety Zone Alfa
      ctx.stroke();

      // Route 3 (Compromised/Threatened by smoke)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(width * 0.38, height * 0.64);
      ctx.lineTo(width * 0.45, height * 0.78);
      ctx.lineTo(width * 0.35, height * 0.90);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 3. Fire Perimeter & Active Head of Fire
      // Main fire polygon
      const headX = width * 0.52;
      const headY = height * 0.55;
      const flankLX = width * 0.62;
      const flankLY = height * 0.38;
      const flankRX = width * 0.45;
      const flankRY = height * 0.72;
      const tailX = width * 0.74;
      const tailY = height * 0.58;

      // Glow around fire
      const fireGradient = ctx.createRadialGradient(headX, headY, 15, headX, headY, 120);
      fireGradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
      fireGradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.25)');
      fireGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = fireGradient;
      ctx.beginPath();
      ctx.arc(headX, headY, 120, 0, Math.PI * 2);
      ctx.fill();

      // Burned area body (Negro / Carbón)
      ctx.fillStyle = 'rgba(24, 24, 27, 0.85)';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.quadraticCurveTo(flankLX, flankLY - 20, tailX, tailY);
      ctx.quadraticCurveTo(flankRX + 40, flankRY + 20, headX, headY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Active flaming front edge (Cabeza del fuego)
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(headX, headY, 30, Math.PI * 0.8, Math.PI * 1.6);
      ctx.stroke();

      // Dynamic wind smoke particles drifting along wind vector
      const windAngleRad = ((weather.windDirectionDegrees + 180) * Math.PI) / 180;
      const windDx = Math.cos(windAngleRad);
      const windDy = Math.sin(windAngleRad);

      ctx.fillStyle = 'rgba(200, 200, 210, 0.12)';
      for (let p = 0; p < 25; p++) {
        const offset = (particleOffset * 2 + p * 35) % 200;
        const px = headX + windDx * offset + Math.sin(p) * 20;
        const py = headY + windDy * offset + Math.cos(p) * 20;
        ctx.beginPath();
        ctx.arc(px, py, 12 + (offset / 15), 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Render Spot Fires (Pavesas secundarias)
      activeSpotFires.forEach(sp => {
        const sx = (sp.x / 100) * width;
        const sy = (sp.y / 100) * height;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fee2e2';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`PAVESA ${sp.time}`, sx + 10, sy + 3);
      });

      // 5. Draw Tactical Markers
      markers.forEach(m => {
        const mx = (m.x / 100) * width;
        const my = (m.y / 100) * height;

        ctx.save();
        if (m.type === 'unit') {
          // Draw fire engine box
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(mx - 10, my - 7, 20, 14);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(mx - 10, my - 7, 20, 14);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(m.label.split(' ')[0], mx - 8, my + 4);
        } else if (m.type === 'safety_zone') {
          // Draw green safety zone shield
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(mx, my, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (m.type === 'lookout') {
          // Draw lookout triangle
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(mx, my - 10);
          ctx.lineTo(mx + 9, my + 7);
          ctx.lineTo(mx - 9, my + 7);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Water point circle
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(mx, my, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }

        // Label above/below marker
        ctx.fillStyle = '#f4f4f5';
        ctx.font = '600 10px sans-serif';
        ctx.fillText(m.label, mx + 12, my + 4);
        ctx.restore();
      });

      // 5b. Active Live Monitored Zone / GPS Blip
      const gpsX = width * 0.28;
      const gpsY = height * 0.32;
      const pulseRadius = 10 + Math.sin(Date.now() / 200) * 5;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gpsX, gpsY, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(gpsX, gpsY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`📡 TELEMETRÍA EN VIVO: ${weather.selectedComuna || 'Cuartel Menque'}`, gpsX + 16, gpsY + 4);

      // 6. Tactical Wind Vector Indicator in Top Right
      const windBoxX = width - 110;
      const windBoxY = 20;
      ctx.fillStyle = 'rgba(24, 24, 27, 0.85)';
      ctx.fillRect(windBoxX, windBoxY, 95, 65);
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.8)';
      ctx.strokeRect(windBoxX, windBoxY, 95, 65);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '9px monospace';
      ctx.fillText('VIENTO & RACHA', windBoxX + 8, windBoxY + 16);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${weather.windSpeedKmh} km/h`, windBoxX + 8, windBoxY + 34);

      ctx.fillStyle = '#e4e4e7';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${weather.windDirectionLabel}`, windBoxX + 8, windBoxY + 52);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [weather, markers, activeSpotFires]);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white text-sm">
            MAPA TÁCTICO DE INCENDIO & FRENTE OPERACIONAL
          </span>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            CANVAS VIGÍA 2D
          </span>
        </div>

        {/* Tactical interactive placement tools */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold">Herramientas en Terreno:</span>
          <button
            onClick={() => setSelectedTool('view')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedTool === 'view'
                ? 'bg-zinc-700 text-white font-bold'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Navegar
          </button>
          <button
            onClick={() => setSelectedTool('spot_fire')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
              selectedTool === 'spot_fire'
                ? 'bg-red-600 text-white font-bold animate-pulse'
                : 'bg-zinc-800 text-red-400 hover:text-white'
            }`}
            title="Haga clic en el mapa para reportar un nuevo foco secundario por pavesas"
          >
            <Flame className="w-3 h-3" />
            <span>+ Reportar Pavesa</span>
          </button>
          <button
            onClick={() => setSelectedTool('water_point')}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
              selectedTool === 'water_point'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-zinc-800 text-cyan-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3 h-3" />
            <span>+ Punto de Agua</span>
          </button>
          {activeSpotFires.length > 0 && (
            <button
              onClick={handleClearSpotFires}
              className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
            >
              Limpiar focos
            </button>
          )}
        </div>
      </div>

      {/* Main Tactical Canvas Container */}
      <div className="relative w-full rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={900}
          height={520}
          onClick={handleCanvasClick}
          className="w-full h-auto cursor-crosshair block"
        />

        {selectedTool !== 'view' && (
          <div className="absolute bottom-3 left-3 bg-zinc-950/90 border border-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg shadow-lg">
            Haga clic sobre el mapa para ubicar: <strong>{selectedTool === 'spot_fire' ? 'Nuevo Foco de Pavesa' : 'Punto de Abastecimiento de Agua'}</strong>
          </div>
        )}
      </div>

      {/* Tactical Map Legend */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-red-600 rounded-sm border border-white" />
            <span className="text-zinc-300">Carro Bomba (B-1/BF-2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-500 rounded-full border border-white" />
            <span className="text-zinc-300">Zona de Seguridad (Alfa/Bravo)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-orange-500 clip-triangle" />
            <span className="text-zinc-300">Observador Vigía OCEL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-emerald-500 border-b border-dashed border-emerald-400" />
            <span className="text-zinc-300">Ruta de Escape Despejada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-amber-500 border-b border-dashed border-amber-400" />
            <span className="text-zinc-300">Ruta Amenazada / Humo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-cyan-500 rounded-full" />
            <span className="text-zinc-300">Abastecimiento Agua</span>
          </div>
        </div>

        <span className="text-zinc-500 text-[11px]">
          Frente activo con avance hacia el Oeste impulsado por Viento Puelche.
        </span>
      </div>
    </div>
  );
};
