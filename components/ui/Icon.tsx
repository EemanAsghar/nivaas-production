'use client';

type IconName =
  | 'search' | 'pin' | 'check' | 'shield' | 'stamp' | 'sparkle'
  | 'bed' | 'bath' | 'square' | 'heart' | 'arrow' | 'filter' | 'map'
  | 'calendar' | 'chat' | 'zap' | 'plus' | 'camera' | 'badge' | 'dot'
  | 'user' | 'file' | 'pdf' | 'wifi' | 'gas' | 'drop' | 'bolt' | 'close'
  | 'chevronDown' | 'chevronRight' | 'home' | 'moon';

const paths: Record<IconName, React.ReactNode> = {
  search:       <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  pin:          <><path d="M12 22s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="10" r="2.5"/></>,
  check:        <><path d="M4 12.5 10 18 20 6"/></>,
  shield:       <><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
  stamp:        <><rect x="4" y="13" width="16" height="4" rx="1"/><path d="M8 13V9a4 4 0 0 1 8 0v4"/><path d="M4 20h16"/></>,
  sparkle:      <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>,
  bed:          <><path d="M3 18V8M3 13h18v5M21 13V10a2 2 0 0 0-2-2h-8v5"/><circle cx="7" cy="11" r="1.5"/></>,
  bath:         <><path d="M4 11h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z"/><path d="M6 11V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2"/><path d="M3 18v3M21 18v3"/></>,
  square:       <><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4"/></>,
  heart:        <><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/></>,
  arrow:        <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  filter:       <><path d="M4 6h16M7 12h10M10 18h4"/></>,
  map:          <><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><path d="M9 4v14M15 6v14"/></>,
  calendar:     <><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></>,
  chat:         <><path d="M5 5h14v10H9l-4 4V5Z"/></>,
  zap:          <><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/></>,
  plus:         <><path d="M12 5v14M5 12h14"/></>,
  camera:       <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2"/><circle cx="12" cy="13" r="3.5"/></>,
  badge:        <><path d="m12 3 2.5 2H18l1 3.5L22 11l-2 2.5L22 17l-3 1.5-1 3.5h-3.5L12 24l-2.5-2H6l-1-3.5L2 17l2-2.5L2 11l3-1.5L6 6h3.5L12 3Z"/></>,
  dot:          <><circle cx="12" cy="12" r="3"/></>,
  user:         <><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-5 5-7 8-7s6.5 2 8 7"/></>,
  file:         <><path d="M6 3h9l4 4v14H6V3Z"/><path d="M14 3v5h5"/></>,
  pdf:          <><path d="M6 3h9l4 4v14H6V3Z"/><path d="M14 3v5h5"/><path d="M9 14h6M9 17h4"/></>,
  wifi:         <><path d="M3 9c5-4 13-4 18 0"/><path d="M6 13c3.5-3 9-3 12 0"/><path d="M9.5 17c1.5-1.4 3.5-1.4 5 0"/><circle cx="12" cy="19" r=".5"/></>,
  gas:          <><path d="M12 3s5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 2-5s1 1 1 3c1-2 2-5 2-8Z"/></>,
  drop:         <><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/></>,
  bolt:         <><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/></>,
  close:        <><path d="M6 6l12 12M18 6 6 18"/></>,
  chevronDown:  <><path d="m6 9 6 6 6-6"/></>,
  chevronRight: <><path d="m9 6 6 6-6 6"/></>,
  home:         <><path d="M3 11 12 4l9 7v9h-6v-6h-6v6H3v-9Z"/></>,
  moon:         <><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/></>,
};

interface IconProps {
  name: IconName;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, className = 'n-ico', style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      {paths[name]}
    </svg>
  );
}
