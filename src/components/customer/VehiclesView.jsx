import React, { useState } from 'react';
import { Plus, Car, AlertTriangle, Trash2 } from 'lucide-react';

export default function VehiclesView({ vehicles, fetchVehicles, apiCall, setSuccessMsg }) {
  const [vin, setVin] = useState('');
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  
  // Extra fields
  const [warrantyProvider, setWarrantyProvider] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceRenewal, setInsuranceRenewal] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('customer/vehicles.php', 'POST', {
        vin,
        license_plate: plate,
        make,
        model,
        year,
        mileage,
        warranty_provider: warrantyProvider,
        warranty_expiry: warrantyExpiry,
        insurance_provider: insuranceProvider,
        insurance_renewal: insuranceRenewal
      });
      setSuccessMsg('Vehicle registered successfully!');
      fetchVehicles();
      setShowAddForm(false);
      // reset forms
      setVin(''); setPlate(''); setMake(''); setModel(''); setYear(''); setMileage('');
      setWarrantyProvider(''); setWarrantyExpiry(''); setInsuranceProvider(''); setInsuranceRenewal('');
    } catch (err) {}
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    const { id, name } = vehicleToDelete;
    setVehicleToDelete(null);
    try {
      await apiCall(`customer/vehicles.php?vehicle_id=${id}`, 'DELETE');
      setSuccessMsg(`${name} has been removed from your fleet.`);
      fetchVehicles();
    } catch (err) {}
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 split-text">
          Manage <strong>Vehicle Fleet</strong>
        </h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 hud-btn-primary"
        >
          {showAddForm ? 'View Fleet List' : <><Plus className="w-4 h-4" /> Register New Vehicle</>}
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={onSubmit} className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm max-w-3xl space-y-6 hud-border">
          <h3 className="text-lg font-black text-zinc-900 split-text border-b border-zinc-200 pb-3">Vehicle Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">VIN (Exactly 17 chars)</label>
              <input 
                type="text" 
                required 
                maxLength="17"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors uppercase hud-input"
                placeholder="1HGCR2F8XJA001122"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">License Plate</label>
              <input 
                type="text" 
                required 
                maxLength="10"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors uppercase hud-input"
                placeholder="NY-552A"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Make</label>
              <input 
                type="text" 
                required 
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                placeholder="Honda"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Model</label>
              <input 
                type="text" 
                required 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                placeholder="Accord"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Year</label>
              <input 
                type="number" 
                required 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                placeholder="2018"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Mileage (miles)</label>
              <input 
                type="number" 
                required 
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                placeholder="45200"
              />
            </div>
          </div>

          <h3 className="text-lg font-black text-zinc-900 split-text border-b border-zinc-200 pb-3 pt-4">Warranty & Insurance (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-600">Warranty Details</h4>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1 font-bold">Provider</label>
                <input 
                  type="text" 
                  value={warrantyProvider}
                  onChange={(e) => setWarrantyProvider(e.target.value)}
                  className="w-full rounded-xl px-4 py-2 text-sm focus:outline-none transition-colors hud-input"
                  placeholder="Honda Care"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1 font-bold">Expiry Date</label>
                <input 
                  type="date" 
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="w-full rounded-xl px-4 py-2 text-sm focus:outline-none transition-colors hud-input"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-600">Insurance Details</h4>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1 font-bold">Provider</label>
                <input 
                  type="text" 
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className="w-full rounded-xl px-4 py-2 text-sm focus:outline-none transition-colors hud-input"
                  placeholder="State Farm"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1 font-bold">Renewal Date</label>
                <input 
                  type="date" 
                  value={insuranceRenewal}
                  onChange={(e) => setInsuranceRenewal(e.target.value)}
                  className="w-full rounded-xl px-4 py-2 text-sm focus:outline-none transition-colors hud-input"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="px-8 py-3.5 rounded-xl transition-all cursor-pointer font-bold hud-btn-orange"
          >
            Submit Vehicle Registration
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <Car className="w-16 h-16 text-zinc-400 mx-auto opacity-35 mb-2 animate-bounce" />
              <h3 className="font-extrabold text-zinc-600 uppercase text-sm">No vehicles in your fleet yet.</h3>
              <p className="text-zinc-700 text-sm mt-1 font-semibold">Register a vehicle to link diagnostics and book services.</p>
            </div>
          ) : (
            vehicles.map(v => (
              <div key={v.vehicle_id} className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden hud-border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">{v.make} {v.model}</h3>
                    <span className="text-xs text-zinc-500 font-mono">VIN: {v.vin}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-[#1f533a]/5 border border-[#1f533a]/20 text-[#1f533a] text-xs px-3 py-1 rounded-full font-bold">
                      {v.license_plate}
                    </span>
                    <button 
                      onClick={() => setVehicleToDelete({ id: v.vehicle_id, name: `${v.make} ${v.model}` })}
                      title="Remove vehicle from fleet"
                      className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 mt-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Fleet
                    </button>
                  </div>
                </div>

                {/* Telemetry info block */}
                <div className="mt-6 grid grid-cols-3 gap-2 bg-zinc-50 border border-zinc-200 p-3 rounded-xl">
                  <div>
                    <span className="block text-[8px] text-zinc-600 uppercase tracking-widest font-extrabold">Health Score</span>
                    <span className={`text-sm font-bold ${v.health_score > 85 ? 'text-emerald-600' : v.health_score > 60 ? 'text-amber-600' : 'text-red-500'}`}>
                      {v.health_score}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-600 uppercase tracking-widest font-extrabold">Mileage</span>
                    <span className="text-sm font-semibold text-zinc-700">{v.mileage} mi</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-600 uppercase tracking-widest font-extrabold">Year</span>
                    <span className="text-sm font-semibold text-zinc-700">{v.year}</span>
                  </div>
                </div>

                {/* Diagnostic trouble codes if any */}
                {v.telemetry?.some(t => t.dtc_code) && (
                  <div className="mt-4 flex items-center gap-2 bg-[#b57351]/5 border border-[#b57351]/15 text-[#b57351] text-xs px-3 py-2 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#b57351]" />
                    <span>DTC Alert: {v.telemetry.find(t => t.dtc_code).dtc_code} detected in telemetry scans!</span>
                  </div>
                )}

                {/* Warranty & Insurance tags */}
                <div className="mt-6 pt-4 border-t border-zinc-200 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-zinc-600 font-bold uppercase text-[9px]">Warranty Provider:</span>
                    <span className="font-semibold text-zinc-700 truncate block">{v.warranty_provider || 'None'}</span>
                    {v.warranty_expiry && <span className="block text-[9px] text-zinc-500 font-medium">Exp: {v.warranty_expiry}</span>}
                  </div>
                  <div>
                    <span className="block text-zinc-600 font-bold uppercase text-[9px]">Insurance Provider:</span>
                    <span className="font-semibold text-zinc-700 truncate block">{v.insurance_provider || 'None'}</span>
                    {v.insurance_renewal && <span className="block text-[9px] text-zinc-500 font-medium">Renew: {v.insurance_renewal}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 animate-scale-in">
            <h3 className="text-lg font-bold text-zinc-900">Remove Vehicle from Fleet</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-zinc-900">{vehicleToDelete.name}</strong> from your active fleet? It will be hidden from your customer view, but all service log records will be stored securely for company records.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-red-700"
              >
                Remove Fleet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
