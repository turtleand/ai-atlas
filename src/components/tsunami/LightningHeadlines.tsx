import { useState, useEffect, useCallback } from 'react';
import './LightningHeadlines.css';

const HEADLINES = [
  { text: 'AI is replacing entire industries', color: '#ffffff' },
  { text: 'Traditional jobs are disappearing', color: '#ffffff' },
  { text: 'The wave doesn\'t wait', color: '#ffffff' },
  { text: 'Millions of roles. Automated.', color: '#ffffff' },
  { text: 'Learn to ride it.', color: '#D4A03A', link: 'https://blog.turtleand.com/posts/built-to-adapt-ai/' },
];

const FLASH_DURATION = 1800; // ms visible
const FADE_DURATION = 400; // ms fade out
const INTERVAL_MIN = 3000; // min ms between flashes
const INTERVAL_MAX = 6000; // max ms between flashes

export function LightningHeadlines() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  const triggerFlash = useCallback(() => {
    setActiveIndex((prev) => {
      const next = prev === null ? 0 : (prev + 1) % HEADLINES.length;
      return next;
    });
    setFading(false);

    // Start fade out
    setTimeout(() => setFading(true), FLASH_DURATION - FADE_DURATION);
    // Hide completely
    setTimeout(() => setActiveIndex(null), FLASH_DURATION);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = INTERVAL_MIN + Math.random() * (INTERVAL_MAX - INTERVAL_MIN);
      timeout = setTimeout(() => {
        triggerFlash();
        schedule();
      }, delay);
    };
    // First flash after a short delay
    timeout = setTimeout(() => {
      triggerFlash();
      schedule();
    }, 1500);
    return () => clearTimeout(timeout);
  }, [triggerFlash]);

  if (activeIndex === null) return null;

  const headline = HEADLINES[activeIndex];
  const content = headline.link ? (
    <a
      href={headline.link}
      target="_blank"
      rel="noopener noreferrer"
      className="lightning-headline-link"
      style={{ color: headline.color }}
    >
      {headline.text}
    </a>
  ) : (
    headline.text
  );

  return (
    <div
      className={`lightning-headline ${fading ? 'lightning-headline--fading' : 'lightning-headline--visible'}`}
      style={{ color: headline.color }}
    >
      {content}
    </div>
  );
}
