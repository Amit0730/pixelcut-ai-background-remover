"use client";

import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  originalImage: string;
  processedImage: string;
  backgroundColor: string; // 'transparent', '#fff', '#000', custom
  backgroundImage?: string | null;
}

export function BeforeAfterSlider({ originalImage, processedImage, backgroundColor, backgroundImage }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const bgStyle: React.CSSProperties = backgroundColor === 'transparent' 
    ? { backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/ENFqwvAwRqoJY7B6gGGMJmEAAAAA//81H81JAAAAAFJOUwB6g8X2AAAAHUlEQVQYV2NkYGAQYcAP3uCTZhw1gGGYhIFB8gAAX4IBy0/89y8AAAAASUVORK5CYII=")', backgroundRepeat: 'repeat' }
    : { backgroundColor };

  if (backgroundImage) {
    bgStyle.backgroundImage = `url(${backgroundImage})`;
    bgStyle.backgroundSize = 'cover';
    bgStyle.backgroundPosition = 'center';
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-3xl aspect-[4/3] rounded-2xl overflow-hidden cursor-ew-resize select-none shadow-2xl bg-zinc-900 border border-white/10"
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Processed Image (Background layer) */}
      <div className="absolute inset-0 w-full h-full" style={bgStyle}>
        <img 
          src={processedImage} 
          alt="Processed" 
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Original Image (Foreground layer) */}
      <div 
        className="absolute inset-0 w-full h-full bg-zinc-900"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={originalImage} 
          alt="Original" 
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-none">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-zinc-400 rounded-full" />
            <div className="w-1 h-3 bg-zinc-400 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm shadow-sm pointer-events-none transition-opacity duration-300" style={{ opacity: sliderPosition < 20 ? 0 : 1 }}>
        Original
      </div>
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm shadow-sm pointer-events-none transition-opacity duration-300" style={{ opacity: sliderPosition > 80 ? 0 : 1 }}>
        Processed
      </div>
    </div>
  );
}
