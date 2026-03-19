import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Returns an inline style object per child index that handles
 * staggered fade-in on mount (or when `key` changes).
 *
 *   const stagger = useStagger(itemCount, { delay: 40, baseDelay: 80 });
 *   items.map((item, i) => <div style={stagger(i)} … />)
 */
export function useStagger(count, {
  delay = 40,
  baseDelay = 80,
  duration = 350,
  distance = 8,
  key,
} = {}) {
  const [visible, setVisible] = useState(false);
  const prevKey = useRef(key);

  useEffect(() => {
    if (key !== prevKey.current) {
      setVisible(false);
      prevKey.current = key;
    }
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [key, count]);

  const getStyle = useCallback((index) => {
    if (visible) {
      return {
        opacity: 1,
        transform: 'translateY(0)',
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${baseDelay + index * delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${baseDelay + index * delay}ms`,
      };
    }
    return {
      opacity: 0,
      transform: `translateY(${distance}px)`,
      transition: 'none',
    };
  }, [visible, delay, baseDelay, duration, distance]);

  return getStyle;
}
