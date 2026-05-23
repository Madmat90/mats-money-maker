import React from 'react';

export function DragGrip() {
  return (
    <svg
      width="14" height="18" viewBox="0 0 14 18"
      style={{ opacity: 0.35, flexShrink: 0, cursor: 'grab' }}
    >
      <circle cx="4"  cy="4"  r="1.4" fill="currentColor"/>
      <circle cx="10" cy="4"  r="1.4" fill="currentColor"/>
      <circle cx="4"  cy="9"  r="1.4" fill="currentColor"/>
      <circle cx="10" cy="9"  r="1.4" fill="currentColor"/>
      <circle cx="4"  cy="14" r="1.4" fill="currentColor"/>
      <circle cx="10" cy="14" r="1.4" fill="currentColor"/>
    </svg>
  );
}
