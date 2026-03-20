"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  pullDownThreshold?: number;
}

export function PullToRefresh({
  children,
  onRefresh,
  pullDownThreshold = 80,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    // Only allow pull to refresh if at the top of the page
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY === 0 || isRefreshing) return;

    const currentY = e.touches[0].pageY;
    const distance = currentY - startY;

    if (distance > 0) {
      // Add resistance to the pull
      const resistance = 0.4;
      const pull = Math.min(distance * resistance, pullDownThreshold + 20);
      setPullDistance(pull);
      
      // Prevent default scrolling when pulling
      if (distance > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  }, [startY, isRefreshing, pullDownThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= pullDownThreshold) {
      setIsRefreshing(true);
      setPullDistance(pullDownThreshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        // Smoothly close after a short delay to show completion
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 300);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  }, [pullDistance, pullDownThreshold, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      <div 
        className="absolute w-full flex justify-center items-center pointer-events-none transition-all duration-200"
        style={{ 
          height: `${pullDistance}px`,
          top: 0,
          opacity: Math.min(pullDistance / pullDownThreshold, 1),
          overflow: "hidden"
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <Loader2 
            className={`w-6 h-6 text-primary ${isRefreshing ? "animate-spin" : ""}`}
            style={{ 
              transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : "none" 
            }}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
            {isRefreshing ? "Actualizando..." : pullDistance >= pullDownThreshold ? "Suelta para refrescar" : "Tira para refrescar"}
          </span>
        </div>
      </div>
      
      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
