import React from 'react';

export default function Header({ user, currentView }) {
  const splitTitles = {
    dashboard:      <><strong>Overview</strong></>,
    tickets:        <>Service <strong>Tickets</strong> &amp; Complaints</>,
    new_ticket:     <>Create <strong>Service Ticket</strong></>,
    ticket_details: <>Ticket <strong>Operations</strong> &amp; Chat</>,
    vehicles:       <>Vehicle <strong>Fleet</strong></>,
    inventory:      <>Inventory &amp; <strong>Parts Catalogue</strong></>,
    team:           <>Technician <strong>Management</strong></>,
  };

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
      <h1 className="text-lg tracking-wide text-zinc-800 split-text">
        {splitTitles[currentView] || <><strong>CRM</strong> Hub</>}
      </h1>

      {/* Role badge */}
      <span className="px-3 py-1 bg-zinc-100 border border-zinc-200 text-[#1f533a] text-xs font-bold uppercase rounded-lg tracking-wider">
        {user.role} Portal
      </span>
    </header>
  );
}
