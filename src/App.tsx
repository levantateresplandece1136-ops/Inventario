import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Eye, 
  Search, 
  Store, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';

// --- Types ---
interface HistorialItem {
  id: string;
  fecha: string;
  evento: string;
  cantidad: number;
}

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  costo: number; // Linked to "PRECIO UNITARIO CON IVA"
  precioPublico: number; // Linked to "Publico"
  gananciaPercentaje: number; // Linked to "Ganancia"
  stockTienda: number; // Linked to "Tienda"
  stockJosue: number; // Linked to "Josué"
  cantidadActual: number; // Linked to "Cantidad" (Autosuma: Tienda + Josue)
  cantidadVendida: number;
  historial: HistorialItem[];
}

interface Tienda {
  id: string;
  nombre: string;
  productos: Producto[];
}

// --- App Component ---
export default function App() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const navigate = useNavigate();

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('inventario_v3');
    if (saved) {
      try {
        setTiendas(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading inventory:', e);
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('inventario_v3', JSON.stringify(tiendas));
  }, [tiendas]);

  const handleUpdateTiendas = (newTiendas: Tienda[]) => {
    setTiendas(newTiendas);
  };

  return (
    <Routes>
      <Route path="/" element={<Dashboard tiendas={tiendas} setTiendas={handleUpdateTiendas} navigate={navigate} />} />
      <Route path="/store/:storeId" element={<StoreView tiendas={tiendas} setTiendas={handleUpdateTiendas} navigate={navigate} />} />
    </Routes>
  );
}

// --- Dashboard Component ---
function Dashboard({ tiendas, setTiendas, navigate }: { tiendas: Tienda[], setTiendas: (t: Tienda[]) => void, navigate: any }) {
  const [nuevoNombreTienda, setNuevoNombreTienda] = useState('');
  
  const handleAgregarTienda = () => {
    if (!nuevoNombreTienda.trim()) return;
    const newStore: Tienda = {
      id: crypto.randomUUID(),
      nombre: nuevoNombreTienda.trim(),
      productos: []
    };
    setTiendas([...tiendas, newStore]);
    setNuevoNombreTienda('');
    navigate(`/store/${newStore.id}`);
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/store/${id}`;
    navigator.clipboard.writeText(url);
    alert('Enlace de la tienda copiado al portapapeles');
  };

  const stats = useMemo(() => ({
    totalProducts: tiendas.reduce((acc, t) => acc + t.productos.length, 0),
    totalValue: tiendas.reduce((acc, t) => acc + t.productos.reduce((sum, p) => sum + (p.cantidadActual * p.precioPublico), 0), 0),
    totalVentas: tiendas.reduce((acc, t) => acc + t.productos.reduce((sum, p) => sum + (p.cantidadVendida * p.precioPublico), 0), 0),
  }), [tiendas]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar tiendas={tiendas} activeId={undefined} navigate={navigate} />
      
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800">Panel de Control Matriz</h2>
          <p className="text-slate-500">Gestión centralizada de todas las sucursales</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <StatCard icon={<Package className="text-blue-600" />} label="Productos Totales" value={stats.totalProducts.toString()} sub="En todas las tiendas" />
           <StatCard icon={<TrendingUp className="text-indigo-600" />} label="Valor Total Inventario" value={`$${stats.totalValue.toLocaleString()}`} sub="Precio Público" />
           <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Ventas Registradas" value={`$${stats.totalVentas.toLocaleString()}`} sub="Total Histórico" />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold">Listado de Tiendas</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nombre de nueva tienda..." 
                value={nuevoNombreTienda}
                onChange={(e) => setNuevoNombreTienda(e.target.value)}
                className="px-4 py-2 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-48"
              />
              <button onClick={handleAgregarTienda} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1">
                <Plus size={16} /> Crear
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {tiendas.map(t => (
              <div key={t.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => navigate(`/store/${t.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Store size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{t.nombre}</div>
                    <div className="text-xs text-slate-500">{t.productos.length} productos</div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">VALOR</div>
                    <div className="font-bold text-slate-700">${t.productos.reduce((sum, p) => sum + (p.cantidadActual * p.precioPublico), 0).toLocaleString()}</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(t.id); }}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all hover:shadow-md"
                    title="Compartir Inventario"
                  >
                    <Share2 size={18} />
                  </button>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Store View Component ---
function StoreView({ tiendas, setTiendas, navigate }: { tiendas: Tienda[], setTiendas: (t: Tienda[]) => void, navigate: any }) {
  const { storeId } = useParams();
  const storeIdx = tiendas.findIndex(t => t.id === storeId);
  const tienda = tiendas[storeIdx];

  const [busqueda, setBusqueda] = useState('');
  const [productoEnEdicion, setProductoEnEdicion] = useState<string | null>(null);
  const [valoresEdicion, setValoresEdicion] = useState<Partial<Producto>>({});
  const [ventasTemporal, setVentasTemporal] = useState<Record<string, string>>({});
  const [idHistorialAbierto, setIdHistorialAbierto] = useState<string | null>(null);

  if (!tienda) return <div className="p-20 text-center">Tienda no encontrada. <button onClick={() => navigate('/')}>Volver</button></div>;

  const filteredProducts = useMemo(() => {
    if (!busqueda) return tienda.productos;
    const q = busqueda.toLowerCase();
    return tienda.productos.filter(p => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [tienda.productos, busqueda]);

  const handleUpdateProduct = (prodId: string, updates: Partial<Producto>) => {
    const newTiendas = [...tiendas];
    const t = newTiendas[storeIdx];
    const pIdx = t.productos.findIndex(p => p.id === prodId);
    
    // Autosuma calculation
    const currentProd = t.productos[pIdx];
    const updatedProd = { ...currentProd, ...updates };
    
    // If Tienda or Josue stock changes, update Cantidad Actual (Total)
    if ('stockTienda' in updates || 'stockJosue' in updates) {
      updatedProd.cantidadActual = (updatedProd.stockTienda || 0) + (updatedProd.stockJosue || 0);
    }

    t.productos[pIdx] = updatedProd;
    setTiendas(newTiendas);
  };

  const handleRegistrarVenta = (prodId: string) => {
    const qty = parseInt(ventasTemporal[prodId]);
    if (isNaN(qty) || qty <= 0) return;

    const prod = tienda.productos.find(p => p.id === prodId);
    if (!prod || prod.cantidadActual < qty) return alert('Stock insuficiente');

    // Logic: subtract from Tienda stock by default or prompt? 
    // Let's subtract from total and also Tienda (as priority) for simplicity
    const newStockTienda = Math.max(0, prod.stockTienda - qty);
    const remainder = Math.max(0, qty - prod.stockTienda);
    const newStockJosue = Math.max(0, prod.stockJosue - remainder);

    const newHistorial = [...prod.historial, {
      id: crypto.randomUUID(),
      fecha: new Date().toLocaleString(),
      evento: 'Venta registrada',
      cantidad: -qty
    }];

    handleUpdateProduct(prodId, {
      stockTienda: newStockTienda,
      stockJosue: newStockJosue,
      cantidadActual: newStockTienda + newStockJosue,
      cantidadVendida: prod.cantidadVendida + qty,
      historial: newHistorial
    });

    setVentasTemporal(prev => ({ ...prev, [prodId]: '' }));
  };

  const handleAgregarManual = () => {
    const newProd: Producto = {
      id: crypto.randomUUID(),
      sku: 'SKU-' + Math.floor(Math.random() * 1000),
      nombre: 'Nuevo Producto',
      costo: 0,
      precioPublico: 0,
      gananciaPercentaje: 0,
      stockTienda: 0,
      stockJosue: 0,
      cantidadActual: 0,
      cantidadVendida: 0,
      historial: [{ id: crypto.randomUUID(), fecha: new Date().toLocaleString(), evento: 'Creación manual', cantidad: 0 }]
    };
    const newTiendas = [...tiendas];
    newTiendas[storeIdx].productos.unshift(newProd);
    setTiendas(newTiendas);
    setProductoEnEdicion(newProd.id);
    setValoresEdicion(newProd);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const headers = lines[0].split(/[,\t]/).map(h => h.trim().toLowerCase());
        const newProducts: Producto[] = lines.slice(1).map(line => {
          const vals = line.split(/[,\t]/).map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = vals[i]);
          const costo = parseFloat(obj.costo) || 0;
          const precio = parseFloat(obj.precio) || 0;
          const sTienda = parseInt(obj.tienda) || 0;
          const sJosue = parseInt(obj.josue) || 0;
          return {
            id: crypto.randomUUID(),
            sku: obj.sku || 'N/A',
            nombre: obj.nombre || 'Producto Importado',
            costo,
            precioPublico: precio,
            gananciaPercentaje: precio > 0 ? Math.round(((precio - costo) / precio) * 100) : 0,
            stockTienda: sTienda,
            stockJosue: sJosue,
            cantidadActual: sTienda + sJosue,
            cantidadVendida: 0,
            historial: [{ id: crypto.randomUUID(), fecha: new Date().toLocaleString(), evento: 'Importación', cantidad: sTienda + sJosue }]
          };
        });
        const newTiendas = [...tiendas];
        newTiendas[storeIdx].productos = [...newTiendas[storeIdx].productos, ...newProducts];
        setTiendas(newTiendas);
        alert(`Importados ${newProducts.length} productos`);
      } catch (err) { alert('Error de importación'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Sidebar tiendas={tiendas} activeId={storeId} navigate={navigate} />

      <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800">{tienda.nombre}</h2>
            <p className="text-slate-500">Gestión de inventario local</p>
          </div>
          <div className="flex gap-2">
            <label className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-50">
              <Upload size={16} /> Importar
              <input type="file" className="hidden" accept=".csv" onChange={handleImportExcel} />
            </label>
            <button onClick={handleAgregarManual} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100">
              <Plus size={16} /> Nuevo
            </button>
          </div>
        </header>

        <div className="mb-6 relative max-w-xl">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
              type="text" 
              placeholder="Buscar por código o producto..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
           />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">CÓDIGO</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">PRODUCTO</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">PRECIO UNITARIO CON IVA</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Publico</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ganancia</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Tienda</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Josué</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">venta</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold ${p.cantidadActual < 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {p.cantidadActual}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{p.sku}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{p.nombre}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">${p.costo.toFixed(2)}</td>
                    <td className="px-6 py-4 text-indigo-600 font-bold">${p.precioPublico.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="text-emerald-600 font-bold">{p.gananciaPercentaje}%</div>
                      <div className="text-[10px] text-slate-400">${(p.precioPublico - p.costo).toFixed(2)} gain</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{p.stockTienda}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{p.stockJosue}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={ventasTemporal[p.id] || ''}
                          onChange={(e) => setVentasTemporal({ ...ventasTemporal, [p.id]: e.target.value })}
                          className="w-12 px-1 py-1 bg-slate-50 border rounded text-xs text-center"
                        />
                        <button onClick={() => handleRegistrarVenta(p.id)} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                          <TrendingUp size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setProductoEnEdicion(p.id); setValoresEdicion(p); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setIdHistorialAbierto(p.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => { if(confirm('Eliminar?')) setTiendas(tiendas.map(st => st.id === tienda.id ? { ...st, productos: st.productos.filter(pr => pr.id !== p.id) } : st)) }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {productoEnEdicion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold">Editar Producto</h3>
                  <button onClick={() => setProductoEnEdicion(null)}><X /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <InputField label="Producto" value={valoresEdicion.nombre || ''} onChange={v => setValoresEdicion({ ...valoresEdicion, nombre: v })} />
                  <InputField label="CÓDIGO (SKU)" value={valoresEdicion.sku || ''} onChange={v => setValoresEdicion({ ...valoresEdicion, sku: v })} />
                  <InputField label="PRECIO UNITARIO CON IVA" type="number" value={valoresEdicion.costo || 0} onChange={v => setValoresEdicion({ ...valoresEdicion, costo: parseFloat(v) })} />
                  <InputField label="Publico" type="number" value={valoresEdicion.precioPublico || 0} onChange={v => {
                    const price = parseFloat(v);
                    const cost = valoresEdicion.costo || 0;
                    const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                    setValoresEdicion({ ...valoresEdicion, precioPublico: price, gananciaPercentaje: margin });
                  }} />
                  <InputField label="Stock Tienda" type="number" value={valoresEdicion.stockTienda || 0} onChange={v => setValoresEdicion({ ...valoresEdicion, stockTienda: parseInt(v) })} />
                  <InputField label="Stock Josué" type="number" value={valoresEdicion.stockJosue || 0} onChange={v => setValoresEdicion({ ...valoresEdicion, stockJosue: parseInt(v) })} />
                </div>
                <button 
                  onClick={() => { if(productoEnEdicion) handleUpdateProduct(productoEnEdicion, valoresEdicion); setProductoEnEdicion(null); }}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                >
                  Guardar Cambios (Autosuma aplicada)
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Historial Sheet */}
        <AnimatePresence>
           {idHistorialAbierto && (
              <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="bg-white w-full max-w-md h-full shadow-2xl p-8 overflow-y-auto">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold">Historial de Movimientos</h3>
                    <button onClick={() => setIdHistorialAbierto(null)}><X /></button>
                  </div>
                  <div className="space-y-4">
                    {tienda.productos.find(p => p.id === idHistorialAbierto)?.historial.slice().reverse().map(h => (
                      <div key={h.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between text-sm font-bold">
                          <span>{h.evento}</span>
                          <span className={h.cantidad < 0 ? 'text-red-500' : 'text-emerald-500'}>{h.cantidad}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase">{h.fecha}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
           )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Shared Components ---
function Sidebar({ tiendas, activeId, navigate }: { tiendas: Tienda[], activeId?: string, navigate: any }) {
  return (
    <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col p-6 h-screen sticky top-0">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Package size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">ShopInvent</h1>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        <button 
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${!activeId ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <LayoutDashboard size={20} /> Dashboard
        </button>
        <div className="pt-4 pb-2 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Tiendas</div>
        {tiendas.map(t => (
          <button 
            key={t.id} 
            onClick={() => navigate(`/store/${t.id}`)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all truncate text-left ${activeId === t.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Store size={18} /> {t.nombre}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
      <div className="mb-4">{icon}</div>
      <div className="text-3xl font-extrabold text-slate-800">{value}</div>
      <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tight">{label}</div>
      <div className="text-[10px] text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text" }: { label: string, value: string | number, onChange: (v: string) => void, type?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-semibold"
      />
    </div>
  );
}
