import type { LoopStage } from '../../data/loop-compass-data';

interface LoopStrategyCycleProps {
  stages: LoopStage[];
}

export function LoopStrategyCycle({ stages }: LoopStrategyCycleProps) {
  return (
    <section className="loop-strategy" aria-labelledby="loop-strategy-title">
      <div className="loop-strategy-copy">
        <p className="loop-target-kicker">Winning strategy</p>
        <h2 id="loop-strategy-title">Learn. Apply. Position. Adapt.</h2>
        <p>
          In this era, the durable advantage is not one perfect task. It is keeping the loop moving until
          knowledge, output, identity, and direction start compounding.
        </p>
      </div>

      <div className="loop-cycle-shell" aria-label="Learn, Apply, Position, Adapt operating loop">
        <div className="loop-cycle-core">
          <span>Keep the loop moving</span>
        </div>

        <div className="loop-cycle-path" aria-hidden="true" />

        {stages.map((stage, index) => (
          <article key={stage.id} className={`loop-stage-node loop-stage-node--${stage.id}`}>
            <span className="loop-stage-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{stage.title}</h3>
            <p>{stage.purpose}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
