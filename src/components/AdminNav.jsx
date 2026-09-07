import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Clock, Wallet, Inbox, IdCard, LayoutGrid } from 'lucide-react';

/**
 * One nav for every admin console.
 *
 * Each console used to carry its own hand-written row of links, so they drifted
 * — and the Admin Command Center at /employee-kyc, which is where HR actually
 * lands after logging in, had no links at all. HR could reach attendance,
 * petty cash and leads only by typing the URL.
 *
 * It WRAPS rather than scrolling horizontally. An overflow-x row silently hid
 * the last link or two below about 800px — measured, not guessed — and a link
 * you have to discover by swiping sideways is a link HR will not find. Two
 * short rows beat one row with the end cut off.
 */
export const ADMIN_LINKS = [
  { to: '/employee-kyc',     label: 'Command Center', Icon: LayoutGrid },
  { to: '/admin/attendance', label: 'Attendance',     Icon: Users },
  { to: '/admin/leads',      label: 'Leads',          Icon: Inbox },
  { to: '/admin/expenses',   label: 'Petty Cash',     Icon: Wallet },
  { to: '/admin/cards',      label: 'Cards',          Icon: IdCard },
  { to: '/admin/interviews', label: 'Interviews',     Icon: Clock },
];

export default function AdminNav({ className = '' }) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Admin consoles"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {ADMIN_LINKS.map(({ to, label, Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium border transition ${
              active
                ? 'bg-[#10243E] text-white border-[#10243E]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37] hover:text-[#9C7C1C]'
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
