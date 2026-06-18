import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './Badge';

export default function TicketsView({ tickets, role, setSelectedTicketId, setCurrentView, fetchTickets }) {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs focus:outline-none hud-input"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl px-3 py-2 text-xs focus:outline-none hud-input"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button 
            onClick={() => { setFilterStatus(''); setFilterPriority(''); }}
            className="text-xs text-[#1f533a] font-bold hover:underline uppercase tracking-wider cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {role === 'customer' && (
          <button 
            onClick={() => setCurrentView('new_ticket')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 hud-btn-primary"
          >
            <Plus className="w-4 h-4" /> Log Complaint / Book Service
          </button>
        )}
      </div>

      {/* Tickets List Table/Cards */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden hud-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hud-table">
            <thead>
              <tr className="bg-zinc-50 text-zinc-600 text-xs font-extrabold uppercase tracking-wider border-b border-zinc-200">
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Title / Category</th>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Deadlines / Assigned</th>
                <th className="p-4 pr-6 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 text-sm text-zinc-700">
              {tickets
                .filter(t => !filterStatus || t.status === filterStatus)
                .filter(t => !filterPriority || t.priority === filterPriority)
                .map(t => (
                  <tr key={t.ticket_id} className="transition-colors hover:bg-zinc-50/50">
                    <td className="p-4 pl-6 font-bold font-mono text-xs text-zinc-500">#{t.ticket_id}</td>
                    <td className="p-4">
                      <span className="block font-bold text-zinc-900">{t.title}</span>
                      <span className="block text-xs text-zinc-500 font-bold">Cat: {t.category}</span>
                    </td>
                    <td className="p-4">
                      <span className="block font-semibold text-zinc-800">{t.make} {t.model}</span>
                      <span className="block text-xs font-mono text-zinc-500">{t.license_plate}</span>
                    </td>
                    <td className="p-4"><PriorityBadge priority={t.priority} /></td>
                    <td className="p-4"><StatusBadge status={t.status} /></td>
                    <td className="p-4">
                      <span className="block text-xs font-bold text-zinc-600">
                        SLA Resol: {t.resolution_deadline ? t.resolution_deadline.split(' ')[0] : 'None'}
                      </span>
                      <span className="block text-[10px] font-black text-[#1f533a] mt-0.5 uppercase tracking-wider">
                        Tech: {t.technician_name || 'UNASSIGNED'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => { setSelectedTicketId(t.ticket_id); setCurrentView('ticket_details'); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all hud-btn-secondary"
                      >
                        Open Operations
                      </button>
                    </td>
                  </tr>
                ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-zinc-400 font-bold uppercase tracking-wider">
                    No tickets match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
