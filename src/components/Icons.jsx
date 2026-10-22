import React from 'react';

// Common SVG props helper
const svgProps = (size = 20, color = 'currentColor') => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { display: 'inline-block', verticalAlign: 'middle' }
});

export const ShieldIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const IngestionIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M12 2a10 10 0 0 1 10 10c0 2.22-1 4.5-2.7 6.3L12 12V2z" />
    <path d="M12 12l7.3 6.3c-1.8 1.7-4.08 2.7-6.3 2.7a10 10 0 0 1-10-10c0-2.22 1-4.5 2.7-6.3L12 12z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export const AnalyticsIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const RobotIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
    <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
  </svg>
);

export const SettingsIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const LightningIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
  </svg>
);

export const RocketIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M4.5 16.5c-1.5 1.5-2.5 3.5-2.5 5.5C4 22 6 21 7.5 19.5" />
    <path d="M12 2C6.5 2 2 6.5 2 12c0 1.5.5 3 1.5 4.5l1.5-1.5C4.5 14.5 4 13.5 4 12.5c0-4.5 3.5-8 8-8s8 3.5 8 8c0 1-.5 2-1 2.5l1.5 1.5c1-1.5 1.5-3 1.5-4.5 0-5.5-4.5-10-10-10z" />
    <path d="M19 9l-5 5" />
    <path d="M9 15l-5 5" />
    <path d="M12 8l4 4" />
  </svg>
);

export const LinkIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const BrainIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
    <path d="M9 13a4.5 4.5 0 0 0 3-4"/>
    <path d="M15 13a4.5 4.5 0 0 1-3-4"/>
  </svg>
);

export const MoneyIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const GlobeIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const PubSubIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const DatabaseIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

export const KeyIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.778zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L19 4" />
  </svg>
);

export const UserIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const UsersIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const SearchIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const PhoneIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const BankIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <line x1="3" y1="22" x2="21" y2="22" />
    <line x1="6" y1="18" x2="6" y2="11" />
    <line x1="10" y1="18" x2="10" y2="11" />
    <line x1="14" y1="18" x2="14" y2="11" />
    <line x1="18" y1="18" x2="18" y2="11" />
    <polygon points="12 2 3 7 21 7 12 2" />
  </svg>
);

export const LockIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const AlertIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const CheckIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const EyeIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const ResetIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export const ClipboardIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

export const EmptyIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export const PhoneCallIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const CloseIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const PlayIcon = ({ size, color }) => (
  <svg {...svgProps(size, color)}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
);

export const ArrowLeftIcon = ({ size, color = 'currentColor' }) => (
  <svg {...svgProps(size, color)}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const TargetIcon = ({ size, color = 'currentColor' }) => (
  <svg {...svgProps(size, color)}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const CameraIcon = ({ size, color = 'currentColor' }) => (
  <svg {...svgProps(size, color)}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const EditIcon = ({ size, color = 'currentColor' }) => (
  <svg {...svgProps(size, color)}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const QrCodeIcon = ({ size, color = 'currentColor' }) => (
  <svg {...svgProps(size, color)}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
    <line x1="17" y1="7" x2="17.01" y2="7" strokeWidth="3" />
    <line x1="7" y1="17" x2="7.01" y2="17" strokeWidth="3" />
    <line x1="17" y1="17" x2="17.01" y2="17" strokeWidth="3" />
  </svg>
);

export const RadarIcon = ({ size, color = 'currentColor' }) => (
  <svg {...svgProps(size, color)}>
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    <line x1="12" y1="12" x2="17.65" y2="6.35" />
  </svg>
);

export const ScaleIcon = ({ size, color = 'currentColor' }) => (
  <svg {...svgProps(size, color)}>
    <line x1="12" y1="3" x2="12" y2="21" />
    <polyline points="4 7 12 5 20 7" />
    <polyline points="1 13 4 7 7 13" />
    <polyline points="17 13 20 7 23 13" />
    <path d="M1 13a3 3 0 0 0 6 0M17 13a3 3 0 0 0 6 0" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);
