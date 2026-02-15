import { useState, useEffect, useRef } from 'react';
import './LightningHeadlines.css';

const HEADLINES = [
  { text: 'AI is replacing entire industries', color: '#ffffff' },
  { text: 'Traditional jobs are disappearing', color: '#ffffff' },
  { text: 'The wave doesn\'t wait', color: '#ffffff' },
  { text: 'Millions of roles. Automated.', color: '#ffffff' },
  { text: 'Learn to ride it.', color: '#D4A03A', link: 'https://blog.turtleand.com/posts/built-to-adapt-ai/' },
];

const FLASH_DURATION = 1800;
const FADE_DURATION = 400;
const INTERVAL_MIN = 3000;
const INTERVAL_MAX = 6000;

export function LightningHeadlines() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const nextIndexRef = useRef(0);

  useEffect(() => {
    let scheduleTimeout: ReturnType<typeof setTimeout>;
    let fadeTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    const triggerFlash = () => {
      const idx = nextIndexRef.current;
      nextIndexRef.current = (idx + 1) % HEADLINES.length;

      setActiveIndex(idx);
      setFading(false);

      fadeTimeout = setTimeout(() => setFading(true), FLASH_DURATION - FADE_DURATION);
      hideTimeout = setTimeout(() => setActiveIndex(null), FLASH_DURATION);
    };

    const schedule = () => {
      const delay = INTERVAL_MIN + Math.random() * (INTERVAL_MAX - INTERVAL_MIN);
      scheduleTimeout = setTimeout(() => {
        triggerFlash();
        schedule();
      }, delay);
    };

    // First flash after a short delay
    scheduleTimeout = setTimeout(() => {
      triggerFlash();
      schedule();
    }, 1500);

    return () => {
      clearTimeout(scheduleTimeout);
      clearTimeout(fadeTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

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
