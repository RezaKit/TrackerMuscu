interface IconProps {
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
}

const Icon = ({ children, size = 22, color = 'currentColor', stroke = 1.8, fill = 'none' }: IconProps & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const Icons = {
  Home:         (p: IconProps) => <Icon {...p}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></Icon>,
  Calendar:     (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></Icon>,
  Stats:        (p: IconProps) => <Icon {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></Icon>,
  Run:          (p: IconProps) => <Icon {...p}><circle cx="13" cy="4" r="2"/><path d="M5 22l4-9 3 3v6"/><path d="M9 13l-3-2 4-5 4 2 3 4"/></Icon>,
  Flag:         (p: IconProps) => <Icon {...p}><path d="M5 22V4M5 4h13l-2 4 2 4H5"/></Icon>,
  Plus:         (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Settings:     (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,
  Dumbbell:     (p: IconProps) => <Icon {...p}><path d="M6 8v8M2 10v4M18 8v8M22 10v4M6 12h12"/></Icon>,
  Swim:         (p: IconProps) => <Icon {...p}><circle cx="17" cy="6" r="2"/><path d="M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M2 14c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M9 14l4-3 3 3"/></Icon>,
  Flame:        (p: IconProps) => <Icon {...p}><path d="M12 22c4.5 0 7-3 7-6.5 0-2-1-3.5-2.5-5C15 9 14 7 14 5c-1.5 1-3 2.5-3.5 4.5C9.5 8 8 7 7 6c-1 2.5-2 4.5-2 7 0 5 3 9 7 9z"/></Icon>,
  Moon:         (p: IconProps) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Icon>,
  Bed:          (p: IconProps) => <Icon {...p}><path d="M2 18v-7a2 2 0 0 1 2-2h14a4 4 0 0 1 4 4v5"/><path d="M2 14h20M2 22v-4M22 22v-4"/><circle cx="7" cy="11" r="2"/></Icon>,
  Book:         (p: IconProps) => <Icon {...p}><path d="M4 4v15a2 2 0 0 0 2 2h14V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM6 21a2 2 0 0 1-2-2 2 2 0 0 1 2-2h14"/></Icon>,
  Shower:       (p: IconProps) => <Icon {...p}><path d="M4 4h6a4 4 0 0 1 4 4v2"/><circle cx="14" cy="13" r="4"/><path d="M14 17v4M11 16l-2 3M17 16l2 3"/></Icon>,
  Trophy:       (p: IconProps) => <Icon {...p}><path d="M6 4h12v4a6 6 0 0 1-12 0V4z"/><path d="M6 6H3a3 3 0 0 0 3 3M18 6h3a3 3 0 0 1-3 3M9 17h6M10 14v3M14 14v3M9 21h6"/></Icon>,
  Edit:         (p: IconProps) => <Icon {...p}><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>,
  Trash:        (p: IconProps) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Check:        (p: IconProps) => <Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>,
  X:            (p: IconProps) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
  ChevronRight: (p: IconProps) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  ChevronLeft:  (p: IconProps) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  ChevronDown:  (p: IconProps) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  ChevronUp:    (p: IconProps) => <Icon {...p}><path d="M18 15l-6-6-6 6"/></Icon>,
  TrendUp:      (p: IconProps) => <Icon {...p}><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></Icon>,
  TrendDown:    (p: IconProps) => <Icon {...p}><path d="M3 7l6 6 4-4 8 8M14 17h7v-7"/></Icon>,
  Apple:        (p: IconProps) => <Icon {...p}><path d="M12 7c0-2 1-4 3-4 0 2-1 4-3 4z"/><path d="M12 7c-1-.5-2-1-3.5-1C5 6 3 9 3 13c0 4 2 8 5 8 1.5 0 2-1 4-1s2.5 1 4 1c2 0 4-2 5-5-2-1-3-3-3-5 0-2 1-3 2-4-1-1-2-1-3.5-1-1.5 0-2.5.5-3.5 1z"/></Icon>,
  Search:       (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Save:         (p: IconProps) => <Icon {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></Icon>,
  Filter:       (p: IconProps) => <Icon {...p}><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z"/></Icon>,
  Lightning:    (p: IconProps) => <Icon {...p}><path d="M13 2L4 14h6l-2 8 9-12h-6l2-8z"/></Icon>,
  Clock:        (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  Target:       (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></Icon>,
  Spark:        (p: IconProps) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></Icon>,
  Download:     (p: IconProps) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>,
  ArrowRight:   (p: IconProps) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  ArrowUp:      (p: IconProps) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  ArrowDown:    (p: IconProps) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  More:         (p: IconProps) => <Icon {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Icon>,
  Scale:        (p: IconProps) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 12h8M12 8v8"/></Icon>,
  Info:         (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v1M12 11v5"/></Icon>,
  Bot:          (p: IconProps) => <Icon {...p}><rect x="3" y="9" width="18" height="12" rx="3"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/><circle cx="15" cy="15" r="1.5" fill="currentColor"/><path d="M12 3v3M9 6h6"/></Icon>,
  Send:         (p: IconProps) => <Icon {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></Icon>,
  Sparkle:      (p: IconProps) => <Icon {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8L5 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></Icon>,
  Camera:       (p: IconProps) => <Icon {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Icon>,
  Image:        (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></Icon>,
  Mic:          (p: IconProps) => <Icon {...p}><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 19v3M9 22h6"/></Icon>,
  MicOff:       (p: IconProps) => <Icon {...p}><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><path d="M12 19v3M9 22h6M2 2l20 20"/></Icon>,
  Star:         (p: IconProps) => <Icon {...p}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></Icon>,
  Ban:          (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M5 5l14 14"/></Icon>,
  Link:         (p: IconProps) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></Icon>,
  Play:         (p: IconProps) => <Icon {...p}><path d="M5 4l14 8-14 8z" fill="currentColor"/></Icon>,
  Body:         (p: IconProps) => <Icon {...p}><circle cx="12" cy="4" r="2"/><path d="M12 6v8M8 14l4-2 4 2M9 22l3-8 3 8"/></Icon>,
};
