import { Component, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { StormScene, StormSceneProps } from './StormScene';
import { usePageVisible } from './scene-utils';

type PanelProps = Omit<StormSceneProps, 'ready' | 'onReady' | 'onFailure'>;
type SceneState = 'loading' | 'slow' | 'ready' | 'failed' | 'download-error';

class SceneErrorBoundary extends Component<{ onFailure: () => void; children: ReactNode }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function SceneAttempt({ onRetry, ...props }: PanelProps & { onRetry: () => void }) {
  const [Renderer, setRenderer] = useState<typeof StormScene | null>(null);
  const [state, setState] = useState<SceneState>('loading');
  const visible = usePageVisible();

  useEffect(() => {
    let active = true;
    import('./StormScene').then(
      ({ StormScene }) => { if (active) setRenderer(() => StormScene); },
      () => { if (active) setState('download-error'); },
    );
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!visible || state !== 'loading') return;
    // A slow connection or GPU can still finish. Keep this attempt alive.
    const timeout = window.setTimeout(() => {
      setState(current => current === 'loading' ? 'slow' : current);
    }, 12_000);
    return () => window.clearTimeout(timeout);
  }, [visible, state]);

  const onReady = useCallback(() => {
    setState(current => current === 'loading' || current === 'slow' ? 'ready' : current);
  }, []);
  const onFailure = useCallback(() => setState('failed'), []);
  const failed = state === 'failed' || state === 'download-error';
  return (
    <div className="tsunami-scene-panel" data-scene-state={state}>
      {Renderer && !failed && (
        <SceneErrorBoundary onFailure={onFailure}>
          <Renderer {...props} ready={state === 'ready'} onReady={onReady} onFailure={onFailure} />
        </SceneErrorBoundary>
      )}
      {state !== 'ready' && (
        <div className="storm-scene-status">
          <div role="status">
            <p className="storm-status-title">{
              failed ? 'The 3D scene is unavailable.'
                : state === 'slow' ? 'Your ship is taking a little longer to load.'
                  : 'Preparing your ship…'
            }</p>
            <p>You can still explore ship tiers and adjust your score.</p>
          </div>
          {(failed || state === 'slow') && (
            Renderer
              ? <button type="button" onClick={onRetry}>Retry scene</button>
              : <button type="button" onClick={() => window.location.reload()}>Reload tracker</button>
          )}
        </div>
      )}
    </div>
  );
}

export function StormScenePanel(props: PanelProps) {
  const [attempt, setAttempt] = useState(0);
  return <SceneAttempt key={attempt} {...props} onRetry={() => setAttempt(value => value + 1)} />;
}
