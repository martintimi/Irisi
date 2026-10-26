import { useEffect } from 'react';

// Counter to support nested / stacked modals properly
let lockCount = 0;
let originalBodyStyles: {
  overflow: string;
  position: string;
  top: string;
  width: string;
  paddingRight: string;
  htmlOverflow: string;
} | null = null;
let savedScrollY = 0;

/**
 * Robust cross-browser scroll lock hook (iOS Safari, Android Chrome, Desktop)
 * Uses position: fixed; top: -${scrollY}px technique to physically prevent iOS Safari
 * background touch penetration, while preserving exact scroll position on close.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      originalBodyStyles = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        paddingRight: document.body.style.paddingRight,
        htmlOverflow: document.documentElement.style.overflow,
      };

      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0 && originalBodyStyles) {
        document.body.style.position = originalBodyStyles.position;
        document.body.style.top = originalBodyStyles.top;
        document.body.style.width = originalBodyStyles.width;
        document.body.style.overflow = originalBodyStyles.overflow;
        document.documentElement.style.overflow = originalBodyStyles.htmlOverflow;
        document.body.style.paddingRight = originalBodyStyles.paddingRight;
        window.scrollTo(0, savedScrollY);
        originalBodyStyles = null;
      }
    };
  }, [isLocked]);
}
