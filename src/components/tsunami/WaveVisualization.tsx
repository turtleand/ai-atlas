import { useMemo } from 'react';
import { calculateWavePercent, calculateDaysSinceStart, TSUNAMI_EVENTS } from '../../data/tsunami-data';

interface WaveVisualizationProps {
  score: number;
}

export function WaveVisualization({ score }: WaveVisualizationProps) {
  const wavePercent = calculateWavePercent();
  const currentDay = calculateDaysSinceStart();
  
  const viewBox = { width: 800, height: 600 };
  
  // Calculate positions
  const waterlineY = useMemo(() => {
    return viewBox.height * (1 - wavePercent / 100);
  }, [wavePercent, viewBox.height]);
  
  const boatY = useMemo(() => {
    return viewBox.height * (1 - score / 100);
  }, [score, viewBox.height]);
  
  // Determine boat status
  const boatStatus = useMemo(() => {
    if (score > wavePercent + 10) return 'safe';
    if (score > wavePercent) return 'at-risk';
    return 'danger';
  }, [score, wavePercent]);
  
  // Generate wave path with sine curve
  const wavePath = useMemo(() => {
    const amplitude = 20;
    const frequency = 0.02;
    let path = `M 0 ${waterlineY}`;
    
    for (let x = 0; x <= viewBox.width; x += 10) {
      const y = waterlineY + Math.sin(x * frequency) * amplitude;
      path += ` L ${x} ${y}`;
    }
    
    path += ` L ${viewBox.width} ${viewBox.height} L 0 ${viewBox.height} Z`;
    return path;
  }, [waterlineY, viewBox.width, viewBox.height]);
  
  // Foam path (slightly above wave)
  const foamPath = useMemo(() => {
    const amplitude = 15;
    const frequency = 0.025;
    let path = `M 0 ${waterlineY - 5}`;
    
    for (let x = 0; x <= viewBox.width; x += 8) {
      const y = waterlineY - 5 + Math.sin(x * frequency + Math.PI) * amplitude;
      path += ` L ${x} ${y}`;
    }
    
    path += ` L ${viewBox.width} ${waterlineY - 5} Z`;
    return path;
  }, [waterlineY, viewBox.width]);
  
  // Event markers (only for past events)
  const eventMarkers = useMemo(() => {
    return TSUNAMI_EVENTS.filter(e => e.day <= currentDay).map(event => {
      const x = (event.day / Math.max(currentDay, 1)) * (viewBox.width - 100) + 50;
      const eventWavePercent = Math.min(95, 15 + event.day * 0.15);
      const y = viewBox.height * (1 - eventWavePercent / 100);
      return { ...event, x, y };
    });
  }, [currentDay, viewBox.width, viewBox.height]);
  
  return (
    <div className="wave-container">
      <svg className="wave-svg" viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}>
        {/* Gradients */}
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1628" />
            <stop offset="100%" stopColor="#0a1628" />
          </linearGradient>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#2a5a8c" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0a1628" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        
        {/* Ocean background */}
        <rect className="wave-ocean" width={viewBox.width} height={viewBox.height} />
        
        {/* Wave */}
        <path className="wave-path" d={wavePath} />
        
        {/* Foam */}
        <path className="wave-foam" d={foamPath} />
        
        {/* Waterline */}
        <line
          className="waterline"
          x1="0"
          y1={waterlineY}
          x2={viewBox.width}
          y2={waterlineY}
        />
        
        {/* Event markers */}
        {eventMarkers.map((event, i) => (
          <g key={i} className="event-marker">
            <circle
              className="event-dot"
              cx={event.x}
              cy={event.y}
              r="6"
            />
            <text
              className="event-label"
              x={event.x}
              y={event.y - 12}
              textAnchor="middle"
            >
              {event.label}
            </text>
          </g>
        ))}
        
        {/* Boat */}
        <g className={`boat ${boatStatus}`} transform={`translate(${viewBox.width / 2}, ${boatY})`}>
          {/* Simple boat shape */}
          <path
            d="M -20 0 L -25 10 L 25 10 L 20 0 L 15 -10 L -15 -10 Z"
            fill="#8B4513"
            stroke="#e0d8c8"
            strokeWidth="2"
          />
          {/* Mast */}
          <line x1="0" y1="-10" x2="0" y2="-35" stroke="#e0d8c8" strokeWidth="2" />
          {/* Sail */}
          <path d="M 0 -35 L 15 -25 L 0 -15 Z" fill="rgba(224, 216, 200, 0.8)" />
        </g>
        
        {/* Labels */}
        <text className="wave-label" x="20" y="30" fontWeight="bold">
          AI Tsunami
        </text>
        <text className="day-label" x="20" y="55">
          Day {currentDay} • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </text>
        <text className="day-label" x="20" y="75">
          Waterline: {wavePercent.toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}
