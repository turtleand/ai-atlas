// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StormScenePanel } from './StormScenePanel';

interface RenderProps {
  tier: number;
  ready: boolean;
  onReady: () => void;
  onFailure: () => void;
}

const renderer = vi.fn<(props: RenderProps) => void>();
const loadScene = vi.fn(() => ({
  StormScene: (props: RenderProps) => {
    renderer(props);
    return <div data-testid="scene">{props.ready && 'Live headlines'}</div>;
  },
}));
const tracker = { score: 80, tier: 3, wavePercent: 65, daysSinceStart: 330 };
const latestRender = () => renderer.mock.lastCall![0];

beforeEach(() => {
  vi.doMock('./StormScene', loadScene);
});

afterEach(() => {
  cleanup();
  vi.doUnmock('./StormScene');
  renderer.mockClear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('storm scene startup', () => {
  it('offers to reload the tracker when the renderer download fails', async () => {
    loadScene.mockImplementationOnce(() => { throw new Error('Renderer module unavailable'); });
    render(<StormScenePanel {...tracker} />);
    expect(await screen.findByText('The 3D scene is unavailable.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload tracker' })).toBeTruthy();
    expect(renderer).not.toHaveBeenCalled();
  });

  it('keeps feedback visible until a ship frame arrives, even if the selected tier changes while loading', async () => {
    const { rerender } = render(<StormScenePanel {...tracker} />);
    expect(screen.getByText('Preparing your ship…')).toBeTruthy();

    await screen.findByTestId('scene');
    rerender(<StormScenePanel {...tracker} score={95} tier={4} />);
    expect(latestRender()).toMatchObject({ tier: 4, ready: false });
    expect(screen.getByText('Preparing your ship…')).toBeTruthy();
    expect(screen.queryByText('Live headlines')).toBeNull();

    act(latestRender().onReady);
    expect(screen.queryByText('Preparing your ship…')).toBeNull();
    expect(screen.getByText('Live headlines')).toBeTruthy();
  });

  it('recovers from a lost scene and ignores readiness or failure from the discarded attempt', async () => {
    render(<StormScenePanel {...tracker} />);
    await screen.findByTestId('scene');
    const firstAttempt = latestRender();
    act(firstAttempt.onReady);
    act(firstAttempt.onFailure);
    act(firstAttempt.onReady);
    expect(screen.getByText('The 3D scene is unavailable.')).toBeTruthy();
    expect(screen.queryByTestId('scene')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Retry scene' }));
    await screen.findByTestId('scene');
    const secondAttempt = latestRender();
    act(firstAttempt.onReady);
    expect(screen.getByText('Preparing your ship…')).toBeTruthy();
    act(secondAttempt.onReady);
    act(firstAttempt.onFailure);
    expect(screen.getByText('Live headlines')).toBeTruthy();
  });

  it('offers retry for a slow visible scene and still accepts a late first frame', async () => {
    let visibility: DocumentVisibilityState = 'hidden';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => visibility === 'hidden');
    const { container } = render(<StormScenePanel {...tracker} />);
    await screen.findByTestId('scene');
    const panel = container.querySelector<HTMLElement>('.tsunami-scene-panel')!;
    vi.useFakeTimers();
    const setVisibility = (state: DocumentVisibilityState) => {
      visibility = state;
      fireEvent(document, new Event('visibilitychange'));
    };
    setVisibility('visible');
    setVisibility('hidden');
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(panel.dataset.sceneState).toBe('loading');
    setVisibility('visible');
    act(() => { vi.advanceTimersByTime(12_000); });
    expect(panel.dataset.sceneState).toBe('slow');
    expect(screen.getByRole('button', { name: 'Retry scene' })).toBeTruthy();
    act(latestRender().onReady);
    expect(panel.dataset.sceneState).toBe('ready');
    expect(screen.queryByRole('button', { name: 'Retry scene' })).toBeNull();
  });
});
