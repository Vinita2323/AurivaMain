import React, { useState, useMemo } from 'react';
import { Boxes, AlertTriangle, CheckCircle, PackageX, Search, RefreshCw } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import { useAdmin } from '../../../context/AdminContext';

export default function AdminInventory() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { products, updateProductStock, adjustProductStock, bulkRestock } = useAdmin();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'low', 'out', 'healthy'
  const [search, setSearch] = useState('');
  const [restockSuccess, setRestockSuccess] = useState('');

  const lowStockThreshold = 30;

  // Inventory computations
  const totalUnits = products.reduce((acc, p) => acc + (p.stockCount || 0), 0);
  const lowStockProducts = products.filter(p => (p.stockCount || 0) > 0 && (p.stockCount || 0) <= lowStockThreshold);
  const outOfStockProducts = products.filter(p => (p.stockCount || 0) === 0 || p.inStock === false);
  const healthyProducts = products.filter(p => (p.stockCount || 0) > lowStockThreshold && p.inStock !== false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const stock = p.stockCount || 0;
      if (activeTab === 'low' && (stock <= 0 || stock > lowStockThreshold)) return false;
      if (activeTab === 'out' && stock > 0 && p.inStock !== false) return false;
      if (activeTab === 'healthy' && (stock <= lowStockThreshold || p.inStock === false)) return false;

      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.flavor && p.flavor.toLowerCase().includes(q)) || (p.subcategory && p.subcategory.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, activeTab, search]);

  const handleBulkRestock = () => {
    const lowIds = lowStockProducts.concat(outOfStockProducts).map(p => p.id);
    if (lowIds.length === 0) {
      alert("All products have sufficient stock levels!");
      return;
    }
    bulkRestock(lowIds, 100);
    setRestockSuccess(`Successfully replenished +100 units to ${lowIds.length} low-stock products!`);
    setTimeout(() => setRestockSuccess(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title="Inventory & Warehouse Logistics" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-4.5 w-full font-sans">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-600 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Total Units in Hub</span>
                <Boxes className="w-4 h-4 text-[#0E2A1B]" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#0E2A1B]">{totalUnits.toLocaleString('en-IN')}</h2>
              <p className="text-xs text-stone-500 font-medium">Across {products.length} active snack SKUs</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-[#E8E2D5] shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-800 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Healthy Stock</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-emerald-700">{healthyProducts.length}</h2>
              <p className="text-xs text-stone-500 font-medium">&gt; {lowStockThreshold} units available</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/40 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-amber-900 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Low Stock Warning</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-amber-800">{lowStockProducts.length}</h2>
              <p className="text-xs text-amber-800 font-medium">Requires batch reorder</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-rose-200 bg-rose-50/40 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-rose-900 text-xs sm:text-[12px] font-bold uppercase tracking-wider">
                <span>Out of Stock</span>
                <PackageX className="w-4 h-4 text-rose-600" />
              </div>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-rose-800">{outOfStockProducts.length}</h2>
              <p className="text-xs text-rose-800 font-medium">Hidden / Sold out in storefront</p>
            </div>
          </div>

          {restockSuccess && (
            <div className="p-3.5 bg-emerald-100 text-emerald-900 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-between animate-in fade-in">
              <span>{restockSuccess}</span>
              <CheckCircle className="w-4 h-4 text-emerald-700" />
            </div>
          )}

          {/* Action Bar, Search & Filter Tabs */}
          <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E8E2D5] shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-[#FAF7F2] rounded-lg border border-stone-200 text-xs sm:text-sm">
                {[
                  { id: 'all', label: 'All Inventory', count: products.length },
                  { id: 'healthy', label: 'Healthy Stock', count: healthyProducts.length },
                  { id: 'low', label: 'Low Stock Alert', count: lowStockProducts.length },
                  { id: 'out', label: 'Out of Stock', count: outOfStockProducts.length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-md font-bold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#0E2A1B] text-[#D4AF37] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Quick Bulk Restock */}
              <button
                onClick={handleBulkRestock}
                className="px-4 py-2 rounded-lg bg-[#0E2A1B] hover:bg-[#1B3B29] text-[#D4AF37] font-bold text-xs sm:text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
              >
                <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
                <span>Bulk Restock Low Items (+100)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="bg-[#FAF7F2] px-3.5 py-2 rounded-lg border border-stone-200 flex items-center gap-2.5 w-full sm:w-88 text-xs sm:text-sm">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search SKU, flavor or subcategory..."
                className="bg-transparent focus:outline-none text-xs sm:text-sm w-full text-stone-800 placeholder:text-stone-400 font-medium"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl border border-[#E8E2D5] shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left">
                <thead className="bg-[#0E2A1B] text-[#E8DFC8] uppercase tracking-wider text-xs sm:text-[12.5px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Item SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Current Stock Units</th>
                    <th className="py-3.5 px-4">Health Status</th>
                    <th className="py-3.5 px-4 text-right">Instant Stock Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredProducts.map(p => {
                    const count = p.stockCount || 0;
                    const isLow = count > 0 && count <= lowStockThreshold;
                    const isOut = count === 0 || p.inStock === false;

                    return (
                      <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={p.image}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover border border-stone-200 bg-[#FAF7F2] shrink-0"
                            />
                            <div>
                              <div className="font-sans font-bold text-sm sm:text-[15px] text-[#0E2A1B]">{p.name}</div>
                              <span className="text-xs sm:text-[12.5px] text-stone-500 font-medium">{p.flavor || p.subcategory || 'Original'} • {p.weight || '250g'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 capitalize text-stone-700 font-semibold text-xs sm:text-sm">
                          {p.category?.replace('-', ' ')}
                        </td>

                        <td className="py-3 px-4 font-bold text-stone-900 text-sm sm:text-base">
                          ₹{p.price}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={count}
                              onChange={e => updateProductStock(p.id, e.target.value)}
                              className="w-22 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md border border-stone-300 bg-stone-50 focus:outline-none focus:bg-white text-center"
                            />
                            <span className="text-xs sm:text-sm text-stone-600 font-medium">units</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isOut ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                              Low ({count} left)
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              In Stock
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => adjustProductStock(p.id, -10)}
                              className="px-3 py-1.5 rounded-md border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs sm:text-[12.5px] font-bold transition-colors"
                              title="Decrease 10 units"
                            >
                              -10
                            </button>
                            <button
                              onClick={() => adjustProductStock(p.id, 10)}
                              className="px-3 py-1.5 rounded-md border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs sm:text-[12.5px] font-bold transition-colors"
                              title="Add 10 units"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => adjustProductStock(p.id, 50)}
                              className="px-3.5 py-1.5 rounded-md bg-[#0E2A1B] text-[#D4AF37] hover:bg-[#1B3B29] text-xs sm:text-[12.5px] font-bold shadow-2xs transition-colors"
                              title="Add 50 units"
                            >
                              +50
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-stone-200 bg-[#FAF7F2] flex items-center justify-between text-xs sm:text-sm text-stone-600">
              <span className="font-semibold">Showing {filteredProducts.length} items in inventory</span>
              <span className="hidden sm:inline font-medium">Direct live sync with user shopping cart & stock limits</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
