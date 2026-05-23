// ProductListScreen.tsx
// Actieve boodschappenlijst met spraakherkenning, afvink-interactie en voice-toast.

import { useState, useEffect, useRef } from 'react';
import type { RouteSection, ShoppingItem } from '../types';
import type { DealInfo }  from '../hooks/useDeals';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MMLogo }   from './Logo';
import { Badge }    from './ui/Badge';
import { Checkbox } from './ui/Checkbox';
import { CircBtn }  from './ui/CircBtn';
import { DragGrip } from './ui/DragGrip';
import { MicIcon }  from './ui/MicIcon';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ACCENT = '#f08a3e';

const DAGEN = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const vandaag = DAGEN[new Date().getDay()];

// ── Voice-toast state machine ─────────────────────────────────────────────
type ToastState =
  | { mode: 'hidden' }
  | { mode: 'listening'; interim: string }
  | { mode: 'added';     text: string; elapsed: number }
  | { mode: 'error';     text: string };

// ── Vaste icons ───────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3" cy="8" r="1.4"/>
      <circle cx="8" cy="8" r="1.4"/>
      <circle cx="13" cy="8" r="1.4"/>
    </svg>
  );
}

// ── CategoryPicker ────────────────────────────────────────────────────────
function CategoryPicker({ sections, currentRoute, onSelect, onClose }: {
  sections:     RouteSection[];
  currentRoute: string;
  onSelect:     (route: string) => void;
  onClose:      () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(19,28,46,0.45)',
        display: 'flex', alignItems: 'flex-end', zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', background: 'var(--mm-paper)',
          borderRadius: '22px 22px 0 0', padding: '20px 18px 36px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontFamily: 'var(--mm-serif)', fontSize: 18, fontWeight: 350,
          fontVariationSettings: "'opsz' 144, 'SOFT' 40", marginBottom: 4,
        }}>Verplaats naar sectie</div>
        <div style={{ fontSize: 12.5, color: 'rgba(19,28,46,0.5)', marginBottom: 16 }}>
          De app onthoudt dit voor volgende keer.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map(s => (
            <button
              key={s.route}
              onClick={() => onSelect(s.route)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 'var(--mm-r-md)', border: 'none',
                background: s.route === currentRoute ? 'var(--mm-navy)' : 'var(--mm-cream)',
                color:      s.route === currentRoute ? 'var(--mm-bone)' : 'var(--mm-ink)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: 'var(--mm-mono)', fontSize: 11,
                color: s.route === currentRoute ? ACCENT : 'rgba(19,28,46,0.4)',
              }}>{s.route}</span>
              <span style={{
                fontFamily: 'var(--mm-serif)', fontSize: 17, fontWeight: 350,
                fontVariationSettings: "'opsz' 144, 'SOFT' 40",
              }}>{s.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ProductRow ─────────────────────────────────────────────────────────────
function ProductRow({
  item, currentRoute, onToggle, onDelete, onRouteChipTap, getDeal,
}: {
  item:           ShoppingItem;
  currentRoute:   string;
  onToggle:       () => void;
  onDelete:       () => void;
  onRouteChipTap: () => void;
  getDeal?:       (name: string) => DealInfo | undefined;
}) {
  const { name, qty, sale, carry, checked } = item;
  const apiDeal   = getDeal?.(name);
  const saleBadge = apiDeal?.badge ?? sale;

  // dnd-kit sortable hooks
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex:  isDragging ? 10  : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style }}
    >
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 14px',
        borderRadius: 'var(--mm-r-md)',
        background: checked ? 'transparent' : 'var(--mm-cream)',
        border: checked
          ? '1px dashed rgba(19,28,46,0.12)'
          : '1px solid transparent',
        cursor: 'pointer',
        transition: 'background .15s, border .15s',
      }}
    >
      <Checkbox checked={checked} accent={ACCENT}/>

      <div style={{
        flex: 1, minWidth: 0,
        opacity:        checked ? 0.42 : 1,
        textDecoration: checked ? 'line-through' : 'none',
        transition: 'opacity .15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}>
            {name}
          </span>
          {carry && !checked && (
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--mm-basil)',
              border: '1px solid currentColor', padding: '2px 5px',
              borderRadius: 3, opacity: 0.85, whiteSpace: 'nowrap',
            }}>↻ over</span>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'rgba(19,28,46,0.55)' }}>{qty}</span>
      </div>

      {saleBadge && !checked && (
        <Badge color={saleBadge === 'Bonus' ? ACCENT : 'var(--mm-tomato)'}>{saleBadge}</Badge>
      )}

      {/* Sectie-chip — tik om te verplaatsen */}
      {!checked && (
        <button
          onClick={e => { e.stopPropagation(); onRouteChipTap(); }}
          title="Verplaats naar andere sectie"
          style={{
            background: 'rgba(19,28,46,0.07)', border: 'none',
            borderRadius: 4, padding: '4px 7px',
            fontFamily: 'var(--mm-mono)', fontSize: 10,
            color: 'rgba(19,28,46,0.45)', cursor: 'pointer', flexShrink: 0,
          }}
        >{currentRoute}</button>
      )}

      {/* Verwijder-knop */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        aria-label={`Verwijder ${name}`}
        style={{
          background: 'none', border: 'none',
          color: 'rgba(19,28,46,0.25)', fontSize: 18,
          cursor: 'pointer', padding: '4px 4px',
          flexShrink: 0, lineHeight: 1,
        }}
      >×</button>

      {/* Drag grip — touch/pointer listeners voor dnd-kit */}
      <span
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()}
        style={{ touchAction: 'none', cursor: 'grab', flexShrink: 0 }}
      >
        <DragGrip/>
      </span>
    </div>
    </div>
  );
}

// ── RouteSection ──────────────────────────────────────────────────────────
function RouteSectionBlock({
  section, onToggle, onDelete, onReassign, onReorder, getDeal,
}: {
  section:    RouteSection;
  onToggle:   (id: string) => void;
  onDelete:   (id: string) => void;
  onReassign: (id: string, currentRoute: string) => void;
  onReorder:  (sectionRoute: string, fromIndex: number, toIndex: number) => void;
  getDeal?:   (name: string) => DealInfo | undefined;
}) {
  const checkedCount = section.items.filter(i => i.checked).length;
  if (section.items.length === 0) return null;

  const unchecked = section.items.filter(i => !i.checked);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = unchecked.findIndex(i => i.id === active.id);
    const toIndex   = unchecked.findIndex(i => i.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) onReorder(section.route, fromIndex, toIndex);
  }

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10,
        padding: '0 4px',
      }}>
        <span style={{ fontFamily: 'var(--mm-mono)', fontSize: 11, color: ACCENT, letterSpacing: '0.06em' }}>
          {section.route}
        </span>
        <h3 style={{
          fontFamily: 'var(--mm-serif)', fontWeight: 380,
          fontVariationSettings: "'opsz' 144, 'SOFT' 40",
          fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em',
          margin: 0, color: 'var(--mm-ink)',
        }}>{section.title}</h3>
        <span style={{
          flex: 1, height: 1, background: 'rgba(19,28,46,0.08)',
          alignSelf: 'center', marginBottom: 2,
        }}/>
        <span className="mm-tnum" style={{ fontSize: 11, color: 'rgba(19,28,46,0.4)' }}>
          {checkedCount}/{section.items.length}
        </span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={unchecked.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {unchecked.map(item => (
              <ProductRow
                key={item.id}
                item={item}
                currentRoute={section.route}
                onToggle={() => onToggle(item.id)}
                onDelete={() => onDelete(item.id)}
                onRouteChipTap={() => onReassign(item.id, section.route)}
                getDeal={getDeal}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ── VoiceToast ────────────────────────────────────────────────────────────
function VoiceToast({ toast }: { toast: ToastState }) {
  if (toast.mode === 'hidden') return null;

  const isListening = toast.mode === 'listening';
  const isError     = toast.mode === 'error';

  const label = isListening
    ? 'Aan het luisteren…'
    : isError
      ? toast.text
      : 'Net toegevoegd';

  const body = isListening
    ? (toast.interim || <span style={{ opacity: 0.45 }}>Spreek nu…</span>)
    : isError
      ? null
      : toast.text;

  const timer = toast.mode === 'added'
    ? `0:${String(toast.elapsed).padStart(2, '0')}`
    : null;

  return (
    <div style={{
      background: 'var(--mm-cream)', borderRadius: 'var(--mm-r-md)',
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 99,
        background: isError ? 'var(--mm-tomato)' : ACCENT,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <MicIcon color="#1a2540" size={16}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: 'rgba(19,28,46,0.55)' }}>
          {label}
        </div>
        {body && (
          <div style={{
            fontSize: 13.5, fontWeight: 500, marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{body}</div>
        )}
      </div>
      {timer && (
        <span style={{
          fontFamily: 'var(--mm-mono)', fontSize: 10,
          color: 'rgba(19,28,46,0.4)', flexShrink: 0,
        }}>{timer}</span>
      )}
    </div>
  );
}

// ── Fallback tekst-input (als Web Speech niet beschikbaar is) ──────────────
function ManualInput({ onSubmit, onClose }: {
  onSubmit: (text: string) => void;
  onClose:  () => void;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  function submit() {
    const t = value.trim();
    if (t) { onSubmit(t); setValue(''); }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(19,28,46,0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 200,
    }} onClick={onClose}>
      <div
        style={{
          width: '100%', background: 'var(--mm-paper)',
          borderRadius: '22px 22px 0 0', padding: '20px 18px 32px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'var(--mm-serif)', fontSize: 18, fontWeight: 350,
                      fontVariationSettings: "'opsz' 144, 'SOFT' 40" }}>
          Item toevoegen
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(19,28,46,0.55)' }}>
          Bijv. "melk en brood" of "3 tomaten"
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={ref}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="Typ een product…"
            style={{
              flex: 1, padding: '13px 16px', borderRadius: 'var(--mm-r-pill)',
              border: '1.5px solid rgba(19,28,46,0.18)', fontSize: 15,
              fontFamily: 'var(--mm-sans)', outline: 'none', background: 'var(--mm-cream)',
              color: 'var(--mm-ink)',
            }}
          />
          <button
            onClick={submit}
            style={{
              padding: '13px 20px', borderRadius: 'var(--mm-r-pill)',
              background: ACCENT, color: '#1a2540', border: 'none',
              fontFamily: 'var(--mm-sans)', fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
            }}
          >Voeg toe</button>
        </div>
      </div>
    </div>
  );
}

// ── DoneSectionBlock ──────────────────────────────────────────────────────
function DoneSectionBlock({ items, sections, onToggle, onDelete, onReassign }: {
  items:      ShoppingItem[];
  sections:   RouteSection[];
  onToggle:   (id: string) => void;
  onDelete:   (id: string) => void;
  onReassign: (id: string, route: string) => void;
}) {
  if (items.length === 0) return null;

  const getRoute = (id: string) => {
    for (const s of sections) {
      if (s.items.some(i => i.id === id)) return s.route;
    }
    return '04';
  };

  return (
    <div style={{ marginTop: 28, marginBottom: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
        padding: '0 4px',
      }}>
        <span style={{ fontFamily: 'var(--mm-mono)', fontSize: 11, color: 'var(--mm-basil)', letterSpacing: '0.06em' }}>✓</span>
        <h3 style={{
          fontFamily: 'var(--mm-serif)', fontWeight: 380,
          fontVariationSettings: "'opsz' 144, 'SOFT' 40",
          fontSize: 22, lineHeight: 1, letterSpacing: '-0.02em',
          margin: 0, color: 'rgba(19,28,46,0.4)',
        }}>Gedaan</h3>
        <span style={{ flex: 1, height: 1, background: 'rgba(19,28,46,0.06)', alignSelf: 'center' }}/>
        <span className="mm-tnum" style={{ fontSize: 11, color: 'rgba(19,28,46,0.3)' }}>
          {items.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, opacity: 0.7 }}>
        {items.map(item => {
          const route = getRoute(item.id);
          return (
            <ProductRow
              key={item.id}
              item={item}
              currentRoute={route}
              onToggle={() => onToggle(item.id)}
              onDelete={() => onDelete(item.id)}
              onRouteChipTap={() => onReassign(item.id, route)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── ProductListScreen ─────────────────────────────────────────────────────
interface ProductListScreenProps {
  sections:          RouteSection[];
  onToggleItem:      (id: string) => void;
  onDeleteItem:      (id: string) => void;
  onReassignItem:    (id: string, targetRoute: string) => void;
  onReorderItems:    (sectionRoute: string, from: number, to: number) => void;
  onAddByTranscript: (transcript: string) => ShoppingItem[];
  onNewList?:        () => void;
  getDeal?:          (name: string) => DealInfo | undefined;
  dealsLoading?:     boolean;
  onBack?:           () => void;
}

export function ProductListScreen({
  sections,
  onToggleItem,
  onDeleteItem,
  onReassignItem,
  onReorderItems,
  onAddByTranscript,
  onNewList,
  getDeal,
  dealsLoading = false,
  onBack,
}: ProductListScreenProps) {
  const { isListening, interim, isSupported, error, startListening, stopListening }
    = useSpeechRecognition();

  const [toast,           setToast]          = useState<ToastState>({ mode: 'hidden' });
  const [showManualInput, setShowManualInput] = useState(false);
  const [showMenu,        setShowMenu]        = useState(false);
  // { id, currentRoute } van het item waarvoor de categoriepicker open is
  const [pickerTarget, setPickerTarget] = useState<{ id: string; route: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync toast met luisterstatus
  useEffect(() => {
    if (isListening) {
      setToast({ mode: 'listening', interim: '' });
    }
  }, [isListening]);

  useEffect(() => {
    if (isListening && interim) {
      setToast({ mode: 'listening', interim });
    }
  }, [interim, isListening]);

  // Toon foutmelding uit de speech hook
  useEffect(() => {
    if (error) {
      setToast({ mode: 'error', text: error });
      setTimeout(() => setToast({ mode: 'hidden' }), 4000);
    }
  }, [error]);

  // Opruimen bij unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function showAddedToast(items: ShoppingItem[]) {
    if (!items.length) return;
    const text = items.map(i => i.name).join(', ');

    if (timerRef.current) clearInterval(timerRef.current);
    setToast({ mode: 'added', text, elapsed: 0 });

    // Teller bijhouden
    timerRef.current = setInterval(() => {
      setToast(prev =>
        prev.mode === 'added'
          ? { ...prev, elapsed: prev.elapsed + 1 }
          : prev
      );
    }, 1000);

    // Na 8 seconden verbergen
    setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setToast({ mode: 'hidden' });
    }, 8000);
  }

  function handleFab() {
    if (!isSupported) {
      setShowManualInput(true);
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    startListening(transcript => {
      const added = onAddByTranscript(transcript);
      showAddedToast(added);
    });
  }

  function handleManualSubmit(text: string) {
    setShowManualInput(false);
    const added = onAddByTranscript(text);
    showAddedToast(added);
  }

  // Samengestelde tellers
  const allItems     = sections.flatMap(s => s.items);
  const checkedTotal = allItems.filter(i => i.checked).length;
  const totalItems   = allItems.length;
  const bonusCount   = allItems.filter(i => i.sale && !i.checked).length;
  const carryCount   = allItems.filter(i => i.carry && !i.checked).length;
  const progress     = totalItems > 0 ? checkedTotal / totalItems : 0;

  return (
    <div style={{
      width: '100%', height: '100svh', overflow: 'hidden',
      background: 'var(--mm-paper)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--mm-sans)', color: 'var(--mm-ink)',
      position: 'relative',
    }}>

      {/* ── Navy header-band ── */}
      <div style={{
        background: 'var(--mm-navy)', color: 'var(--mm-bone)',
        padding: '18px 22px 24px',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Ghost achtergrondnummer */}
        <div style={{
          position: 'absolute', right: -10, top: -30,
          fontFamily: 'var(--mm-serif)', fontSize: 160, fontWeight: 300,
          fontVariationSettings: "'opsz' 144",
          color: 'rgba(255,255,255,0.04)', lineHeight: 1,
          pointerEvents: 'none', letterSpacing: '-0.04em', userSelect: 'none',
        }}>{totalItems}</div>

        {/* Logo + icoon-knoppen */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', position: 'relative',
        }}>
          <MMLogo variant="sprout" size="sm" color="var(--mm-bone)" accent={ACCENT}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <CircBtn ariaLabel="Terug" onClick={onBack}><BackIcon/></CircBtn>
            <CircBtn ariaLabel="Meer opties" onClick={() => setShowMenu(true)}><MoreIcon/></CircBtn>
          </div>
        </div>

        {/* Titelblok */}
        <div style={{ marginTop: 22, position: 'relative' }}>
          <div className="mm-eyebrow" style={{ color: ACCENT, opacity: 0.95 }}>
            Lijst · {vandaag}
          </div>
          <h1 style={{
            fontFamily: 'var(--mm-serif)', fontWeight: 320,
            fontVariationSettings: "'opsz' 144, 'SOFT' 50",
            fontSize: 44, lineHeight: 1, letterSpacing: '-0.03em',
            margin: '6px 0 0', color: 'var(--mm-bone)',
          }}>
            Boodschappen
          </h1>

          {/* Meta-rij */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 14,
            fontSize: 12.5, color: 'rgba(239,229,210,0.7)',
          }}>
            <span className="mm-tnum">
              <b style={{ color: 'var(--mm-bone)' }}>{checkedTotal}</b> / {totalItems} afgevinkt
            </span>
            {dealsLoading && <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ opacity: 0.55, fontStyle: 'italic' }}>aanbiedingen laden…</span>
            </>}
            {!dealsLoading && bonusCount > 0 && <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span><span style={{ color: ACCENT }}>{bonusCount}</span> bonusproducten</span>
            </>}
            {carryCount > 0 && <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ color: 'var(--mm-basil)' }}>{carryCount} meegenomen</span>
            </>}
            <span style={{ opacity: 0.4 }}>·</span>
            <span>routevolgorde</span>
          </div>

          {/* Voortgangsstrip */}
          <div style={{
            marginTop: 14, height: 3, background: 'rgba(239,229,210,0.12)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: ACCENT, borderRadius: 99, transition: 'width .3s ease',
            }}/>
          </div>
        </div>
      </div>

      {/* ── Voice toast ── */}
      <div style={{ padding: '14px 18px 4px', flexShrink: 0 }}>
        <VoiceToast toast={toast}/>
      </div>

      {/* ── Scrollende lijst ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 110px' }}>
        {sections.map(s => (
          <RouteSectionBlock
            key={s.route}
            section={{ ...s, items: s.items.filter(i => !i.checked) }}
            onToggle={onToggleItem}
            onDelete={onDeleteItem}
            onReassign={(id, route) => setPickerTarget({ id, route })}
            onReorder={onReorderItems}
            getDeal={getDeal}
          />
        ))}

        <DoneSectionBlock
          items={sections.flatMap(s => s.items.filter(i => i.checked))}
          sections={sections}
          onToggle={onToggleItem}
          onDelete={onDeleteItem}
          onReassign={(id, route) => setPickerTarget({ id, route })}
        />

        {totalItems === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            color: 'rgba(19,28,46,0.4)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              Lijst is leeg.<br/>
              Tap de microfoon om te beginnen.
            </div>
          </div>
        )}

        {/* Carry-over footer strip */}
        {carryCount > 0 && (
          <div style={{
            marginTop: 18, padding: '14px 16px', borderRadius: 'var(--mm-r-md)',
            background: 'rgba(75,122,74,0.08)',
            border: '1px dashed rgba(75,122,74,0.35)',
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <span style={{ fontSize: 18, color: 'var(--mm-basil)', flexShrink: 0 }}>↻</span>
            <span style={{ fontSize: 12.5, color: 'var(--mm-basil)', lineHeight: 1.4 }}>
              {carryCount} item{carryCount > 1 ? 's' : ''} meegenomen van vorige week.
            </span>
          </div>
        )}
      </div>

      {/* ── Floating Voice FAB ── */}
      <button
        aria-label={isListening ? 'Stop luisteren' : 'Spreek item in'}
        onClick={handleFab}
        style={{
          position: 'fixed', right: 22, bottom: 30,
          width: 64, height: 64, borderRadius: 99,
          background: ACCENT,
          border: '4px solid var(--mm-paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `0 14px 30px -8px ${ACCENT}, 0 0 0 1px rgba(0,0,0,0.04)`,
          zIndex: 100,
          transition: 'transform .1s',
        }}
      >
        <MicIcon color="#1a2540" size={24}/>
        {/* Pulse ring — altijd zichtbaar; sneller/groter als listening */}
        <span style={{
          position: 'absolute', inset: '-4px', borderRadius: 99,
          border: `2px solid ${ACCENT}`,
          animation: isListening
            ? 'mmPulse 1.1s ease-out infinite'
            : 'mmPulse 1.8s ease-out infinite',
          pointerEvents: 'none',
        }}/>
      </button>

      {/* ── Tekst-invoer fallback ── */}
      {showManualInput && (
        <ManualInput
          onSubmit={handleManualSubmit}
          onClose={() => setShowManualInput(false)}
        />
      )}

      {/* ── Meer-opties menu ── */}
      {showMenu && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(19,28,46,0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 300 }}
          onClick={() => setShowMenu(false)}
        >
          <div
            style={{ width: '100%', background: 'var(--mm-paper)', borderRadius: '22px 22px 0 0', padding: '20px 18px 36px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--mm-serif)', fontSize: 18, fontWeight: 350, fontVariationSettings: "'opsz' 144, 'SOFT' 40", marginBottom: 16 }}>
              Opties
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => { setShowMenu(false); onNewList?.(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 'var(--mm-r-md)', border: 'none', background: 'var(--mm-cream)', color: 'var(--mm-ink)', cursor: 'pointer', textAlign: 'left', fontSize: 15, fontFamily: 'var(--mm-sans)' }}
              >
                🗒️ Nieuw lijstje beginnen
              </button>
              <button
                onClick={() => { setShowMenu(false); onBack?.(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 'var(--mm-r-md)', border: 'none', background: 'var(--mm-cream)', color: 'var(--mm-ink)', cursor: 'pointer', textAlign: 'left', fontSize: 15, fontFamily: 'var(--mm-sans)' }}
              >
                ← Terug naar beginscherm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Categorie-picker ── */}
      {pickerTarget && (
        <CategoryPicker
          sections={sections}
          currentRoute={pickerTarget.route}
          onSelect={route => {
            onReassignItem(pickerTarget.id, route);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}
