import { Link } from 'react-router-dom';
import {
  LOOP_METRICS,
  LOOP_STAGES,
  LOOP_STAGES_BY_ID,
} from '../../data/loop-compass-data';
import { LoopMetricsGrid } from './LoopMetricsGrid';
import { LoopStrategyCycle } from './LoopStrategyCycle';
import '../../styles/loop-compass.css';

export function LoopCompassPage() {
  return (
    <main className="loop-compass-scroll">
      <div className="loop-compass-page">
        <header className="loop-compass-header">
          <nav aria-label="Loop navigation">
            <Link to="/" className="loop-back-link">Back to Atlas</Link>
          </nav>

          <p className="loop-overline">Turtleand operating loop</p>
          <h1>The Turtleand Loop</h1>
          <p className="loop-subtitle">
            In this era, the winning strategy is the loop: Learn -&gt; Apply -&gt; Position -&gt; Adapt.
          </p>
          <p className="loop-subtext">The best thing to do is keep the loop moving.</p>
        </header>

        <section className="loop-compass-layout" aria-label="Turtleand loop strategy and metric checks">
          <LoopStrategyCycle stages={LOOP_STAGES} />

          <section className="loop-content">
            <LoopMetricsGrid
              metrics={LOOP_METRICS}
              stagesById={LOOP_STAGES_BY_ID}
            />
          </section>
        </section>
      </div>
    </main>
  );
}
