import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function NewTicketView({ vehicles, apiCall, setCurrentView, setSuccessMsg }) {
  const [vehicleId, setVehicleId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Engine');
  const [priority, setPriority] = useState('medium');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) {
      alert('Please select a vehicle');
      return;
    }
    try {
      await apiCall('ticket/create.php', 'POST', {
        vehicle_id: vehicleId,
        title,
        category,
        priority
      });
      setSuccessMsg('Complaint registered and ticket generated successfully!');
      setCurrentView('dashboard');
    } catch (err) {}
  };

  return (
    <div className="max-w-2xl bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-6 relative z-10 hud-border">
      <div className="border-b border-zinc-200 pb-3">
        <h2 className="text-xl font-bold text-zinc-900 split-text">Log New Complaint / <strong>Book Service</strong></h2>
        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Initiate direct diagnostic and scheduling ticket</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Select Vehicle</label>
          <select
            required
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
          >
            <option value="">-- Choose registered vehicle from your fleet --</option>
            {vehicles.map(v => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                {v.make} {v.model} - {v.license_plate}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Issue / Service Title</label>
          <input 
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
            placeholder="e.g. Squeaking brakes on front driver side tire"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
            >
              <option value="Engine">Engine / Powertrain</option>
              <option value="Brakes">Braking System</option>
              <option value="Electrical">Electrical & Telemetry</option>
              <option value="Suspension">Suspension & Steering</option>
              <option value="General Maintenance">General Routine Service</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-700 font-extrabold mb-2">Priority Level</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
            >
              <option value="low">Low (Routine Checkup)</option>
              <option value="medium">Medium (Standard Diagnostics)</option>
              <option value="high">High (Urgent Repair Required)</option>
              <option value="critical">Critical (Vehicle Disabled/Towed)</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          className="px-6 py-3 rounded-xl transition-all cursor-pointer font-bold hud-btn-orange"
        >
          Confirm and Submit Ticket
        </button>
      </form>
    </div>
  );
}
