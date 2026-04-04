"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageResizerProps {
  activeImage: HTMLImageElement | null;
  onResize: (width: string) => void;
  onSetMain?: () => void;
}

export default function ImageResizer({ activeImage, onResize }: ImageResizerProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentHandle, setCurrentHandle] = useState<'left' | 'right' | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Update position based on active image
  useEffect(() => {
    if (!activeImage) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      setRect(activeImage.getBoundingClientRect());
    };

    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    
    // Also update when the observer detect changes (layout shifts)
    const observer = new ResizeObserver(updateRect);
    observer.observe(activeImage);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
      observer.disconnect();
    };
  }, [activeImage]);

  if (!activeImage || !rect) return null;

  const handlePointerDown = (e: React.PointerEvent, dir: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setCurrentHandle(dir);
    startXRef.current = e.clientX;
    startWidthRef.current = activeImage.offsetWidth;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !currentHandle) return;

    const dx = e.clientX - startXRef.current;
    let newWidth = startWidthRef.current;

    // Symmetric resize like the user's example
    if (currentHandle === 'right') {
      newWidth = startWidthRef.current + (dx * 2);
    } else {
      newWidth = startWidthRef.current - (dx * 2);
    }

    // Limits
    const minWidth = 100;
    const maxWidth = window.innerWidth * 0.9;
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

    // Apply to image
    activeImage.style.width = `${newWidth}px`;
    onResize(`${newWidth}px`);
    
    // Update our overlay rect
    setRect(activeImage.getBoundingClientRect());
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setCurrentHandle(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    if (e.target instanceof HTMLElement) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div 
      className={cn(
        "fixed z-[60] pointer-events-none transition-opacity duration-200",
        isDragging ? "opacity-100" : "opacity-100"
      )}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }}
    >
      {/* Left Handle */}
      <div 
        className="pointer-events-auto absolute top-0 bottom-0 -left-4 w-8 flex items-center justify-center cursor-ew-resize group"
        onPointerDown={(e) => handlePointerDown(e, 'left')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="w-6 h-10 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-full flex items-center justify-center shadow-2xl border border-white/10 transition-all hover:scale-110 active:scale-90 group-hover:border-primary/50 group-hover:shadow-primary/20">
          <ChevronLeft size={16} />
        </div>
      </div>

      {/* Right Handle */}
      <div 
        className="pointer-events-auto absolute top-0 bottom-0 -right-4 w-8 flex items-center justify-center cursor-ew-resize group"
        onPointerDown={(e) => handlePointerDown(e, 'right')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="w-6 h-10 bg-[#1a1a1a] hover:bg-[#222] text-white rounded-full flex items-center justify-center shadow-2xl border border-white/10 transition-all hover:scale-110 active:scale-90 group-hover:border-primary/50 group-hover:shadow-primary/20">
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Outline highlight */}
      <div className="absolute inset-0 border-2 border-primary/30 rounded-2xl pointer-events-none ring-4 ring-primary/5 animate-pulse" />
    </div>
  );
}
