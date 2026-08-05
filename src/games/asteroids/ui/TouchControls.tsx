import { useCallback, useRef } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  leftHanded: boolean;
  onAim: (heading: number | null) => void;
  onThrust: (on: boolean) => void;
  onFiring: (on: boolean) => void;
  onHyperspace: () => void;
}

/** Ring radius in CSS pixels, and the two thresholds inside it. */
const RING = 56;
const DEAD_ZONE = 12;
const THRUST_AT = RING * 0.6;

/**
 * Two thumbs, and no d-pad.
 *
 * A d-pad is the standard bad port of this game. Rotation is sustained and
 * wants to feel analog, and four discrete squares put the player's eyes on
 * their own thumbs while the ship drifts. So the steering half of the field is
 * a floating stick: it appears wherever the thumb lands, which means there is
 * never anything to find.
 *
 * The stick sets a target heading rather than pointing the ship. The ship still
 * rotates at its own rate, so anticipating your own turn, which is most of the
 * skill in this game, survives the port intact.
 *
 * Nothing here goes through React state. The knob moves on every pointer event,
 * and a component that re-rendered for it would be doing sixty renders a second
 * for a circle that CSS can move on its own.
 */
export function TouchControls({
  leftHanded,
  onAim,
  onThrust,
  onFiring,
  onHyperspace,
}: Props) {
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const fireIdRef = useRef<number | null>(null);

  const place = useCallback((x: number, y: number, kx: number, ky: number, on: boolean) => {
    const stick = stickRef.current;
    const knob = knobRef.current;
    if (!stick || !knob) return;
    stick.style.opacity = on ? '1' : '0';
    stick.style.transform = `translate(${x - RING}px, ${y - RING}px)`;
    knob.style.transform = `translate(${kx}px, ${ky}px)`;
  }, []);

  const endStick = useCallback(() => {
    originRef.current = null;
    onAim(null);
    onThrust(false);
    place(0, 0, 0, 0, false);
  }, [onAim, onThrust, place]);

  const steerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (originRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    originRef.current = { id: e.pointerId, x, y };
    place(x, y, 0, 0, true);
  };

  const steerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const origin = originRef.current;
    if (!origin || origin.id !== e.pointerId) return;

    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - box.left - origin.x;
    const dy = e.clientY - box.top - origin.y;
    const distance = Math.hypot(dx, dy);

    const clamped = Math.min(distance, RING);
    const kx = distance === 0 ? 0 : (dx / distance) * clamped;
    const ky = distance === 0 ? 0 : (dy / distance) * clamped;
    place(origin.x, origin.y, kx, ky, true);

    // Inside the dead zone the ship holds its heading, so a resting thumb is
    // not a steering input.
    if (distance < DEAD_ZONE) {
      onThrust(false);
      return;
    }
    onAim(Math.atan2(dy, dx));
    // Aiming without accelerating is the fine control this genre needs, so
    // thrust only comes on past well over half the ring.
    onThrust(distance > THRUST_AT);
  };

  const steerSide = leftHanded ? 'right-0' : 'left-0';
  const fireSide = leftHanded ? 'left-0' : 'right-0';

  return (
    <div className="pointer-events-none absolute inset-0 z-0 [@media(hover:hover)]:hidden">
      <div
        className={`pointer-events-auto absolute inset-y-0 ${steerSide} w-1/2 touch-none`}
        onPointerDown={steerDown}
        onPointerMove={steerMove}
        onPointerUp={endStick}
        onPointerCancel={endStick}
        onLostPointerCapture={endStick}
      >
        <div
          ref={stickRef}
          className="pointer-events-none absolute left-0 top-0 flex items-center justify-center rounded-full border-2 opacity-0 transition-opacity duration-100"
          style={{
            width: RING * 2,
            height: RING * 2,
            borderColor: 'rgba(232, 121, 249, 0.35)',
          }}
          aria-hidden
        >
          <div
            ref={knobRef}
            className="rounded-full"
            style={{
              width: 44,
              height: 44,
              background: 'rgba(232, 121, 249, 0.55)',
            }}
          />
        </div>
      </div>

      <div
        className={`pointer-events-auto absolute inset-y-0 ${fireSide} w-1/2 touch-none`}
        onPointerDown={(e) => {
          if (fireIdRef.current !== null) return;
          fireIdRef.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          onFiring(true);
        }}
        onPointerUp={() => {
          fireIdRef.current = null;
          onFiring(false);
        }}
        onPointerCancel={() => {
          fireIdRef.current = null;
          onFiring(false);
        }}
        onLostPointerCapture={() => {
          fireIdRef.current = null;
          onFiring(false);
        }}
      >
        {/*
          The pad is the hint, not the hit target: the whole half fires. Drawing
          it small and touching it large is how the control stays discoverable
          without shrinking to the size of the thing that shows where it is.
        */}
        <div
          className="pointer-events-none absolute bottom-4 flex h-16 w-16 items-center justify-center rounded-full border-2"
          style={{
            borderColor: 'rgba(232, 121, 249, 0.3)',
            [leftHanded ? 'left' : 'right']: 16,
          }}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 18 18" focusable="false">
            <path d="M9 1 L15 16 L9 12 L3 16 Z" fill="rgba(240, 171, 252, 0.45)" />
          </svg>
        </div>

        <button
          type="button"
          aria-label="Hyperspace"
          className="pointer-events-auto absolute bottom-24 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-fuchsia-300/60 text-fuchsia-300"
          style={{ [leftHanded ? 'left' : 'right']: 18 }}
          onPointerDown={(e) => {
            // Stops the surrounding fire zone taking this as a shot.
            e.stopPropagation();
            e.preventDefault();
            onHyperspace();
          }}
        >
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );
}
