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
  TrendingDown,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  costo: number;
  precioPublico: number;
  gananciaPercentaje: number;
  cantidadInicial: number;
  cantidadVendida: number;
  cantidadActual: number;
  historial: HistorialItem[];
}

interface Tienda {
  id: string;
  nombre: string;
  productos: Producto[];
}

// --- Main App ---
export default function App() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [nuevoNombreTienda, setNuevoNombreTienda] = useState('');
  const [editandoTiendaId, setEditandoTiendaId] = useState<string | null>(null);
  const [editandoNombreTienda, setEditandoNombreTienda] = useState('');
  const [tiendaActivaIdx, setTiendaActivaIdx] = useState<number>(-1); // -1 for Dashboard
  const [busqueda, setBusqueda] = useState('');
  
  // UI States
  const [productoEnEdicion, setProductoEnEdicion] = useState<string | null>(null);
  const [valoresEdicion, setValoresEdicion] = useState<Partial<Producto>>({});
  const [ventasTemporal, setVentasTemporal] = useState<Record<string, string>>({});
  const [idHistorialAbierto, setIdHistorialAbierto] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('inventario_v2');
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
    localStorage.setItem('inventario_v2', JSON.stringify(tiendas));
  }, [tiendas]);

  // --- Logic Helpers ---

  const handleAgregarTienda = () => {
    if (!nuevoNombreTienda.trim()) return;
    const newStore: Tienda = {
      id: crypto.randomUUID(),
      nombre: nuevoNombreTienda.trim(),
      productos: []
    };
    setTiendas([...tiendas, newStore]);
    setNuevoNombreTienda('');
    setTiendaActivaIdx(tiendas.length); // Switch to the new store
  };

  const handleEliminarTienda = (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tienda y todo su inventario?')) return;
    const filtered = tiendas.filter(t => t.id !== id);
    setTiendas(filtered);
    setTiendaActivaIdx(-1);
  };

  const handleRenombrarTienda = (id: string) => {
    if (!editandoNombreTienda.trim()) return;
    setTiendas(tiendas.map(t => t.id === id ? { ...t, nombre: editandoNombreTienda.trim() } : t));
    setEditandoTiendaId(null);
  };

  const handleAgregarProductoManual = () => {
    if (tiendaActivaIdx === -1) return;
    const newProd: Producto = {
      id: crypto.randomUUID(),
      sku: 'NUEVO-' + Math.floor(Math.random() * 1000),
      nombre: 'Nuevo Producto',
      costo: 0,
      precioPublico: 0,
      gananciaPercentaje: 0,
      cantidadInicial: 0,
      cantidadVendida: 0,
      cantidadActual: 0,
      historial: [{
        id: crypto.randomUUID(),
        fecha: new Date().toLocaleString(),
        evento: 'Creación manual',
        cantidad: 0
      }]
    };
    const updated = [...tiendas];
    updated[tiendaActivaIdx].productos.unshift(newProd);
    setTiendas(updated);
    setProductoEnEdicion(newProd.id);
    setValoresEdicion(newProd);
  };

  const handleRegistrarVenta = (productoId: string) => {
    const qtyStr = ventasTemporal[productoId];
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) return;

    const updated = [...tiendas];
    const tienda = updated[tiendaActivaIdx];
    const prodIdx = tienda.productos.findIndex(p => p.id === productoId);
    const prod = tienda.productos[prodIdx];

    if (prod.cantidadActual < qty) {
      alert('Stock insuficiente para esta venta.');
      return;
    }

    prod.cantidadVendida += qty;
    prod.cantidadActual -= qty;
    prod.historial.push({
      id: crypto.randomUUID(),
      fecha: new Date().toLocaleString(),
      evento: 'Venta registrada',
      cantidad: -qty
    });

    setTiendas(updated);
    setVentasTemporal(prev => ({ ...prev, [productoId]: '' }));
  };

  const handleGuardarEdicionProducto = () => {
    if (!productoEnEdicion) return;
    const updated = [...tiendas];
    const tienda = updated[tiendaActivaIdx];
    const prodIdx = tienda.productos.findIndex(p => p.id === productoEnEdicion);
    
    // Calculate new current stock based on new initial - existing sold
    const newInitial = Number(valoresEdicion.cantidadInicial ?? tienda.productos[prodIdx].cantidadInicial);
    const existingSold = tienda.productos[prodIdx].cantidadVendida;
    
    tienda.productos[prodIdx] = {
      ...tienda.productos[prodIdx],
      ...valoresEdicion,
      cantidadActual: newInitial - existingSold,
      historial: [
        ...tienda.productos[prodIdx].historial,
        {
          id: crypto.randomUUID(),
          fecha: new Date().toLocaleString(),
          evento: 'Edición de datos',
          cantidad: 0
        }
      ]
    };

    setTiendas(updated);
    setProductoEnEdicion(null);
    setValoresEdicion({});
  };

  const handleEliminarProducto = (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    const updated = [...tiendas];
    updated[tiendaActivaIdx].productos = updated[tiendaActivaIdx].productos.filter(p => p.id !== id);
    setTiendas(updated);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || tiendaActivaIdx === -1) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Basic CSV parsing (comma or tab separated)
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const headers = lines[0].split(/[,\t]/).map(h => h.trim().toLowerCase());
        
        const newProducts: Producto[] = lines.slice(1).map(line => {
          const vals = line.split(/[,\t]/).map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = vals[i]);
          
          const costo = parseFloat(obj.costo) || 0;
          const precio = parseFloat(obj.precio) || 0;
          const inicial = parseInt(obj.inicial) || 0;

          return {
            id: crypto.randomUUID(),
            sku: obj.sku || ('SKU-' + Math.floor(Math.random() * 1000)),
            nombre: obj.nombre || 'Producto Importado',
            costo: costo,
            precioPublico: precio,
            gananciaPercentaje: precio > 0 ? (Math.round(((precio - costo) / precio) * 100)) : 0,
            cantidadInicial: inicial,
            cantidadVendida: 0,
            cantidadActual: inicial,
            historial: [{
              id: crypto.randomUUID(),
              fecha: new Date().toLocaleString(),
              evento: 'Importación Excel',
              cantidad: inicial
            }]
          };
        });

        const updated = [...tiendas];
        updated[tiendaActivaIdx].productos = [...updated[tiendaActivaIdx].productos, ...newProducts];
        setTiendas(updated);
        alert(`Se importaron ${newProducts.length} productos.`);
      } catch (err) {
        console.error(err);
        alert('Error al procesar el archivo. Asegúrate de que sea un CSV válido con los encabezados: sku, nombre, costo, precio, inicial');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    if (tiendaActivaIdx === -1) return;
    const store = tiendas[tiendaActivaIdx];
    const headers = ['SKU', 'Nombre', 'Costo', 'Precio', 'Ganancia%', 'Inicial', 'Vendidas', 'Actual'];
    const rows = store.productos.map(p => [
      p.sku,
      p.nombre,
      p.costo,
      p.precioPublico,
      p.gananciaPercentaje,
      p.cantidadInicial,
      p.cantidadVendida,
      p.cantidadActual
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_${store.nombre.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Computations ---

  const activeStore = tiendas[tiendaActivaIdx];
  const filteredProducts = useMemo(() => {
    if (!activeStore) return [];
    if (!busqueda) return activeStore.productos;
    const q = busqueda.toLowerCase();
    return activeStore.productos.filter(p => 
      p.nombre.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q)
    );
  }, [activeStore, busqueda]);

  const stats = useMemo(() => {
    if (tiendaActivaIdx === -1) {
      // General Dashboard Stats
      return {
        totalProducts: tiendas.reduce((acc, t) => acc + t.productos.length, 0),
        totalValue: tiendas.reduce((acc, t) => acc + t.productos.reduce((sum, p) => sum + (p.cantidadActual * p.precioPublico), 0), 0),
        totalVentas: tiendas.reduce((acc, t) => acc + t.productos.reduce((sum, p) => sum + (p.cantidadVendida * p.precioPublico), 0), 0),
        lowStock: tiendas.reduce((acc, t) => acc + t.productos.filter(p => p.cantidadActual > 0 && p.cantidadActual < 5).length, 0),
        outOfStock: tiendas.reduce((acc, t) => acc + t.productos.filter(p => p.cantidadActual === 0).length, 0)
      };
    } else {
      // Single Store Stats
      const prods = tiendas[tiendaActivaIdx].productos;
      return {
        totalProducts: prods.length,
        totalValue: prods.reduce((sum, p) => sum + (p.cantidadActual * p.precioPublico), 0),
        totalVentas: prods.reduce((sum, p) => sum + (p.cantidadVendida * p.precioPublico), 0),
        lowStock: prods.filter(p => p.cantidadActual > 0 && p.cantidadActual < 5).length,
        outOfStock: prods.filter(p => p.cantidadActual === 0).length
      };
    }
  }, [tiendas, tiendaActivaIdx]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar - Store List */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Package size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">ShopInvent</h1>
          </div>

          <button 
            onClick={() => setTiendaActivaIdx(-1)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              tiendaActivaIdx === -1 
                ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Resumen Global</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
            <span>Tiendas</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-full">{tiendas.length}</span>
          </div>

          <div className="space-y-1">
            {tiendas.map((tienda, idx) => (
              <div key={tienda.id} className="group relative">
                <button
                  onClick={() => setTiendaActivaIdx(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    tiendaActivaIdx === idx 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 font-medium' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Store size={18} />
                  <span className="flex-1 text-left truncate">{tienda.nombre}</span>
                  <ChevronRight size={16} className={`opacity-40 ${tiendaActivaIdx === idx ? 'hidden' : 'block group-hover:block'}`} />
                </button>
                
                {/* Store mini-actions visible only on hover */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
                  <button 
                    onClick={() => { setEditandoTiendaId(tienda.id); setEditandoNombreTienda(tienda.nombre); }}
                    className={`p-1.5 rounded-md ${tiendaActivaIdx === idx ? 'text-indigo-200 hover:text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleEliminarTienda(tienda.id)}
                    className={`p-1.5 rounded-md ${tiendaActivaIdx === idx ? 'text-indigo-200 hover:text-white' : 'text-slate-400 hover:text-red-500'}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* New Store Input */}
          <div className="pt-4 border-t border-slate-100">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Nueva tienda..." 
                value={nuevoNombreTienda}
                onChange={(e) => setNuevoNombreTienda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAgregarTienda()}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button 
                onClick={handleAgregarTienda}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm hover:scale-110 active:scale-95 transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
        
        {/* Top bar with breadcrumbs or dashboard title */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {tiendaActivaIdx === -1 ? 'Dashboard Global' : activeStore.nombre}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {tiendaActivaIdx === -1 
                ? `Viendo métricas de ${tiendas.length} tiendas` 
                : `Gestionando inventario de ${activeStore.productos.length} productos`}
            </p>
          </div>

          {tiendaActivaIdx !== -1 && (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm"
              >
                <Download size={16} />
                <span>Exportar</span>
              </button>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-100 transition-all">
                <Upload size={16} />
                <span>Importar</span>
                <input type="file" className="hidden" accept=".csv" onChange={handleImportExcel} />
              </label>
            </div>
          )}
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Package size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400">STOCK</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats.totalProducts}</div>
            <p className="text-xs text-slate-500 mt-2">Productos únicos totales</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400">VALOR INVENTARIO</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">${stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-indigo-500 mt-2 font-semibold">Precios al público</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400">VENTAS TOTALES</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">${stats.totalVentas.toLocaleString()}</div>
            <p className="text-xs text-emerald-500 mt-2 font-semibold">Monto recaudado</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400">ALERTAS STOCK</span>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-slate-800">{stats.lowStock + stats.outOfStock}</div>
              <span className="text-xs text-slate-400 font-medium">{stats.outOfStock} agotados</span>
            </div>
            <p className="text-xs text-orange-500 mt-2 font-semibold">Necesitan reposición</p>
          </div>
        </section>

        {/* Content Section */}
        {tiendaActivaIdx === -1 ? (
          // DASHBOARD CONTENT
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-bold">Estado de Tiendas</h3>
            </div>
            <div className="p-0">
              {tiendas.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic">No hay tiendas registradas aún.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {tiendas.map((t, idx) => (
                    <div key={t.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => setTiendaActivaIdx(idx)}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                          <Store size={24} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{t.nombre}</div>
                          <div className="text-sm text-slate-500">{t.productos.length} productos en catálogo</div>
                        </div>
                      </div>
                      <div className="flex gap-10">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-400 mb-1">VALOR STOCK</div>
                          <div className="font-semibold text-slate-700">
                            ${t.productos.reduce((sum, p) => sum + (p.cantidadActual * p.precioPublico), 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-400 mb-1">VENTAS</div>
                          <div className="font-semibold text-emerald-600">
                            ${t.productos.reduce((sum, p) => sum + (p.cantidadVendida * p.precioPublico), 0).toLocaleString()}
                          </div>
                        </div>
                        <ChevronRight className="text-slate-300 mt-4" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          // STORE INVENTORY CONTENT
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o SKU..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={handleAgregarProductoManual}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-sm"
              >
                <Plus size={20} />
                <span>Nuevo Producto</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Costo / Precio</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Vender</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-600">{p.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{p.nombre}</div>
                        <div className="text-xs text-slate-500 mt-1">Margen: {p.gananciaPercentaje}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-xs line-through">${p.costo.toFixed(2)}</span>
                          <span className="text-indigo-600 font-bold">${p.precioPublico.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            p.cantidadActual === 0 ? 'bg-red-50 text-red-600' :
                            p.cantidadActual < 5 ? 'bg-orange-50 text-orange-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {p.cantidadActual} {p.cantidadActual === 1 ? 'unidad' : 'unidades'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">Inició con: {p.cantidadInicial}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <input 
                            type="number" 
                            placeholder="Qty" 
                            value={ventasTemporal[p.id] || ''}
                            onChange={(e) => setVentasTemporal(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center outline-none focus:ring-1 focus:ring-indigo-300"
                          />
                          <button 
                            onClick={() => handleRegistrarVenta(p.id)}
                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                          >
                            <TrendingUp size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setIdHistorialAbierto(p.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => { setProductoEnEdicion(p.id); setValoresEdicion(p); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleEliminarProducto(p.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                        No se encontraron productos en esta tienda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* --- Modals / Sheets --- */}

      {/* Edit Store Modal */}
      <AnimatePresence>
        {editandoTiendaId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Renombrar Tienda</h3>
                <input 
                  type="text" 
                  value={editandoNombreTienda}
                  onChange={(e) => setEditandoNombreTienda(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setEditandoTiendaId(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleRenombrarTienda(editandoTiendaId)}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {productoEnEdicion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Editar Producto</h3>
                  <p className="text-slate-400 text-sm">Ajusta los parámetros del inventario</p>
                </div>
                <button onClick={() => setProductoEnEdicion(null)} className="p-3 bg-slate-100 rounded-2xl text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Nombre del Producto</label>
                    <input 
                      type="text" 
                      value={valoresEdicion.nombre || ''}
                      onChange={(e) => setValoresEdicion({ ...valoresEdicion, nombre: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Código SKU</label>
                    <input 
                      type="text" 
                      value={valoresEdicion.sku || ''}
                      onChange={(e) => setValoresEdicion({ ...valoresEdicion, sku: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Costo Unitario</label>
                      <input 
                        type="number" 
                        value={valoresEdicion.costo || 0}
                        onChange={(e) => setValoresEdicion({ ...valoresEdicion, costo: parseFloat(e.target.value) })}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Precio Público</label>
                      <input 
                        type="number" 
                        value={valoresEdicion.precioPublico || 0}
                        onChange={(e) => {
                          const precio = parseFloat(e.target.value);
                          const costo = valoresEdicion.costo || 0;
                          const margen = precio > 0 ? Math.round(((precio - costo) / precio) * 100) : 0;
                          setValoresEdicion({ ...valoresEdicion, precioPublico: precio, gananciaPercentaje: margen });
                        }}
                        className="w-full px-5 py-4 bg-indigo-50/50 border-2 border-indigo-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-indigo-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Cantidad Inicial (Total Stock)</label>
                    <input 
                      type="number" 
                      value={valoresEdicion.cantidadInicial || 0}
                      onChange={(e) => setValoresEdicion({ ...valoresEdicion, cantidadInicial: parseInt(e.target.value) })}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 italic">* El stock actual se calculará como: Inicial - Ventas realizadas.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setProductoEnEdicion(null)}
                  className="px-8 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleGuardarEdicionProducto}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Actualizar Producto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {idHistorialAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-[2px]">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Historial de Movimientos</h3>
                <button onClick={() => setIdHistorialAbierto(null)} className="p-2 hover:bg-slate-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {tiendas[tiendaActivaIdx].productos
                    .find(p => p.id === idHistorialAbierto)?.historial
                    .slice().reverse().map((h) => (
                      <div key={h.id} className="relative pl-10">
                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                          h.cantidad < 0 ? 'bg-orange-500' : h.cantidad > 0 ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}>
                          {h.cantidad === 0 ? <Edit2 size={10} className="text-white" /> : <ChevronRight size={12} className={`text-white ${h.cantidad < 0 ? 'rotate-90' : '-rotate-90'}`} />}
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-800 text-sm">{h.evento}</span>
                            {h.cantidad !== 0 && (
                              <span className={`text-xs font-bold ${h.cantidad < 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                {h.cantidad > 0 ? '+' : ''}{h.cantidad}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{h.fecha}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
