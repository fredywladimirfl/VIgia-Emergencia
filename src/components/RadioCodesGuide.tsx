import React, { useState } from 'react';
import { 
  Radio, 
  Search, 
  Copy, 
  Check, 
  Volume2, 
  ShieldAlert, 
  Flame, 
  Truck, 
  Users, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface RadioCodeItem {
  code: string;
  category: 'sistema_10' | 'claves_0' | 'claves_oficiales' | 'alfabeto_fonetico';
  title: string;
  meaning: string;
  exampleCall: string;
  critical?: boolean;
}

const CHILEAN_RADIO_CODES: RadioCodeItem[] = [
  // Sistema 10: Actos de Servicio
  { code: '10-0', category: 'sistema_10', title: 'Llamado Estructural', meaning: 'Fuego en casa habitación, local comercial, industria o edificio habitacional.', exampleCall: 'Central Tomé, B-6 sale a 10-0 en Población Bellavista Menque.', critical: true },
  { code: '10-1', category: 'sistema_10', title: 'Fuga de Gas / GLP', meaning: 'Escape o rotura en cilindro o red de gas licuado / natural en vía pública o vivienda.', exampleCall: 'B-6 procede a 10-1 con detector de gases en Calle Principal.' },
  { code: '10-2', category: 'sistema_10', title: 'Pastizal o Incendio Forestal', meaning: 'Fuego en vegetación, matorral, rastrojo, pasto seco, bosque de pino o eucalipto.', exampleCall: 'Alerta Roja 10-2 Cuesta Menque, fuego avanza a copas con viento puelche.', critical: true },
  { code: '10-3', category: 'sistema_10', title: 'Rescate de Personas', meaning: 'Rescate de persona atrapada en altura, foso, ascensor o espacio confinado.', exampleCall: 'B-6 y BF-6 a 10-3, persona desbarrancada en Quebrada Honda.' },
  { code: '10-4', category: 'sistema_10', title: 'Accidente Vehicular', meaning: 'Colisión, choque, volcamiento o atropello con o sin personas atrapadas.', exampleCall: '10-4 en Ruta O-252 Menque-Tomé, volcamiento de camión forestal con derrame de combustible.', critical: true },
  { code: '10-5', category: 'sistema_10', title: 'Materiales Peligrosos (HazMat)', meaning: 'Incidente con sustancias químicas tóxicas, explosivas, corrosivas o radiactivas.', exampleCall: '10-5 sector industrial Tomé, perímetro de aislamiento 200 metros a barlovento.' },
  { code: '10-6', category: 'sistema_10', title: 'Derrumbe o Remoción en Masa', meaning: 'Colapso de estructura, socavón, derrumbe de ladera o caída de rocas.', exampleCall: '10-6 Cuesta Menque por corte de talud, vía intransitable para carros.', critical: true },
  { code: '10-7', category: 'sistema_10', title: 'Fuego en Vehículo', meaning: 'Incendio en automóvil, camión, bus, maquinaria agrícola o forestal.', exampleCall: 'B-6 trabajando en 10-7, vehículo ardiendo con riesgo de propagación a pastizal.' },
  { code: '10-8', category: 'sistema_10', title: 'Fuego en Basura / Escombros', meaning: 'Fuego en microbasural, vertedero o restos de poda.', exampleCall: 'B-6 procede a 10-8 en camino vecinal, línea de 38mm extinguiendo.' },
  { code: '10-9', category: 'sistema_10', title: 'Solicitud de Carro Aljibe (Z)', meaning: 'Petición urgente de camión cisterna para abastecimiento continuo de agua.', exampleCall: 'Comandancia Tomé, 6ta Compañía solicita despacho de Z-Tomé por 10-9 prioritario.', critical: true },
  { code: '10-10', category: 'sistema_10', title: 'Inspección o Rebrote', meaning: 'Revisión técnica de amago o verificación de puntos calientes con cámara térmica.', exampleCall: 'B-6 a 10-10, monitoreo de perímetro frío en Menque.' },
  { code: '10-11', category: 'sistema_10', title: 'Servicio Aéreo / Conaf', meaning: 'Coordinación con helicópteros o aviones cisterna AT-802 y brigadas CONAF.', exampleCall: '10-11 activo, despejar zona de lanzamiento aéreo en flanco izquierdo.' },
  { code: '10-12', category: 'sistema_10', title: 'Apoyo Policial / Carabineros', meaning: 'Solicitud de corte de tránsito o resguardo de seguridad en zona de operaciones.', exampleCall: 'Solicitamos 10-12 urgente para corte total en Cuesta Menque por avance de pavesas.' },
  { code: '10-14', category: 'sistema_10', title: 'Rescate Acuático / Marítimo', meaning: 'Emergencia en mar, playa, laguna o tromba marina en borde costero.', exampleCall: '10-14 Caleta Cocholgüe / Dichato, embarcación volcada por tromba.' },

  // Claves 0: Estado Operacional de Máquinas y Personal
  { code: '0-1', category: 'claves_0', title: 'En el Lugar de la Emergencia', meaning: 'Unidad o bombero ha arribado a la dirección del incidente.', exampleCall: 'B-6 con 0-1 en Menque Centro, asume mando Teniente Mato.' },
  { code: '0-2', category: 'claves_0', title: 'A Cargo del Incidente', meaning: 'Identificación del oficial o voluntario con mayor jerarquía al mando.', exampleCall: '0-2 en el llamado: Teniente 1ro Jorge Mato Garrido.' },
  { code: '0-3', category: 'claves_0', title: 'Solicita Relevo de Personal', meaning: 'Personal exhausto, con estrés térmico o fin de turno operativo.', exampleCall: 'Solicitamos 0-3 para cuadrilla de ataque de Sexta Menque.' },
  { code: '0-4', category: 'claves_0', title: 'En Cuartel', meaning: 'La unidad o voluntario se encuentra físicamente en el cuartel.', exampleCall: 'B-6 con 0-4 disponible para segundo llamado.' },
  { code: '0-5', category: 'claves_0', title: 'En Trayecto hacia la Emergencia', meaning: 'Carro salió del cuartel y va en camino con balizas y sirenas.', exampleCall: 'B-6 con 0-5 hacia sector Rafael con 5 voluntarios a bordo.' },
  { code: '0-7', category: 'claves_0', title: 'Disponible / En Servicio', meaning: 'Unidad con estanque lleno, petróleo y tripulación lista para despacho.', exampleCall: 'B-6 queda 0-7 radial en jurisdicción Tomé.' },
  { code: '0-8', category: 'claves_0', title: 'Fuera de Servicio / No Operativo', meaning: 'Carro o equipo en panne mecánica, mantención o sin chofer.', exampleCall: 'B-6 temporalmente 0-8 por cambio de neumático en Cuesta Menque.' },
  { code: '0-9', category: 'claves_0', title: 'Retirándose hacia Cuartel', meaning: 'Emergencia controlada, material recogido y carro retornando.', exampleCall: 'B-6 con 0-9 hacia Cuartel Sexta Menque.' },
  { code: '0-10', category: 'claves_0', title: 'Servicio Terminado / Cierre', meaning: 'Fin oficial del acto de servicio y de la transmisión radial.', exampleCall: '0-10 para Sexta Compañía en incendio forestal Menque.' },

  // Claves de Cargos y Oficiales
  { code: '1-0', category: 'claves_oficiales', title: 'Director de Compañía', meaning: 'Máxima autoridad administrativa (Guillermo Retamal Vergara).', exampleCall: '1-0 Sexta Menque a la escucha.' },
  { code: '1-1', category: 'claves_oficiales', title: 'Capitán de Compañía', meaning: 'Máxima autoridad técnica y de mando en combate.', exampleCall: '1-1 asume Puesto de Mando Unificado.' },
  { code: '1-2', category: 'claves_oficiales', title: 'Teniente 1°', meaning: 'Segundo oficial de mando operativo (Jorge Mato Garrido).', exampleCall: '1-2 lidera sector flanco derecho.' },
  { code: '1-7', category: 'claves_oficiales', title: 'Maquinista', meaning: 'Conductor y operador de bomba (Ricardo Jara / Eduardo Albornoz / Jorge Mato).', exampleCall: '1-7 de B-6 informe presión en línea troncal.' },
  { code: '1-8', category: 'claves_oficiales', title: 'Ayudante de Compañía', meaning: 'Oficial de apoyo táctico y de registro (Miguel Palma González).', exampleCall: '1-8 registre PAR de 16 voluntarios.' },
];

export const RadioCodesGuide: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'sistema_10' | 'claves_0' | 'claves_oficiales'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCodes = CHILEAN_RADIO_CODES.filter(item => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.exampleCall.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
                <Radio className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-wide">
                  GUÍA TÁCTICA DE CLAVES RADIALES — BOMBEROS DE CHILE (SISTEMA 10)
                </h2>
                <p className="text-xs text-zinc-400">
                  Manual de radiocomunicaciones VHF en frecuencia CB Tomé (Canal 3 Menque y Canal Comandancia).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
              Canal 3 VHF: <strong>155.125 MHz Táctico Forestal</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (10-2), tipo o frase..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todas las Claves' },
            { id: 'sistema_10', label: 'Sistema 10 (Emergencias)' },
            { id: 'claves_0', label: 'Claves 0 (Máquinas)' },
            { id: 'claves_oficiales', label: 'Oficialidad 1-X' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-orange-600 text-white shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radio Code Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCodes.map(item => (
          <div
            key={item.code}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              item.critical
                ? 'bg-zinc-900/90 border-orange-500/50 hover:border-orange-400 shadow-md shadow-orange-950/20'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-orange-400 tracking-tight">
                  {item.code}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                  item.category === 'sistema_10'
                    ? 'bg-red-950/60 text-red-300 border-red-800'
                    : item.category === 'claves_0'
                    ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                    : 'bg-amber-950/60 text-amber-300 border-amber-800'
                }`}>
                  {item.category.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.meaning}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 italic flex items-start gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">"{item.exampleCall}"</span>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(item.exampleCall, item.code)}
                  className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer transition-colors"
                >
                  {copiedCode === item.code ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar frase radial</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
