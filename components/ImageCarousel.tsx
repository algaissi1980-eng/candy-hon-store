'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { optimizeCardImage, optimizeFullImage } from '../lib/optimizeImage';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  size?: 'card' | 'full';
  onImageClick?: () => void;
  isUnavailable?: boolean;
}

export function getProductImages(product: any): string[] {
  if (product?.images && product.images.length > 0) return product.images;
  if (product?.image_url) return [product.image_url];
  return [];
}

export default function ImageCarousel({
  images,
  alt,
  className = '',
  size = 'card',
  onImageClick,
  isUnavailable = false,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const isDragging = useRef(false);

  const count = images.length;
  const isCard = size === 'card';

  const goTo = (index: number, dir: number) => {
    setDirection(dir);
    setCurrentIndex(index);
    setImageLoading(true);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex === 0 ? count - 1 : currentIndex - 1, -1);
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex === count - 1 ? 0 : currentIndex + 1, 1);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const diffX = Math.abs(e.clientX - pointerStartX.current);
    const diffY = Math.abs(e.clientY - pointerStartY.current);
    if (diffX > 5 || diffY > 5) isDragging.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const diffX = pointerStartX.current - e.clientX;
    const diffY = Math.abs(pointerStartY.current - e.clientY);
    if (Math.abs(diffX) > diffY && Math.abs(diffX) > 40 && count > 1) {
      diffX > 0
        ? goTo(currentIndex === count - 1 ? 0 : currentIndex + 1, 1)
        : goTo(currentIndex === 0 ? count - 1 : currentIndex - 1, -1);
    } else if (!isDragging.current && onImageClick) {
      onImageClick();
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center text-4xl bg-[var(--cream)] cursor-pointer ${className}`}
        onClick={onImageClick}
      >
        🍬
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden group/carousel select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'pan-y' }}
    >
      {/* ─── Loading spinner — only when no placeholder available ─── */}
      {imageLoading && isCard && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--cream)]">
          <div className="w-8 h-8 border-3 border-[var(--cream-dark)] border-t-[var(--pink)] rounded-full animate-spin" />
        </div>
      )}

      {/* ─── Full-view: show low-res instantly as placeholder while hi-res loads ─── */}
      {!isCard && imageLoading && (
        <div className="absolute inset-0 z-[5]">
          <Image
            src={optimizeCardImage(images[currentIndex])}
            alt={alt}
            fill
            className="object-contain bg-white scale-100 blur-[2px]"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {/* spinner overlay on top of blurry preview */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-white/40 border-t-[var(--pink)] rounded-full animate-spin" />
          </div>
        </div>
      )}

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <Image
            src={isCard ? optimizeCardImage(images[currentIndex]) : optimizeFullImage(images[currentIndex])}
            alt={`${alt} — ${currentIndex + 1}`}
            fill
            className={`object-contain bg-white transition-all duration-300 ${isUnavailable ? 'grayscale opacity-70' : ''}`}
            sizes={isCard ? '(max-width: 768px) 50vw, 300px' : '(max-width: 768px) 100vw, 50vw'}
            draggable={false}
            onLoad={() => setImageLoading(false)}
          />
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button
            onClick={goPrev}
            className={`absolute top-1/2 -translate-y-1/2 left-1.5 z-20 bg-black/50 hover:bg-black/75 text-white flex items-center justify-center rounded-full transition-all duration-200 ${isCard ? 'w-7 h-7 opacity-0 group-hover/carousel:opacity-100' : 'w-9 h-9 opacity-70 hover:opacity-100'}`}
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isCard ? 'w-3.5 h-3.5' : 'w-5 h-5'}>
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goNext}
            className={`absolute top-1/2 -translate-y-1/2 right-1.5 z-20 bg-black/50 hover:bg-black/75 text-white flex items-center justify-center rounded-full transition-all duration-200 ${isCard ? 'w-7 h-7 opacity-0 group-hover/carousel:opacity-100' : 'w-9 h-9 opacity-70 hover:opacity-100'}`}
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isCard ? 'w-3.5 h-3.5' : 'w-5 h-5'}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i, i > currentIndex ? 1 : -1); }}
                className={`rounded-full transition-all duration-200 ${isCard ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>

          {!isCard && (
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full z-20">
              {currentIndex + 1} / {count}
            </div>
          )}
        </>
      )}
    </div>
  );
}
