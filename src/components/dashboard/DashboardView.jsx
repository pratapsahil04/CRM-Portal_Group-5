import React from 'react';
import { 
  AlertCircle, AlertTriangle, Clock, CheckCircle2, IndianRupee, 
  Plus, Car, ChevronRight, Users, Package, Star, ShieldCheck, Layers 
} from 'lucide-react';
import CountUp from '../CountUp';
import { PriorityBadge, StatusBadge } from '../ticket/Badge';

export default function DashboardView({ user, tickets, vehicles, dashboardData, setCurrentView, setSelectedTicketId }) {
  if (user.role === 'customer') {
    return (
      <CustomerDashboard 
        user={user} 
        tickets={tickets} 
        vehicles={vehicles} 
        setCurrentView={setCurrentView} 
        setSelectedTicketId={setSelectedTicketId} 
      />
    );
  } else {
    return (
      <ManagementDashboard 
        user={user} 
        data={dashboardData} 
        tickets={tickets}
        setCurrentView={setCurrentView} 
        setSelectedTicketId={setSelectedTicketId} 
      />
    );
  }
}

// --- CUSTOMER DASHBOARD ---
function CustomerDashboard({ user, tickets, vehicles, setCurrentView, setSelectedTicketId }) {
  const activeTickets = tickets.filter(t => ['open', 'in_progress', 'on_hold'].includes(t.status));
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  return (
    <div className="space-y-6 relative z-10">
      {/* Welcome Card */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm hud-border">
        <div className="absolute right-0 bottom-0 opacity-5 translate-x-10 translate-y-10 pointer-events-none">
          <Car className="w-64 h-64 text-[#1f533a]" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 split-text">
            Hello, <strong>{user.name}</strong>!
          </h2>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Keep your vehicle running smoothly. Check active complaints or log new issues below.</p>
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={() => setCurrentView('new_ticket')}
            className="px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-sm font-bold hud-btn-primary"
          >
            <Plus className="w-4 h-4" /> Book Service / Raise Ticket
          </button>
          <button
            onClick={() => setCurrentView('vehicles')}
            className="px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-sm font-bold hud-btn-secondary"
          >
            <Car className="w-4 h-4" /> Register New Vehicle
          </button>
        </div>
      </div>

      {/* Fleets and Complaints Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Tickets */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
              <AlertCircle className="text-[#1f533a] w-5 h-5" /> Active Complaints (<CountUp end={activeTickets.length} />)
            </h3>
            <button onClick={() => setCurrentView('tickets')} className="text-xs font-bold text-[#1f533a] hover:underline uppercase tracking-wider cursor-pointer">View All</button>
          </div>

          {activeTickets.length === 0 ? (
            <div className="text-center py-10 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
              <CheckCircle2 className="w-12 h-12 text-[#1f533a] mx-auto opacity-30 mb-2" />
              <p className="text-zinc-500 text-sm font-semibold">No active complaints. Your vehicles are healthy!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTickets.map(t => (
                <div 
                  key={t.ticket_id} 
                  onClick={() => { setSelectedTicketId(t.ticket_id); setCurrentView('ticket_details'); }}
                  className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-zinc-350 hover:bg-zinc-100/50 transition-all duration-300"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-zinc-900 hover:text-[#1f533a] transition-colors">{t.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-semibold">
                      <span className="bg-zinc-200 px-2 py-0.5 rounded text-zinc-700 font-mono">{t.make} {t.model} ({t.license_plate})</span>
                      <span>•</span>
                      <span>Category: {t.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Registered Vehicles */}
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
              <Car className="text-[#1f533a] w-5 h-5" /> Registered Fleet (<CountUp end={vehicles.length} />)
            </h3>
            <button onClick={() => setCurrentView('vehicles')} className="text-xs font-bold text-[#1f533a] hover:underline uppercase tracking-wider cursor-pointer">Manage</button>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-10 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
              <Car className="w-12 h-12 text-zinc-400 mx-auto opacity-30 mb-2" />
              <p className="text-zinc-500 text-sm font-semibold">No vehicles registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.slice(0, 3).map(v => (
                <div key={v.vehicle_id} className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-zinc-800">{v.make} {v.model}</h4>
                    <span className="block text-[10px] text-zinc-500 font-mono">VIN: {v.vin}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-zinc-950 font-bold">{v.license_plate}</span>
                    <span className="inline-block text-[9px] bg-zinc-200 text-[#1f533a] px-2 py-0.5 rounded-full mt-1 font-extrabold uppercase">
                      Health: {v.health_score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Closed Tickets Reference Archive (Customer View) */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
        <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800 border-b border-zinc-200 pb-2">
          <CheckCircle2 className="text-[#1f533a] w-5 h-5" /> Completed & Closed Service Archive
        </h3>
        {closedTickets.length === 0 ? (
          <p className="text-xs text-zinc-500 italic font-semibold">No completed services recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-zinc-500 uppercase tracking-wider font-extrabold border-b border-zinc-200">
                  <th className="pb-3 pl-4">Job ID</th>
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Service Action</th>
                  <th className="pb-3">Final Invoice</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                {closedTickets.map(t => (
                  <tr key={t.ticket_id} className="hover:bg-zinc-50/50">
                    <td className="py-3 pl-4 font-mono font-bold text-zinc-500">#{t.ticket_id}</td>
                    <td className="py-3">{t.make} {t.model}</td>
                    <td className="py-3 font-bold text-zinc-900">{t.title}</td>
                    <td className="py-3 text-[#1f533a] font-black">₹{t.actual_cost || t.estimated_cost || '0.00'}</td>
                    <td className="py-3"><StatusBadge status={t.status} /></td>
                    <td className="py-3 pr-4 text-right">
                      <button 
                        onClick={() => { setSelectedTicketId(t.ticket_id); setCurrentView('ticket_details'); }}
                        className="text-xs text-[#1f533a] hover:underline font-bold cursor-pointer"
                      >
                        Reference Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- MANAGEMENT DASHBOARD (Admin & Technician) ---
function ManagementDashboard({ user, data, tickets, setCurrentView, setSelectedTicketId }) {
  if (!data) return <div className="text-center py-10 text-zinc-500 font-bold uppercase tracking-widest">Compiling diagnostics & analytics telemetry...</div>;

  const lowStockCount = data.low_stock_items?.length || 0;

  // Filter running tickets (active) and closed tickets (history archive)
  const runningTickets = tickets.filter(t => ['open', 'in_progress', 'on_hold'].includes(t.status));
  const closedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  // Kanban status columns mapper
  const columns = [
    { key: 'open', label: 'Pending Diagnosis', color: 'border-l-sky-500', count: tickets.filter(t => t.status === 'open').length },
    { key: 'in_progress', label: 'Active Diagnostic', color: 'border-l-yellow-600', count: tickets.filter(t => t.status === 'in_progress').length },
    { key: 'on_hold', label: 'Awaiting Parts', color: 'border-l-amber-600', count: tickets.filter(t => t.status === 'on_hold').length },
    { key: 'resolved', label: 'Resolved & Invoiced', color: 'border-l-emerald-600', count: tickets.filter(t => t.status === 'resolved').length },
    { key: 'closed', label: 'Closed Archive', color: 'border-l-zinc-400', count: tickets.filter(t => t.status === 'closed').length }
  ];

  return (
    <div className="space-y-8 relative z-10">
      {/* Metrics Row */}
      <div className="relative">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Active Tickets" value={data.sla_metrics?.total_active || 0} icon={AlertCircle} color="text-[#1f533a]" bgColor="bg-[#1f533a]/5" />
          <MetricCard label="SLA Breached" value={data.sla_metrics?.breached_count || 0} icon={AlertTriangle} color="text-red-600" bgColor="bg-red-500/10" />
          <MetricCard label="Near SLA Breach" value={data.sla_metrics?.near_breach_count || 0} icon={Clock} color="text-amber-600" bgColor="bg-amber-500/10" />
          <MetricCard label="Completed Jobs" value={data.revenue?.completed_jobs || 0} icon={CheckCircle2} color="text-emerald-600" bgColor="bg-emerald-500/10" />
          <MetricCard label="Total Revenue" value={`₹${data.revenue?.total_revenue || 0}`} icon={IndianRupee} color="text-[#b57351]" bgColor="bg-[#b57351]/5" />
        </div>
      </div>

      {/* Near SLA Breach alerts */}
      {data.sla_metrics?.near_breach_tickets?.length > 0 && (
        <div className="bg-[#b57351]/5 border border-[#b57351]/15 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
          <h3 className="text-lg font-black flex items-center gap-2 text-[#b57351] uppercase tracking-wider">
            <AlertTriangle className="animate-bounce w-5 h-5 text-[#b57351]" /> SLA Near-Breach Warning! (80%+ Consumed)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.sla_metrics.near_breach_tickets.map(ticket => (
              <div 
                key={ticket.ticket_id}
                onClick={() => { setSelectedTicketId(ticket.ticket_id); setCurrentView('ticket_details'); }}
                className="bg-white border border-zinc-200 p-4 rounded-xl cursor-pointer hover:border-[#b57351]/30 transition-all duration-300 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-zinc-400 font-mono">JOB #{ticket.ticket_id}</span>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 mt-2 line-clamp-1">{ticket.title}</h4>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-[#b57351] font-extrabold">{ticket.pct_consumed}% Consumed</span>
                  <span className="text-zinc-500 font-bold">{ticket.time_left} left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Lifecycle Tracker (Kanban Column Tracker) */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
        <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800 border-b border-zinc-200 pb-2">
          <Layers className="text-[#1f533a] w-5 h-5" /> Operations Ticket Lifecycle Board
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {columns.map(col => {
            const colTickets = tickets.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="bg-zinc-50 border border-zinc-250 rounded-xl p-3 flex flex-col min-h-[300px]">
                <div className={`border-l-4 ${col.color} pl-2 flex items-center justify-between mb-3 shrink-0`}>
                  <span className="text-xs font-black text-zinc-800 uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] bg-zinc-200 px-2 py-0.5 rounded-full font-bold text-zinc-600">{col.count}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-1">
                  {colTickets.map(t => (
                    <div
                       key={t.ticket_id}
                       onClick={() => { setSelectedTicketId(t.ticket_id); setCurrentView('ticket_details'); }}
                       className="bg-white border border-zinc-200 p-2.5 rounded-lg text-xs hover:border-[#1f533a]/40 transition-colors cursor-pointer space-y-1.5 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] text-zinc-500 font-bold">#{t.ticket_id}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <h4 className="font-bold text-zinc-800 line-clamp-2 hover:text-[#1f533a] transition-colors">{t.title}</h4>
                      <div className="text-[9px] text-zinc-500 font-extrabold uppercase truncate">
                        {t.make} {t.model}
                      </div>
                    </div>
                  ))}
                  {colTickets.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center py-8 text-zinc-400 text-[10px] font-bold uppercase tracking-wider italic">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns layout: Workload roster & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Roster and Workloads */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
              <Users className="text-[#1f533a] w-5 h-5" /> Technician Roster & Workload
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.technician_performance?.map(tech => (
              <div key={tech.technician_id} className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-zinc-800 truncate">{tech.name}</h4>
                  <span className="block text-[10px] text-zinc-500 truncate uppercase font-bold tracking-wider">{tech.specialization}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-amber-600 text-xs font-bold justify-end">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {tech.rating}
                  </div>
                  <span className="inline-block text-[9px] bg-zinc-200 text-[#1f533a] px-2 py-0.5 rounded mt-1 font-extrabold uppercase">
                    {tech.active_jobs} Jobs Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Low Stock Alerts */}
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800">
              <Package className="text-[#b57351] w-5 h-5" /> Low Stock Alerts (<CountUp end={lowStockCount} />)
            </h3>
            <button onClick={() => setCurrentView('inventory')} className="text-xs font-bold text-[#b57351] hover:underline uppercase tracking-wider cursor-pointer">Restock</button>
          </div>

          {lowStockCount === 0 ? (
            <div className="uiverse-toast-card bg-emerald-50/50 border border-emerald-100/50 relative overflow-hidden flex items-center gap-4 p-4 rounded-xl">
              <svg className="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" style={{ color: '#059669' }}>
                <path 
                  d="M0,256L48,224C96,192,192,128,288,122.7C384,117,480,171,576,192C672,213,768,203,864,176C960,149,1056,107,1152,106.7C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                  fill="currentColor"
                  fillOpacity="0.08"
                ></path>
              </svg>
              <div className="message-text-container">
                <span className="message-text block text-sm font-extrabold text-[#059669]">All Clear</span>
                <span className="sub-text block text-[10px] text-zinc-500 mt-0.5">Inventory levels are nominal.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.low_stock_items.map(item => (
                <div key={item.item_id} className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-center justify-between">
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-zinc-800 truncate">{item.name}</h4>
                    <span className="block text-[9px] text-zinc-500 font-mono truncate">{item.part_number}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-[#b57351] block">{item.quantity} units</span>
                    <span className="block text-[9px] text-zinc-500 font-bold uppercase">Min: {item.minimum_quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Closed Tickets History Archive (Staff Reference View) */}
      <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
        <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-800 border-b border-zinc-200 pb-2">
          <CheckCircle2 className="text-[#1f533a] w-5 h-5" /> Closed Tickets & Completed Invoices Reference Archive
        </h3>
        {closedTickets.length === 0 ? (
          <p className="text-xs text-zinc-500 italic font-semibold">No completed services logged in the history database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-zinc-600 uppercase tracking-wider font-extrabold border-b border-zinc-200">
                  <th className="pb-3 pl-4">Job ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Service Description</th>
                  <th className="pb-3">Technician</th>
                  <th className="pb-3">Final Invoice</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 font-semibold text-zinc-700">
                {closedTickets.map(t => (
                  <tr key={t.ticket_id} className="hover:bg-zinc-50/50">
                    <td className="py-3 pl-4 font-mono font-bold text-zinc-500">#{t.ticket_id}</td>
                    <td className="py-3 font-bold text-zinc-900">{t.customer_name}</td>
                    <td className="py-3">{t.make} {t.model}</td>
                    <td className="py-3 text-zinc-600">{t.title}</td>
                    <td className="py-3 font-black text-[#b57351] uppercase tracking-wide">{t.technician_name || 'Unassigned'}</td>
                    <td className="py-3 text-[#1f533a] font-black">${t.actual_cost || t.estimated_cost || '0.00'}</td>
                    <td className="py-3"><StatusBadge status={t.status} /></td>
                    <td className="py-3 pr-4 text-right">
                      <button 
                        onClick={() => { setSelectedTicketId(t.ticket_id); setCurrentView('ticket_details'); }}
                        className="text-xs text-[#1f533a] hover:underline font-bold cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// --- METRIC CARD ---
function MetricCard({ label, value, icon: Icon, color, bgColor }) {
  const isPrice = typeof value === 'string' && value.startsWith('₹');
  const numericValue = isPrice ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;

  const colorMap = {
    'text-[#1f533a]': {
      text: '#1f533a',
      bg: '#e8ece9',
      fill: 'rgba(31, 83, 58, 0.08)',
      iconContainer: 'rgba(31, 83, 58, 0.15)',
      icon: '#1f533a'
    },
    'text-red-600': {
      text: '#dc2626',
      bg: '#fee2e2',
      fill: 'rgba(220, 38, 38, 0.08)',
      iconContainer: 'rgba(220, 38, 38, 0.15)',
      icon: '#dc2626'
    },
    'text-amber-600': {
      text: '#d97706',
      bg: '#fef3c7',
      fill: 'rgba(217, 119, 6, 0.08)',
      iconContainer: 'rgba(217, 119, 6, 0.15)',
      icon: '#d97706'
    },
    'text-emerald-600': {
      text: '#059669',
      bg: '#d1fae5',
      fill: 'rgba(5, 150, 105, 0.08)',
      iconContainer: 'rgba(5, 150, 105, 0.15)',
      icon: '#059669'
    },
    'text-[#b57351]': {
      text: '#b57351',
      bg: '#fdf4e9',
      fill: 'rgba(181, 115, 81, 0.08)',
      iconContainer: 'rgba(181, 115, 81, 0.15)',
      icon: '#b57351'
    }
  };

  const currentTheme = colorMap[color] || {
    text: '#1f533a',
    bg: '#ffffff',
    fill: 'rgba(4, 228, 0, 0.08)',
    iconContainer: 'rgba(4, 228, 0, 0.15)',
    icon: '#1f533a'
  };

  return (
    <div 
      className="uiverse-toast-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default"
      style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
    >
      <svg className="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" style={{ color: currentTheme.text }}>
        <path 
          d="M0,256L48,224C96,192,192,128,288,122.7C384,117,480,171,576,192C672,213,768,203,864,176C960,149,1056,107,1152,106.7C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          fill="currentColor"
          fillOpacity="0.08"
        ></path>
      </svg>
      <div className="message-text-container pl-1">
        <span 
          className="message-text block leading-none font-black text-2xl tracking-tight"
          style={{ color: currentTheme.text }}
        >
          {isPrice ? (
            <CountUp end={numericValue} prefix="₹" />
          ) : typeof value === 'number' ? (
            <CountUp end={value} />
          ) : (
            value
          )}
        </span>
        <span className="sub-text mt-1 block text-[10px] font-bold text-zinc-500 tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}
