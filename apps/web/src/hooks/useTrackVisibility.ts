import { useEffect, useRef } from 'react';
import { useViewport } from '@/context/ViewportContext';

export function useTrackVisibility(id: string) {
  const { markVisible } = useViewport();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        markVisible(id, entry.isIntersecting);
      },
      {
        threshold: 0.1, // 10% visible
        rootMargin: '100px' // Start loading slightly before it enters
      }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
      markVisible(id, false); // Cleanup on unmount
    };
  }, [id, markVisible]);

  return ref;
}
