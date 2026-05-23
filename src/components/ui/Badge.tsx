import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  /** Achtergrondkleur — gebruik een token of hex */
  color: string;
}

export function Badge({ children, color }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 9px',
      borderRadius: 'var(--mm-r-xs)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      background: color,
      color: '#faf6ee',
      flexShrink: 0,
    }}>
      {children}
    </span>
  );
}
