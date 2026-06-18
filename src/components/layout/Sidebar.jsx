import React from 'react';
import { 
  Activity, AlertCircle, Car, Package, Wrench, User, LogOut, Users
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, user, handleLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',        icon: Activity,     roles: ['admin', 'customer', 'technician'] },
    { id: 'tickets',   label: 'Tickets',           icon: AlertCircle,  roles: ['admin', 'customer', 'technician'] },
    { id: 'vehicles',  label: 'My Vehicles',       icon: Car,          roles: ['customer'] },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package,      roles: ['admin', 'technician'] },
    { id: 'team',      label: 'Technicians',       icon: Users,        roles: ['admin'] },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col shrink-0 z-20">
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-zinc-200">
        <div className="bg-slate-100 border border-slate-200 p-2 rounded-xl text-[#1f533a]">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <span className="font-black text-lg tracking-tighter text-zinc-900">PISTON<span className="text-[#1f533a]">.</span>NERD</span>
          <span className="block text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest -mt-1">AUTOCRM CONTROL</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.filter(item => item.roles.includes(user.role)).map(item => {
          const Icon = item.icon;
          const active = currentView === item.id || (item.id === 'tickets' && currentView === 'ticket_details');
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                active 
                  ? 'text-zinc-900 bg-zinc-100 border border-zinc-200 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${active ? 'text-[#1f533a]' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[#1f533a]"></span>}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-zinc-100 p-2 rounded-lg border border-zinc-200 shrink-0">
            <User className="w-4 h-4 text-[#1f533a]" />
          </div>
          <div className="overflow-hidden">
            <span className="block text-sm font-semibold text-zinc-900 truncate">{user.name}</span>
            <span className="block text-xs text-zinc-600 capitalize">{user.role}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          title="Sign Out"
          className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
