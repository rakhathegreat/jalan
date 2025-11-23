// ImageCarousel.tsx
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';

interface Props {
  images?: string[];                // opsional
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

/* Ikon gambar kecil (SVG) */
const PhotoIcon = () => (
  <svg
    className="w-14 h-14 text-neutral-400"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

const ImageCarousel = ({
  images = [],
  autoPlay = true,
  interval = 4000,
  className = '',
}: Props) => {
  const list = images.length ? images : ['__placeholder__']; // flag
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goNext = useCallback(() => {
    setIdx((i) => (i + 1) % list.length);
  }, [list.length]);

  const goPrev = useCallback(() => {
    setIdx((i) => (i - 1 + list.length) % list.length);
  }, [list.length]);

  useEffect(() => {
    if (!autoPlay || list.length <= 1) return;
    const t = setInterval(goNext, interval);
    return () => clearInterval(t);
  }, [autoPlay, interval, goNext, list.length]);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    if (dx > 0) goPrev();
    else goNext();
    touchStartX.current = null;
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl select-none ${className}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* track */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {list.map((src, i) =>
          src === "__placeholder__" ? (
            /* ---------- placeholder abu-abu + ikon ---------- */
            <div
              key={i}
              className="w-full shrink-0 aspect-video bg-neutral-200 flex items-center justify-center"
            >
              <PhotoIcon />
            </div>
          ) : (
            <img
              key={i}
              src={src}
              alt=""
              className="w-full shrink-0 object-cover"
              draggable={false}
            />
          )
        )}
      </div>
    </div>
  );
};

export default ImageCarousel;
