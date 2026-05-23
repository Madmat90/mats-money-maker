import React from 'react';

interface MicIconProps {
  color?: string;
  size?: number;
}

export function MicIcon({ color = '#faf6ee', size = 20 }: MicIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="7" y="2.5" width="6" height="10" rx="3" fill={color}/>
      <path d="M4 9 C 4 13, 7 15, 10 15 C 13 15, 16 13, 16 9"
            stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M10 15 V18 M7 18 H13"
            stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
