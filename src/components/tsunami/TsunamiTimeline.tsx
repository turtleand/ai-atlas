import { TSUNAMI_EVENTS, calculateDaysSinceStart } from '../../data/tsunami-data';

export function TsunamiTimeline() {
  const currentDay = calculateDaysSinceStart();
  
  return (
    <div className="tsunami-timeline">
      <h3 className="timeline-title">Key Events</h3>
      <div className="timeline-events">
        {TSUNAMI_EVENTS.map((event, index) => (
          <div
            key={index}
            className={`timeline-event ${event.day <= currentDay ? 'past' : ''}`}
          >
            <div className="event-day">Day {event.day}</div>
            <div className="event-title">{event.label}</div>
            <div className="event-description">{event.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
