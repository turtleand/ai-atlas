import type { LoopMetric, LoopStageId, LoopStage } from '../../data/loop-compass-data';

interface LoopMetricsGridProps {
  metrics: LoopMetric[];
  stagesById: Record<LoopStageId, LoopStage>;
}

export function LoopMetricsGrid({ metrics, stagesById }: LoopMetricsGridProps) {
  return (
    <section className="loop-metrics">
      <h2 id="loop-metrics-title">Six metric checks</h2>
      <p>The loop is the strategy. The metrics show whether it is working.</p>

      <div className="loop-metric-grid" role="list" aria-labelledby="loop-metrics-title">
        {metrics.map((metric) => {
          const stage = stagesById[metric.stage];

          return (
            <details
              key={metric.id}
              className="loop-metric-card"
            >
              <summary>
                <span className="loop-metric-title">{metric.title}</span>
                <span className="loop-metric-stage">{stage.title}</span>
              </summary>
              <p className="loop-metric-question">{metric.question}</p>
              <p className="loop-metric-description">{metric.description}</p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
