// Lightweight stroke icons for the dashboard widgets.
// Kept inline (no extra dependency) to match the project's existing icon usage.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function AdvisingIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M6 10.5V16c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5" />
      <path d="M22 8v6" />
    </svg>
  );
}

export function FinancialAidIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
      <path d="M15.5 3.5 12 6h5l-1.5-2.5Z" />
    </svg>
  );
}

export function RegistrationIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 2v4M16 2v4M4 10h16" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

export function EventsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <circle cx="8.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronRightIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function SparkleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.5 6.5 2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function ShieldAlertIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6l-8-3Z" />
      <path d="M12 8.5v4.5" />
      <circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 4v5h5" />
      <path d="M20 20v-5h-5" />
      <path d="M4.6 15a8 8 0 0 0 13.8 3.2M19.4 9a8 8 0 0 0-13.8-3.2" />
    </svg>
  );
}

export function XCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
    </svg>
  );
}

export function UserIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
    </svg>
  );
}

export function TicketIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M10 6v12" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

export function ClipboardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M8 10h8M8 14h8M8 18h5" />
    </svg>
  );
}

export function PulseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}

// -- Added for the shared AppLayout nav bar --

export function HomeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function UsersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c1.2-3.2 4-4.5 6-4.5s4.8 1.3 6 4.5" />
      <path d="M16 4.5a3 3 0 0 1 0 6" />
      <path d="M15.5 15.5c2 .1 4 1.4 5 4.5" />
    </svg>
  );
}

export function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function LogoutIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 8a2 2 0 0 1 2-2h1.5l1-2h7l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

// -- Added for the expanded ProfilePage --

export function IdCardIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5.5 16c.6-1.6 1.9-2.4 3-2.4s2.4.8 3 2.4" />
      <path d="M14 10h5M14 13h5" />
    </svg>
  );
}

export function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 3h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 3Z" />
    </svg>
  );
}

export function MapPinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function GenderIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10" cy="14" r="4.2" />
      <path d="M18 3v5M18 3h-5M18 3l-5.5 5.5" />
    </svg>
  );
}

export function DropletIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3s6 6.8 6 11a6 6 0 0 1-12 0c0-4.2 6-11 6-11Z" />
    </svg>
  );
}