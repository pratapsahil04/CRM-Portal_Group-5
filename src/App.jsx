// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import CanvasTelemetry from './components/CanvasTelemetry';
import CanvasHUD from './components/CanvasHUD';

// Modular component imports
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardView from './components/dashboard/DashboardView';
import VehiclesView from './components/customer/VehiclesView';
import TicketsView from './components/ticket/TicketsView';
import NewTicketView from './components/ticket/NewTicketView';
import TicketDetailsView from './components/ticket/TicketDetailsView';
import InventoryView from './components/inventory/InventoryView';
import TechnicianManagementView from './components/admin/TechnicianManagementView';

// Use a relative API prefix so Vite can proxy backend requests during development.
// This keeps the frontend and backend on the same origin for tunnel access.
const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crm_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [currentView, setCurrentView] = useState(() => {
    if (!user) return 'login';
    return 'dashboard';
  });

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeModalTab, setActiveModalTab] = useState(null);

  // Auto-scroll for chat
  const chatEndRef = useRef(null);

  // Clear messages after 4 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Save/remove user from localStorage
  const handleSetUser = (u) => {
    if (u) {
      localStorage.setItem('crm_user', JSON.stringify(u));
      setUser(u);
      setCurrentView('dashboard');
    } else {
      localStorage.removeItem('crm_user');
      setUser(null);
      setCurrentView('login');
      // Clear states
      setTickets([]);
      setSelectedTicketId(null);
      setSelectedTicket(null);
      setVehicles([]);
      setInventory([]);
      setSuppliers([]);
      setDashboardData(null);
    }
  };

  // Helper API Call
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    
    try {
      const config = { method, headers };
      if (body) {
        config.body = JSON.stringify(body);
      }
      const res = await fetch(`${API_BASE}/${endpoint}`, config);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message);
      throw err;
    }
  };

  // Fetch functions based on views
  const fetchTickets = async () => {
    try {
      const data = await apiCall('ticket/list.php');
      setTickets(data);
    } catch (e) {}
  };

  const fetchTicketDetails = async (id) => {
    try {
      const data = await apiCall(`ticket/details.php?ticket_id=${id}`);
      setSelectedTicket(data);
      // scroll chat
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {}
  };

  const fetchVehicles = async () => {
    try {
      const data = await apiCall('customer/vehicles.php');
      setVehicles(data);
    } catch (e) {}
  };

  const fetchInventory = async () => {
    try {
      const data = await apiCall('inventory/parts.php');
      setInventory(data);
    } catch (e) {}
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiCall('inventory/suppliers.php');
      setSuppliers(data);
    } catch (e) {}
  };

  const fetchDashboardData = async () => {
    try {
      const data = await apiCall('reports/dashboard.php');
      setDashboardData(data);
    } catch (e) {}
  };

  // Trigger loads on view changes
  useEffect(() => {
    if (!user) return;
    if (currentView === 'dashboard') {
      if (user.role === 'customer') {
        fetchTickets();
        fetchVehicles();
      } else {
        fetchDashboardData();
        fetchTickets();
      }
    } else if (currentView === 'tickets') {
      fetchTickets();
    } else if (currentView === 'vehicles') {
      fetchVehicles();
    } else if (currentView === 'inventory') {
      fetchInventory();
      fetchSuppliers();
    }
  }, [currentView, user]);

  // Keep details refreshed if selected ticket changes
  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-slate-100 antialiased relative overflow-hidden">
      {/* Canvas Telemetry Background */}
      <CanvasTelemetry />

      {/* Notifications */}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-600 border border-red-700 px-5 py-4 rounded-xl shadow-2xl animate-slide-in">
          <AlertTriangle className="text-white w-5 h-5 shrink-0" />
          <span className="text-white text-xs font-black uppercase tracking-wider">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-emerald-600 border border-emerald-700 px-5 py-4 rounded-xl shadow-2xl animate-slide-in">
          <CheckCircle2 className="text-white w-5 h-5 shrink-0" />
          <span className="text-white text-xs font-black uppercase tracking-wider">{successMsg}</span>
        </div>
      )}

      {/* Main Layout */}
      {user ? (
        <div className="w-full flex flex-col md:flex-row min-h-screen z-10 relative">
          {/* Sidebar Navigation */}
          <Sidebar currentView={currentView} setCurrentView={setCurrentView} user={user} handleLogout={() => handleSetUser(null)} />
          
          {/* App Body */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header user={user} currentView={currentView} />
            
            {/* Scrollable Container */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f533a]"></div>
                </div>
              )}

              {/* Views Route Controller */}
              {currentView === 'dashboard' && (
                <DashboardView 
                  user={user} 
                  tickets={tickets} 
                  vehicles={vehicles} 
                  dashboardData={dashboardData}
                  setCurrentView={setCurrentView}
                  setSelectedTicketId={setSelectedTicketId}
                />
              )}
              {currentView === 'vehicles' && (
                <VehiclesView 
                  vehicles={vehicles} 
                  fetchVehicles={fetchVehicles} 
                  apiCall={apiCall}
                  setSuccessMsg={setSuccessMsg}
                />
              )}
              {currentView === 'tickets' && (
                <TicketsView 
                  tickets={tickets} 
                  role={user.role}
                  setSelectedTicketId={setSelectedTicketId} 
                  setCurrentView={setCurrentView}
                  fetchTickets={fetchTickets}
                />
              )}
              {currentView === 'new_ticket' && (
                <NewTicketView 
                  vehicles={vehicles} 
                  apiCall={apiCall} 
                  setCurrentView={setCurrentView} 
                  setSuccessMsg={setSuccessMsg}
                />
              )}
              {currentView === 'ticket_details' && (
                <TicketDetailsView 
                  user={user}
                  ticket={selectedTicket} 
                  fetchDetails={() => fetchTicketDetails(selectedTicketId)}
                  apiCall={apiCall}
                  setSuccessMsg={setSuccessMsg}
                  chatEndRef={chatEndRef}
                  setCurrentView={setCurrentView}
                />
              )}
              {currentView === 'inventory' && (
                <InventoryView 
                  inventory={inventory} 
                  suppliers={suppliers} 
                  apiCall={apiCall}
                  fetchInventory={fetchInventory}
                  fetchSuppliers={fetchSuppliers}
                  setSuccessMsg={setSuccessMsg}
                  role={user.role}
                />
              )}
              {currentView === 'team' && user.role === 'admin' && (
                <TechnicianManagementView
                  apiCall={apiCall}
                  setSuccessMsg={setSuccessMsg}
                />
              )}
            </main>
          </div>
        </div>
      ) : (
        /* Landing Page + Authentication Screen */
        <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#e8ece9] select-none z-10">
          {/* Radial Light Overlays */}
          <div className="radial-lighting"></div>
          <div className="radial-lighting-orange"></div>
          
          {/* Hero left-hand side inspired by Piston Nerd */}
          <div className="relative flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 z-10 border-b lg:border-b-0 lg:border-r border-zinc-200/40 bg-gradient-to-br from-[#8ca391] via-[#5b7d64] to-[#2f4937]">
            {/* Background Car Image */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center opacity-70 mix-blend-multiply pointer-events-none"
              style={{ 
                backgroundImage: `url('/src/assets/hero.png')`,
                maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1), rgba(0,0,0,0) 90%)',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1), rgba(0,0,0,0) 90%)'
              }}
            ></div>
 
            {/* Header / Logo */}
            <div className="flex items-center justify-between z-10">
              <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter text-white">PISTON NERD</span>
                <span className="text-[9px] text-[#c3dbcc] font-bold tracking-[0.2em] -mt-1">AUTOCRM SYSTEMS</span>
              </div>
              <div className="hidden md:flex gap-6 text-xs font-black tracking-widest text-[#dfb49d]">
                <span onClick={() => setActiveModalTab('services')} className="hover:text-white cursor-pointer transition-colors">SERVICES</span>
                <span onClick={() => setActiveModalTab('our_work')} className="hover:text-white cursor-pointer transition-colors">OUR WORK</span>
                <span onClick={() => setActiveModalTab('why_us')} className="hover:text-white cursor-pointer transition-colors">WHY US</span>
              </div>
            </div>
 
            {/* Central Hero text & Car shadow */}
            <div className="my-auto py-12 md:py-20 relative max-w-xl z-10">
              {/* Glowing decorative radar circles */}
              <div className="absolute -left-10 -top-10 w-48 h-48 border border-white/10 rounded-full animate-spin-slow pointer-events-none"></div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mt-6">
                Supercharging <span className="text-[#11261c]">brands</span> and <span className="text-[#11261c]">websites</span> in the automotive industry
              </h2>
              
              {/* Spinning speedometer HUD in hero */}
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <CanvasHUD width={130} height={130} />
                <p className="text-[#c3dbcc] text-xs max-w-[240px] leading-relaxed font-medium">
                  Real-time diagnostics and mechanical repair workflows integrated directly with dealership SLA systems.
                </p>
              </div>
            </div>
 
            {/* Footer / Telemetry Status */}
            <div className="flex items-center justify-between text-xs text-white/70 font-bold uppercase tracking-wider z-10 mt-6">
              <span>© {new Date().getFullYear()} PistonNerd AutoCRM</span>
              <div className="flex items-center gap-2 text-[#68caa9] font-black">
                <span className="w-1.5 h-1.5 bg-[#68caa9] rounded-full animate-ping"></span>
                <span>REAL-TIME FLEET TELEMETRY ACTIVE</span>
              </div>
            </div>
          </div>
           {/* Info Modal Dialog */}
          {activeModalTab && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
              <div className="relative w-full max-w-xl bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-xl hud-border">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1f533a] to-[#b57351] rounded-t-2xl"></div>
                
                <button 
                  onClick={() => setActiveModalTab(null)}
                  className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-800 font-extrabold uppercase text-xs tracking-widest transition-colors cursor-pointer"
                >
                  [ CLOSE ]
                </button>

                {activeModalTab === 'services' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-zinc-900 split-text">
                      Dealership <strong>Services</strong>
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      We offer a comprehensive suite of high-tech diagnostics and precision maintenance services:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <span className="text-[#1f533a] font-black text-sm uppercase tracking-wider block mb-1">OBD-II Telemetry</span>
                        <p className="text-zinc-500 text-xs leading-relaxed">Real-time scan tool integration for live vehicle health analytics.</p>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <span className="text-[#b57351] font-black text-sm uppercase tracking-wider block mb-1">ECU Tuning</span>
                        <p className="text-zinc-500 text-xs leading-relaxed">Optimization of ignition, air-fuel mapping, and transmission response.</p>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <span className="text-[#b57351] font-black text-sm uppercase tracking-wider block mb-1">SLA Ticketing</span>
                        <p className="text-zinc-500 text-xs leading-relaxed">Guaranteed response and resolution tracking for scheduled maintenance.</p>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <span className="text-[#1f533a] font-black text-sm uppercase tracking-wider block mb-1">OEM Supply Chain</span>
                        <p className="text-zinc-500 text-xs leading-relaxed">Integrated inventory stock control with titanium supplier channels.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeModalTab === 'our_work' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-zinc-900 split-text">
                      Our <strong>Work</strong>
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      Track record of automotive engineering excellence and operational transparency:
                    </p>
                    <div className="space-y-4">
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between">
                        <div>
                          <span className="text-zinc-800 font-bold block">Vehicles Diagnosed</span>
                          <span className="text-zinc-500 text-xs">Full diagnostics scan complete</span>
                        </div>
                        <span className="text-2xl font-black text-[#1f533a]">4,200+</span>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between">
                        <div>
                          <span className="text-zinc-800 font-bold block">Average SLA Response Time</span>
                          <span className="text-zinc-650 text-xs">Exceeding industry standard</span>
                        </div>
                        <span className="text-2xl font-black text-[#b57351]">32 Min</span>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex items-center justify-between">
                        <div>
                          <span className="text-zinc-800 font-bold block">Client Satisfaction Rating</span>
                          <span className="text-zinc-500 text-xs">Consistently premium experience</span>
                        </div>
                        <span className="text-2xl font-black text-[#1f533a]">4.95 / 5</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeModalTab === 'why_us' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-zinc-900 split-text">
                      Why <strong>Us</strong>
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      AutoCRM represents a paradigm shift in workshop operations and customer collaboration:
                    </p>
                    <div className="grid grid-cols-1 gap-3 text-xs text-zinc-700">
                      <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1f533a] mt-1.5 shrink-0"></span>
                        <p className="leading-relaxed"><strong className="text-[#1f533a]">Technician Messenger:</strong> Chat directly with your specialized mechanic in real-time, receiving photo attachments and diagnosis updates.</p>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1f533a] mt-1.5 shrink-0"></span>
                        <p className="leading-relaxed"><strong className="text-[#1f533a]">Transparent Stocking:</strong> Automatic parts stock reservation preventing project delays and over-invoicing.</p>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setActiveModalTab(null)}
                  className="w-full mt-6 py-3 rounded-xl font-bold tracking-wider uppercase text-xs transition-all cursor-pointer hud-btn-primary"
                >
                  Acknowledge Telemetry
                  <span className="animation"></span>
                </button>
              </div>
            </div>
          )}

          {/* Form right-hand side */}
          <div className="relative w-full lg:w-[480px] xl:w-[540px] flex items-center justify-center p-6 md:p-12 z-10 bg-zinc-950/20 backdrop-blur-sm shrink-0">
            {currentView === 'login' ? (
              <Login handleSetUser={handleSetUser} apiCall={apiCall} toggleView={() => setCurrentView('register')} />
            ) : (
              <Register handleSetUser={handleSetUser} apiCall={apiCall} toggleView={() => setCurrentView('login')} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
