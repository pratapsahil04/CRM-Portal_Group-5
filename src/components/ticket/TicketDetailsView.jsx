import React, { useState, useEffect } from 'react';
import { 
  Clock, Car, Wrench, RefreshCw, Paperclip, Send, ChevronRight
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from './Badge';

const API_BASE = '/api';

export default function TicketDetailsView({ user, ticket, fetchDetails, apiCall, setSuccessMsg, chatEndRef, setCurrentView }) {
  const [msgInput, setMsgInput] = useState('');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [techList, setTechList] = useState([]);

  // Work Order actions states
  const [estCostInput, setEstCostInput] = useState('');
  const [partItemId, setPartItemId] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [actCostInput, setActCostInput] = useState('');
  const [serviceTypeInput, setServiceTypeInput] = useState('');
  const [woMileage, setWoMileage] = useState('');
  const [woHealthScore, setWoHealthScore] = useState('');
  
  const [partList, setPartList] = useState([]);

  // Fetch technician options for assignment
  useEffect(() => {
    if (user.role === 'admin' && ticket && ticket.status === 'open') {
      const getTechs = async () => {
        try {
          const res = await fetch(`${API_BASE}/reports/dashboard.php`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const data = await res.json();
          if (data && data.technician_performance) {
            setTechList(data.technician_performance);
          }
        } catch(e) {}
      };
      getTechs();
    }
  }, [ticket, user]);

  // Fetch parts options for adding parts
  useEffect(() => {
    if ((user.role === 'technician' || user.role === 'admin') && ticket?.work_order?.status === 'in_progress') {
      const getParts = async () => {
        try {
          const res = await fetch(`${API_BASE}/inventory/parts.php`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          const data = await res.json();
          setPartList(data);
        } catch(e) {}
      };
      getParts();
    }
  }, [ticket, user]);

  if (!ticket) return <div className="text-center py-10 text-zinc-500 font-extrabold uppercase tracking-widest">Loading operations matrix...</div>;

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    try {
      await apiCall('ticket/message.php', 'POST', {
        conversation_id: ticket.conversation?.conversation_id,
        message: msgInput,
        file_url: fileUrlInput
      });
      setMsgInput('');
      setFileUrlInput('');
      setShowAttachInput(false);
      fetchDetails();
    } catch(err) {}
  };

  // Handle Technician assignment
  const handleAssign = async () => {
    if (!assigneeId) return;
    try {
      await apiCall('ticket/assign.php', 'POST', {
        ticket_id: ticket.ticket_id,
        technician_id: assigneeId
      });
      setSuccessMsg('Technician assigned and work order initialized!');
      fetchDetails();
    } catch(err) {}
  };

  // Handle update estimate cost
  const handleUpdateEstimate = async () => {
    if (!estCostInput) return;
    try {
      await apiCall('ticket/workorder.php', 'POST', {
        action: 'update_estimate',
        work_order_id: ticket.work_order.work_order_id,
        estimated_cost: estCostInput
      });
      setSuccessMsg('Estimation cost updated.');
      fetchDetails();
      setEstCostInput('');
    } catch(e) {}
  };

  // Handle status update directly
  const handleUpdateStatus = async (newStatus) => {
    try {
      await apiCall('ticket/status.php', 'POST', {
        ticket_id: ticket.ticket_id,
        status: newStatus
      });
      setSuccessMsg(`Ticket status updated to ${newStatus.replace('_', ' ')} successfully!`);
      fetchDetails();
    } catch(e) {}
  };

  // Handle add part
  const handleAddPart = async () => {
    if (!partItemId) return;
    try {
      await apiCall('ticket/workorder.php', 'POST', {
        action: 'add_part',
        work_order_id: ticket.work_order.work_order_id,
        item_id: partItemId,
        quantity: partQty
      });
      setSuccessMsg('Part added to work order and inventory stock auto-deducted!');
      fetchDetails();
      setPartItemId('');
      setPartQty('1');
    } catch(e) {}
  };

  // Handle complete work order
  const handleCompleteWorkOrder = async (e) => {
    e.preventDefault();
    try {
      await apiCall('ticket/workorder.php', 'POST', {
        action: 'complete_work',
        work_order_id: ticket.work_order.work_order_id,
        actual_cost: actCostInput,
        service_type: serviceTypeInput,
        mileage: woMileage,
        health_score: woHealthScore
      });
      setSuccessMsg('Work completed! Ticket status updated.');
      fetchDetails();
      setActCostInput('');
      setServiceTypeInput('');
      setWoMileage('');
      setWoHealthScore('');
    } catch(e) {}
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-10">
      
      {/* Col 1 & 2: Ticket Info, Work Orders & History */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Ticket Header card */}
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden hud-border">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#1f533a]/5 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-[10px] font-mono font-bold text-zinc-500">JOB TELEMETRY #{ticket.ticket_id}</span>
            <div className="flex gap-2">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </div>

          <h2 className="text-2xl font-black text-zinc-900">{ticket.title}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] bg-zinc-50 p-4 rounded-xl border border-zinc-200">
            <div>
              <span className="block text-zinc-500 mb-0.5 uppercase font-extrabold tracking-wider">Category</span>
              <span className="font-bold text-zinc-800">{ticket.category}</span>
            </div>
            <div>
              <span className="block text-zinc-500 mb-0.5 uppercase font-extrabold tracking-wider">Created At</span>
              <span className="font-bold text-zinc-800">{ticket.created_at}</span>
            </div>
            <div>
              <span className="block text-zinc-500 mb-0.5 uppercase font-extrabold tracking-wider">SLA response</span>
              <span className="font-bold text-[#1f533a]">{ticket.response_deadline}</span>
            </div>
            <div>
              <span className="block text-zinc-500 mb-0.5 uppercase font-extrabold tracking-wider">SLA resolution</span>
              <span className="font-bold text-[#b57351]">{ticket.resolution_deadline}</span>
            </div>
          </div>
          
          {/* Real-time SLA breach status alert */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
            <Clock className="w-4 h-4 text-[#1f533a] shrink-0" />
            <div className="flex-1 flex justify-between items-center font-bold">
              <span className="text-zinc-500 uppercase tracking-wider text-[10px] font-extrabold">SLA Breach Warning Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] tracking-widest ${ticket.sla_breached ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                {ticket.sla_breached ? 'BREACHED' : 'HEALTHY'}
              </span>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-200 pb-2 text-zinc-800">
            <Car className="text-[#1f533a] w-5 h-5" /> Associated Vehicle Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="block text-xs text-zinc-500 font-bold uppercase tracking-wider">Make & Model</span>
              <span className="font-bold text-zinc-900 text-base">{ticket.make} {ticket.model} ({ticket.year})</span>
            </div>
            <div>
              <span className="block text-xs text-zinc-500 font-bold uppercase tracking-wider">License Plate / Mileage</span>
              <span className="font-bold text-zinc-900 text-base">{ticket.license_plate} / {ticket.mileage} miles</span>
            </div>
            <div>
              <span className="block text-xs text-zinc-500 font-bold uppercase tracking-wider">Vehicle Health Score</span>
              <span className={`font-black text-base ${ticket.health_score > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {ticket.health_score}%
              </span>
            </div>
          </div>
        </div>

        {/* WORK ORDER / WORKSHOP OPERATIONS MATRIX (Admins/Techs view) */}
        {(user.role === 'admin' || user.role === 'technician') && (
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-6 hud-border">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-200 pb-2 text-zinc-800">
              <Wrench className="text-[#1f533a] w-5 h-5 animate-spin-slow" /> Workshop Operations Desk
            </h3>

            {/* If ticket is open and no technician assigned */}
            {ticket.status === 'open' && user.role === 'admin' && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                <label className="block text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Assign Technician to Ticket</label>
                <div className="flex gap-3">
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors hud-input"
                  >
                    <option value="">-- Choose Specialised Mechanic --</option>
                    {techList.map(t => (
                      <option key={t.technician_id} value={t.technician_id}>
                        {t.name} ({t.specialization})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    className="px-6 py-2.5 rounded-xl font-bold transition-all cursor-pointer hud-btn-primary"
                  >
                    Confirm & Start WO
                  </button>
                </div>
              </div>
            )}

            {/* Technician Status and Work Order operations */}
            {ticket.work_order && (
              <div className="space-y-6">
                
                {/* Active status dropdown and details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div className="space-y-2">
                    <span className="block text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Estimated Cost</span>
                    {ticket.work_order.status === 'in_progress' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-[#1f533a]">₹{ticket.work_order.estimated_cost}</span>
                        <input 
                          type="number" 
                          placeholder="New Est"
                          value={estCostInput}
                          onChange={(e) => setEstCostInput(e.target.value)}
                          className="bg-white border border-zinc-200 rounded px-2 py-1 text-xs w-16 text-zinc-900 focus:outline-none focus:border-[#1f533a]"
                        />
                        <button onClick={handleUpdateEstimate} className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-[9px] px-2 py-1 rounded text-zinc-700 font-bold cursor-pointer uppercase">Set</button>
                      </div>
                    ) : (
                      <span className="text-xl font-black text-zinc-900">₹{ticket.work_order.estimated_cost}</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">Assigned Mechanic</span>
                    <span className="text-sm font-black text-[#b57351] uppercase tracking-wide">{ticket.technician_name}</span>
                  </div>
                  {/* Status Dropdown */}
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider mb-1">Set Ticket Status</span>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#1f533a] cursor-pointer"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="on_hold">On Hold</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* If Work Order is in progress */}
                {ticket.work_order.status === 'in_progress' && (
                  <>
                    {/* Add spare parts list */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider">Parts Deductions / Consumption Log</h4>
                      
                      {/* Part selector */}
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={partItemId}
                          onChange={(e) => setPartItemId(e.target.value)}
                          className="flex-1 min-w-[200px] rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors hud-input"
                        >
                          <option value="">-- Select Inventory Part --</option>
                          {partList.map(p => (
                            <option key={p.item_id} value={p.item_id}>
                              {p.name} ({p.part_number}) - Stock: {p.quantity}
                            </option>
                          ))}
                        </select>
                        <input 
                          type="number" 
                          min="1" 
                          value={partQty}
                          onChange={(e) => setPartQty(e.target.value)}
                          className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs w-16 text-zinc-900 text-center focus:outline-none focus:border-[#1f533a]"
                        />
                        <button
                          onClick={handleAddPart}
                          className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hud-btn-primary"
                        >
                          Add & Deduct Stock
                        </button>
                      </div>
                      
                      {/* Current Parts Used in Work Order */}
                      <div className="space-y-2 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Parts currently consumed in this job:</span>
                        {ticket.work_order.parts_used?.length === 0 ? (
                          <span className="text-xs text-zinc-500 block italic">No parts added yet.</span>
                        ) : (
                          ticket.work_order.parts_used.map(pu => (
                            <div key={pu.id} className="flex justify-between items-center text-xs py-1.5 border-b border-zinc-200 last:border-b-0">
                              <span className="text-zinc-750 font-medium">{pu.name} (<span className="font-mono text-[10px] text-zinc-500">{pu.part_number}</span>)</span>
                              <span className="font-black text-[#1f533a]">x {pu.quantity_used}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Complete Repair Job form */}
                    <form onSubmit={handleCompleteWorkOrder} className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-4">
                      <h4 className="text-[10px] font-extrabold text-zinc-500 uppercase border-b border-zinc-200 pb-2 tracking-wider">Finalise Repair Job Cards</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1 font-bold uppercase">Service Type Name</label>
                          <input 
                            type="text" 
                            required 
                            value={serviceTypeInput}
                            onChange={(e) => setServiceTypeInput(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors hud-input"
                            placeholder="e.g. Battery replacement & Engine tuning"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1 font-bold uppercase">Actual Final Cost (₹)</label>
                          <input 
                            type="number" 
                            required 
                            value={actCostInput}
                            onChange={(e) => setActCostInput(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors hud-input"
                            placeholder="e.g. 150"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1 font-bold uppercase">Update Vehicle Mileage (miles)</label>
                          <input 
                            type="number" 
                            value={woMileage}
                            onChange={(e) => setWoMileage(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors hud-input"
                            placeholder="e.g. 45800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1 font-bold uppercase">Vehicle Health Score (0 - 100)</label>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={woHealthScore}
                            onChange={(e) => setWoHealthScore(e.target.value)}
                            className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors hud-input"
                            placeholder="e.g. 95"
                          />
                        </div>
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-2.5 rounded-xl font-bold transition-all cursor-pointer hud-btn-orange"
                      >
                        Confirm Job Done & Close Ticket
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* If work order is completed */}
            {ticket.work_order && ticket.work_order.status === 'completed' && (
              <div className="bg-[#1f533a]/5 border border-[#1f533a]/20 p-4 rounded-xl space-y-2 text-xs">
                <span className="block font-black text-[#1f533a] uppercase tracking-wider">Repair Job Completed</span>
                <p className="text-zinc-600 font-medium">The assigned technician has declared this work order finished.</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px] block">Service Performed:</span>
                    <span className="font-bold text-zinc-800">{ticket.work_order.service_log?.service_type || 'General Repair'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold uppercase text-[9px] block">Total Charged:</span>
                    <span className="font-black text-[#1f533a]">₹{ticket.work_order.actual_cost}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORK ORDER / COMPLETED CARD (For Customer View) */}
        {user.role === 'customer' && ticket.work_order && (
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4 hud-border">
            <h3 className="text-lg font-bold border-b border-zinc-200 pb-2 text-zinc-800">
              Workshop Repair Order Updates
            </h3>
            <div className="text-sm font-semibold">
              <span className="text-zinc-500">Current Order Status:</span>
              <span className="ml-2 font-black capitalize text-[#1f533a]">{ticket.work_order.status}</span>
            </div>
            
            {ticket.work_order.status === 'completed' ? (
              <div className="bg-[#1f533a]/5 border border-[#1f533a]/20 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-black text-[#1f533a] block uppercase tracking-wider">Service Log Saved</span>
                <div>
                  <span className="text-zinc-500 font-bold uppercase text-[9px]">Action taken:</span>
                  <span className="font-bold text-zinc-800 ml-2">{ticket.work_order.service_log?.service_type}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold uppercase text-[9px]">Date completed:</span>
                  <span className="font-mono text-zinc-600 ml-2">{ticket.work_order.service_log?.performed_date}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold uppercase text-[9px]">Invoice:</span>
                  <span className="font-black text-zinc-900 ml-2">₹{ticket.work_order.actual_cost}</span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs">
                <span className="text-zinc-500 font-bold uppercase text-[9px] block mb-1">Est. Estimate: </span>
                <span className="font-black text-zinc-900 text-base">₹{ticket.work_order.estimated_cost}</span>
                <p className="text-[10px] text-zinc-500 mt-2 font-bold uppercase">Technician {ticket.technician_name || 'is currently working'} on diagnosing the mechanical components.</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Status History */}
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-3 hud-border">
          <h3 className="text-lg font-bold border-b border-zinc-200 pb-2 text-zinc-800">
            Ticket Audit History Trail
          </h3>
          {ticket.status_history?.length === 0 ? (
            <span className="text-xs text-zinc-500 italic font-bold">No status changes recorded yet.</span>
          ) : (
            <div className="relative pl-6 border-l border-zinc-200 space-y-4">
              {ticket.status_history.map((h, i) => (
                <div key={h.history_id} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#1f533a] border-2 border-white shadow-sm"></div>
                  <div className="text-xs font-semibold">
                    <span className="text-zinc-500 font-mono">{h.changed_at} : </span>
                    <span className="text-zinc-500 font-black">Transitioned: </span>
                    <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-mono text-[10px]">{h.old_status}</span>
                    <span className="text-zinc-500 font-black"> → </span>
                    <span className="bg-[#1f533a]/5 text-[#1f533a] border border-[#1f533a]/20 px-1.5 py-0.5 rounded font-bold text-[10px]">{h.new_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Col 3: Messaging Chat Component */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col h-[700px] overflow-hidden hud-border">
        {/* Chat header */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-900">Customer-Staff Messenger</h3>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Realtime Telemetry Chat</span>
          </div>
          <button 
            onClick={fetchDetails}
            className="text-[#1f533a] hover:text-[#1f533a]/80 p-2 rounded-lg transition-colors cursor-pointer"
            title="Refresh Chat Thread"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Chat messages stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/20">
          {ticket.conversation?.messages?.map(msg => {
            const isMe = msg.sender_id === user.user_id;
            return (
              <div key={msg.message_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Meta details */}
                <span className="text-[9px] text-zinc-400 mb-1 px-1 font-bold uppercase">
                  {msg.sender_name} ({msg.sender_role}) • {msg.created_at.split(' ')[1]}
                </span>
                {/* Bubble */}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isMe 
                    ? 'bg-[#1f533a]/10 border border-[#1f533a]/20 text-zinc-900 rounded-tr-none' 
                    : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                  
                  {/* Attachments */}
                  {msg.attachments?.map(att => (
                    <div key={att.attachment_id} className="mt-2 pt-2 border-t border-zinc-200">
                      <a 
                        href={att.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs flex items-center gap-1.5 text-sky-600 underline font-bold"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> View Attached Media
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-200 bg-zinc-50/50 space-y-3">
          {showAttachInput && (
            <div className="animate-slide-in">
              <label className="block text-[9px] text-zinc-500 font-extrabold uppercase mb-1">Attachment Web Link URL</label>
              <input 
                type="url" 
                value={fileUrlInput}
                onChange={(e) => setFileUrlInput(e.target.value)}
                className="w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none transition-colors hud-input"
                placeholder="https://image-hosting-service.com/engine-leak.png"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAttachInput(!showAttachInput)}
              title="Attach media URL link"
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                showAttachInput 
                  ? 'bg-[#1f533a]/20 border-[#1f533a]/45 text-[#1f533a]' 
                  : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <input 
              type="text" 
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              className="flex-1 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-colors hud-input font-medium"
              placeholder="Type diagnostic log message..."
            />
            
            <button
              type="submit"
              className="p-2.5 bg-[#1f533a] hover:bg-[#123323] text-white rounded-xl font-bold transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
