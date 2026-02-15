import { TSUNAMI_EVENTS, calculateDaysSinceStart } from '../../data/tsunami-data';

export const TsunamiTimeline: React.FC = () => {
  const currentDay = calculateDaysSinceStart();

  return (
    <div className="tsunami-timeline">
      <h2 className="timeline-title">The Wave So Far</h2>
      
      <div className="timeline-list">
        {TSUNAMI_EVENTS.map((event) => {
          const isPast = event.day <= currentDay;
          const isCurrent = event.day === currentDay;
          
          return (
            <div 
              key={event.day} 
              className={`timeline-event ${isPast ? 'past' : 'future'} ${isCurrent ? 'current' : ''}`}
            >
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-day">Day {event.day}</div>
                <div className="timeline-label">{event.label}</div>
                <div className="timeline-description">{event.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
