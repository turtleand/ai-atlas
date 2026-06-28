import type { LoopStage } from '../../data/loop-compass-data';

interface LoopProgressTargetProps {
  stages: LoopStage[];
}

const backlogSignals = [
  'tool map',
  'agent notes',
  'AI shift',
  'chain lens',
  'article draft',
  'prototype',
  'reader signal',
  'market pattern',
  'workflow',
];

export function LoopProgressTarget({ stages }: LoopProgressTargetProps) {
  return (
    <section className="loop-target" aria-labelledby="loop-target-title">
      <div className="loop-target-header">
        <p className="loop-target-kicker">Daily orientation</p>
        <h2 id="loop-target-title">Infinite backlog to loop progress</h2>
      </div>

      <div className="loop-target-flow" aria-label="Infinite backlog to daily focus to loop advanced">
        <div className="loop-target-zone loop-backlog-zone">
          <span className="loop-zone-label">Infinite backlog</span>
          <div className="loop-signal-field" aria-hidden="true">
            {backlogSignals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </div>

        <div className="loop-target-line" aria-hidden="true">
          <span />
        </div>

        <div className="loop-target-zone loop-focus-zone">
          <span className="loop-zone-label">Daily focus</span>
          <strong>Choose the slice that moves Turtleand forward.</strong>
          <p>Small enough to do today. Meaningful enough to compound.</p>
        </div>

        <div className="loop-target-line loop-target-line--strong" aria-hidden="true">
          <span />
        </div>

        <div className="loop-target-zone loop-advanced-zone">
          <span className="loop-zone-label">Loop advanced</span>
          <div className="loop-stage-cycle" aria-label="Learn, Apply, Position, Adapt">
            {stages.map((stage, index) => (
              <article key={stage.id} className={`loop-stage-cell loop-stage-cell--${stage.id}`}>
                <span className="loop-stage-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{stage.title}</h3>
                <p>{stage.purpose}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <aside className="loop-decision-prompt" aria-label="Today loop checks">
        <p>What slice moves the loop today?</p>
        <ul>
          {stages.map((stage) => (
            <li key={stage.id}>{stage.question}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
