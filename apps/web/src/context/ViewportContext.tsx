"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ViewportContextType {
  visibleIds: Set<string>;
  markVisible: (id: string, isVisible: boolean) => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const markVisible = useCallback((id: string, isVisible: boolean) => {
    // We use a small debounce/delay to prevent rapid state changes during scrolling
    if (timeoutRef.current[id]) {
      clearTimeout(timeoutRef.current[id]);
    }

    timeoutRef.current[id] = setTimeout(() => {
      setVisibleIds(prev => {
        const next = new Set(prev);
        if (isVisible) {
          next.add(id);
        } else {
          next.delete(id);
        }
        
        // Only update state if the set actually changed
        if (next.size === prev.size && Array.from(next).every(val => prev.has(val))) {
          return prev;
        }
        return next;
      });
      delete timeoutRef.current[id];
    }, 100);
  }, []);

  return (
    <ViewportContext.Provider value={{ visibleIds, markVisible }}>
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
}
