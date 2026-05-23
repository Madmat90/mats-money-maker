interface CircBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}

export function CircBtn({ children, onClick, ariaLabel }: CircBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 38,
        height: 38,
        borderRadius: 99,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'var(--mm-bone)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
