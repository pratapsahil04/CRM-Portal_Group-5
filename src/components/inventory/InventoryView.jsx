import React, { useState } from 'react';
import { Package, Users } from 'lucide-react';
import CountUp from '../CountUp';

export default function InventoryView({ inventory, suppliers, apiCall, fetchInventory, fetchSuppliers, setSuccessMsg, role }) {
  const [partName, setPartName] = useState('');
  const [partNum, setPartNum] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [qty, setQty] = useState('');
  const [minQty, setMinQty] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [showSupForm, setShowSupForm] = useState(false);

  const onAddPart = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }
    try {
      await apiCall('inventory/parts.php', 'POST', {
        supplier_id: supplierId,
        part_number: partNum,
        name: partName,
        quantity: qty,
        minimum_quantity: minQty
      });
      setSuccessMsg('Inventory part saved successfully.');
      fetchInventory();
      setShowAddForm(false);
      setPartName(''); setPartNum(''); setSupplierId(''); setQty(''); setMinQty('');
    } catch(e) {}
  };

  const onAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await apiCall('inventory/suppliers.php', 'POST', {
        name: supName,
        contact_person: supContact,
        phone: supPhone
      });
      setSuccessMsg('Supplier registered.');
      fetchSuppliers();
      setShowSupForm(false);
      setSupName(''); setSupContact(''); setSupPhone('');
    } catch(e) {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
      
      {/* Col 1 & 2: Inventory list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 split-text">
            <Package className="text-[#1f533a] w-5 h-5" /> Spare Parts Catalogue
          </h2>
          {role === 'admin' && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 hud-btn-primary"
            >
              {showAddForm ? 'View Stock list' : '+ Add/Restock Part'}
            </button>
          )}
        </div>

        {showAddForm ? (
          <form onSubmit={onAddPart} className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
            <h3 className="text-lg font-bold text-zinc-900 split-text border-b border-zinc-200 pb-2">Register or Restock Part</h3>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-extrabold mb-2">Select Supplier</label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Part Name</label>
                <input 
                  type="text" 
                  required
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                  placeholder="e.g. Michelin CrossClimate 2"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Part Number (Uppercase & Hyphens)</label>
                <input 
                  type="text" 
                  required
                  value={partNum}
                  onChange={(e) => setPartNum(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors uppercase hud-input"
                  placeholder="e.g. TYR-205-55R16"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Quantity in stock</label>
                <input 
                  type="number" 
                  required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Min Alert Threshold (quantity &gt;= min)</label>
                <input 
                  type="number" 
                  required
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                  placeholder="e.g. 10"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer hud-btn-orange"
            >
              Save Part Details
            </button>
          </form>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden hud-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse hud-table">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-600 text-xs font-extrabold uppercase border-b border-zinc-200">
                    <th className="p-4 pl-6">Part Number</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4 text-center">In Stock</th>
                    <th className="p-4 text-center">Alert lvl</th>
                    <th className="p-4 pr-6 text-right font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 text-xs font-semibold text-zinc-700">
                  {inventory.map(item => (
                    <tr key={item.item_id} className="transition-colors hover:bg-zinc-50/50">
                      <td className="p-4 pl-6 font-mono font-bold text-zinc-500">{item.part_number}</td>
                      <td className="p-4 font-black text-zinc-900">{item.name}</td>
                      <td className="p-4 text-zinc-500">{item.supplier_name}</td>
                      <td className="p-4 text-center font-bold text-zinc-800">
                        <CountUp end={item.quantity} />
                      </td>
                      <td className="p-4 text-center text-zinc-400">{item.minimum_quantity}</td>
                      <td className="p-4 pr-6 text-right">
                        {item.low_stock ? (
                          <span className="bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[10px]">
                            Low Stock
                          </span>
                        ) : (
                          <span className="bg-[#1f533a]/5 border border-[#1f533a]/20 text-[#1f533a] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide text-[10px]">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Col 3: Suppliers list & Add Supplier */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 split-text">
            <Users className="text-[#1f533a] w-5 h-5" /> Suppliers list
          </h2>
          {role === 'admin' && (
            <button 
              onClick={() => setShowSupForm(!showSupForm)}
              className="text-xs text-[#1f533a] font-bold hover:underline uppercase tracking-wider cursor-pointer"
            >
              {showSupForm ? 'Hide form' : '+ Add Supplier'}
            </button>
          )}
        </div>

        {showSupForm ? (
          <form onSubmit={onAddSupplier} className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-500">Add Supplier Profile</h3>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1 font-bold uppercase">Company Name</label>
              <input 
                type="text" 
                required 
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                className="w-full rounded-xl px-4 py-2 text-xs focus:outline-none transition-colors hud-input"
                placeholder="e.g. Apex Auto Supply"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1 font-bold uppercase">Contact Person Name</label>
              <input 
                type="text" 
                value={supContact}
                onChange={(e) => setSupContact(e.target.value)}
                className="w-full rounded-xl px-4 py-2 text-xs focus:outline-none transition-colors hud-input"
                placeholder="e.g. Marcus Aurelius"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1 font-bold uppercase">Phone Number</label>
              <input 
                type="text" 
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                className="w-full rounded-xl px-4 py-2 text-xs focus:outline-none transition-colors hud-input"
                placeholder="e.g. +155512345"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer hud-btn-orange"
            >
              Register Supplier
            </button>
          </form>
        ) : (
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
            {suppliers.map(s => (
              <div key={s.supplier_id} className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-1.5">
                <h4 className="font-bold text-sm text-zinc-900">{s.name}</h4>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-500 font-semibold uppercase text-[10px]">
                  <span>Contact: {s.contact_person || 'None'}</span>
                  <span>•</span>
                  <span>Ph: {s.phone || 'None'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
