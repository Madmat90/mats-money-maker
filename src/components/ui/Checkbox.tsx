interface CheckboxProps {
  checked: boolean;
  accent?: string;
}

export function Checkbox({ checked, accent = '#f08a3e' }: CheckboxProps) {
  return (
    <div style={{
      width: 22,
      height: 22,
      borderRadius: 6,
      border: checked ? 'none' : '1.5px solid rgba(19,28,46,0.3)',
      background: checked ? accent : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all .15s',
    }}>
      {checked && (
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
          <path d="M2 6 L5 9 L10 3"
                stroke="#1a2540" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}
