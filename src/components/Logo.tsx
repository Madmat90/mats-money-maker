// Logo.tsx — MMSymbol + MMLogo
// Gebaseerd op logo.jsx uit de design handoff.
// Gecommitteerde variant: 'sprout'.

import React from 'react';

export type SymbolVariant = 'sprout' | 'mark' | 'cart';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type LogoLayout = 'horizontal' | 'stacked' | 'mark-only';

interface MMSymbolProps {
  variant?: SymbolVariant;
  size?: number;
  color?: string;
  accent?: string;
}

export function MMSymbol({
  variant = 'sprout',
  size = 28,
  color = 'currentColor',
  accent = '#f08a3e',
}: MMSymbolProps) {
  if (variant === 'sprout') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M16 28 V14" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        {/* left leaf */}
        <path d="M16 17 C 11 17, 7.5 14, 7 9 C 12 9.2, 15.5 12, 16 17 Z"
              fill={color} opacity={0.9}/>
        {/* right leaf */}
        <path d="M16 14 C 21 14, 24.5 11, 25 6 C 20 6.2, 16.5 9, 16 14 Z"
              fill={color}/>
        {/* saffron seed */}
        <circle cx="16" cy="22.5" r="1.7" fill={accent}/>
      </svg>
    );
  }
  if (variant === 'mark') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M3 25 V9 L9 18 L15 9 L21 18 L27 9 L29 9 V25"
              stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
              fill="none"/>
        <circle cx="27.5" cy="6.5" r="2" fill={accent}/>
      </svg>
    );
  }
  if (variant === 'cart') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M10 13 C 10 7, 22 7, 22 13"
              stroke={accent} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M5 13 H27 L24 25 H8 Z"
              stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
        <path d="M12 13 V25 M16 13 V25 M20 13 V25"
              stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity={0.5}/>
      </svg>
    );
  }
  return null;
}

interface MMLogoProps {
  variant?: SymbolVariant;
  size?: LogoSize;
  color?: string;
  accent?: string;
  layout?: LogoLayout;
}

export function MMLogo({
  variant = 'sprout',
  size = 'md',
  color = '#faf6ee',
  accent = '#f08a3e',
  layout = 'horizontal',
}: MMLogoProps) {
  const scale = ({ sm: 0.65, md: 1, lg: 1.55, xl: 2.4 } as const)[size] ?? 1;
  const symbolSize = Math.round(28 * scale);
  const matsSize   = Math.round(34 * scale);
  const tagSize    = Math.round(9.5 * scale);

  if (layout === 'mark-only') {
    return (
      <MMSymbol
        variant={variant}
        size={Math.round(symbolSize * 1.6)}
        color={color}
        accent={accent}
      />
    );
  }

  const wordmark = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
      <span style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 360,
        fontVariationSettings: "'opsz' 144, 'SOFT' 40",
        fontSize: matsSize,
        letterSpacing: '-0.03em',
        color,
        lineHeight: 0.9,
      }}>Mats</span>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: tagSize,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color,
        opacity: 0.78,
        marginTop: 4 * scale,
      }}>Money&nbsp;Maker</span>
    </div>
  );

  if (layout === 'stacked') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * scale }}>
        <MMSymbol variant={variant} size={Math.round(symbolSize * 1.4)} color={color} accent={accent}/>
        <div style={{ textAlign: 'center' }}>{wordmark}</div>
      </div>
    );
  }

  // horizontal (default)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 * scale }}>
      <MMSymbol variant={variant} size={Math.round(symbolSize * 1.2)} color={color} accent={accent}/>
      {wordmark}
    </div>
  );
}
