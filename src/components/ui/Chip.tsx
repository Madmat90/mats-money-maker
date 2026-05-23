import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  accent?: string;
  onClick?: () => void;
}

export function Chip({ children, active, accent = '#f08a3e', onClick }: ChipProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 'var(--mm-r-pill)',
        fontSize: 12.5,
        fontWeight: 500,
        background: active ? 'var(--mm-navy)' : 'transparent',
        color: active ? '#faf6ee' : 'var(--mm-ink)',
        border: active ? 'none' : '1px solid rgba(19,28,46,0.15)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {active && (
        <span style={{
          width: 6, height: 6, borderRadius: 99,
          background: accent, flexShrink: 0,
        }}/>
      )}
      {children}
    </span>
  );
}
