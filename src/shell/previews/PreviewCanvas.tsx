import { useEffect, useRef } from 'react';
import { invalidateSize, registerPreview, type PreviewSpec } from './driver';

interface Props {
  gameId: string;
  spec: PreviewSpec;
}

/**
 * One preview canvas, wired to the shared driver.
 *
 * `aria-hidden` because the art carries nothing the title and blurb do not, and
 * an unlabelled canvas inside the tile's button would otherwise end up in that
 * button's accessible name.
 */
export function PreviewCanvas({ gameId, spec }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const unregister = registerPreview(canvas, spec);

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => invalidateSize(canvas));
    observer?.observe(canvas);

    const onResize = () => invalidateSize(canvas);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
      unregister();
    };
  }, [spec]);

  return (
    <canvas
      ref={ref}
      data-preview={gameId}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
