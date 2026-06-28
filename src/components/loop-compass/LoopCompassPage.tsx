import { Link } from 'react-router-dom';
import {
  LOOP_METRICS,
  LOOP_STAGES,
  LOOP_STAGES_BY_ID,
} from '../../data/loop-compass-data';
import { LoopMetricsGrid } from './LoopMetricsGrid';
import { LoopProgressTarget } from './LoopProgressTarget';
import '../../styles/loop-compass.css';

export function LoopCompassPage() {
  return (
    <main className="loop-compass-scroll">
      <div className="loop-compass-page">
        <header className="loop-compass-header">
          <nav aria-label="Loop navigation">
            <Link to="/" className="loop-back-link">Back to Atlas</Link>
          </nav>

          <p className="loop-overline">Turtleand operating compass</p>
          <h1>Advance the Loop</h1>
          <p className="loop-subtitle">
            Do not measure the day by whether the backlog got smaller. Measure whether Turtleand's loop moved.
          </p>
          <p className="loop-subtext">The compass is judgment. The target is loop progress.</p>
        </header>

        <section className="loop-compass-layout" aria-label="Productivity loop decision surface">
          <LoopProgressTarget stages={LOOP_STAGES} />

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
