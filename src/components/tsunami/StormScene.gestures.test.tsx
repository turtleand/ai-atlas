// @vitest-environment jsdom

import { Children, isValidElement } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFrame } from '@react-three/fiber';
import type { RootState } from '@react-three/fiber';
import { OrbitControls as OrbitMarker } from '@react-three/drei';
import { OrbitControls } from 'three-stdlib';
import { PerspectiveCamera, TOUCH } from 'three';
import { StormScene } from './StormScene';

const canvasState = vi.hoisted(() => ({
  children: null as unknown,
  frameloop: undefined as 'always' | 'demand' | 'never' | undefined,
}));
const scenePreferences = vi.hoisted(() => ({ reducedMotion: false }));
const originalTouchPoints = Object.getOwnPropertyDescriptor(navigator, 'maxTouchPoints');
const originalVisibility = Object.getOwnPropertyDescriptor(document, 'visibilityState');
let pageVisibility: DocumentVisibilityState = 'visible';

// Keep the real scene's DOM policy and declared control props, while omitting
// GPU rendering. Gesture math below runs the installed, real OrbitControls.
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, className, style, frameloop }: {
    children: ReactNode; className: string; style: CSSProperties;
    frameloop?: 'always' | 'demand' | 'never';
  }) => {
    canvasState.children = children;
    canvasState.frameloop = frameloop;
    return <div className={className} style={style}><div><canvas /></div></div>;
  },
  useFrame: vi.fn(),
  useThree: vi.fn(),
}));
vi.mock('@react-three/drei', () => ({ OrbitControls: () => null }));
vi.mock('./LightningHeadlines', () => ({ LightningHeadlines: () => <a href="https://example.com">Storm headline</a> }));
vi.mock('./scene-utils', async (importOriginal) => ({
  ...await importOriginal<typeof import('./scene-utils')>(),
  getSceneCaptureOptions: () => ({}),
  useReducedMotion: () => scenePreferences.reducedMotion,
}));

beforeEach(() => {
  scenePreferences.reducedMotion = false;
  pageVisibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => pageVisibility });
  vi.mocked(useFrame).mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  if (originalTouchPoints) Object.defineProperty(navigator, 'maxTouchPoints', originalTouchPoints);
  else Reflect.deleteProperty(navigator, 'maxTouchPoints');
  if (originalVisibility) Object.defineProperty(document, 'visibilityState', originalVisibility);
  else Reflect.deleteProperty(document, 'visibilityState');
});

// These tests exercise the real visibility hook and SceneTime component at the
// Canvas boundary. They do not claim native background-tab or GPU scheduling proof.
describe('scene visibility and resume contract', () => {
  it('responds to reduced-motion changes without disabling manual camera controls', () => {
    const { rerender } = renderTouchScene();
    const orbitProps = () => {
      const marker = Children.toArray(canvasState.children as ReactNode)
        .find((child) => isValidElement(child) && child.type === OrbitMarker);
      expect(isValidElement(marker)).toBe(true);
      return (marker as ReactElement<{
        autoRotate: boolean; enableRotate: boolean; enableZoom: boolean; enablePan: boolean;
      }>).props;
    };
    expect(orbitProps().autoRotate).toBe(true);

    scenePreferences.reducedMotion = true;
    rerender(<StormScene score={50} tier={2} wavePercent={80} daysSinceStart={120} />);
    expect(orbitProps()).toMatchObject({
      autoRotate: false, enableRotate: true, enableZoom: true, enablePan: false,
    });

    scenePreferences.reducedMotion = false;
    rerender(<StormScene score={50} tier={2} wavePercent={80} daysSinceStart={120} />);
    expect(orbitProps().autoRotate).toBe(true);
  });

  it('stops declared rendering and auto-rotation while hidden, resumes both, and removes its listener', () => {
    const addListener = vi.spyOn(document, 'addEventListener');
    const removeListener = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderTouchScene();
    const orbitProps = () => {
      const marker = Children.toArray(canvasState.children as ReactNode)
        .find((child) => isValidElement(child) && child.type === OrbitMarker);
      expect(isValidElement(marker)).toBe(true);
      return (marker as ReactElement<{ autoRotate: boolean }>).props;
    };
    const visibilityListeners = addListener.mock.calls.filter(([type]) => type === 'visibilitychange');
    expect(visibilityListeners).toHaveLength(1);
    expect(canvasState.frameloop).toBe('always');
    expect(orbitProps().autoRotate).toBe(true);

    pageVisibility = 'hidden';
    fireEvent(document, new Event('visibilitychange'));
    expect(canvasState.frameloop).toBe('never');
    expect(orbitProps().autoRotate).toBe(false);

    pageVisibility = 'visible';
    fireEvent(document, new Event('visibilitychange'));
    expect(canvasState.frameloop).toBe('always');
    expect(orbitProps().autoRotate).toBe(true);

    unmount();
    expect(removeListener).toHaveBeenCalledWith('visibilitychange', visibilityListeners[0][1]);
  });

  it('uses the real scene clock to cap the first resumed frame instead of advancing through the hidden interval', () => {
    renderTouchScene();
    type ClockProps = { timeUniform: { value: number }; captureTime?: number; reducedMotion: boolean };
    const timeChildren = Children.toArray(canvasState.children as ReactNode).filter((child) =>
      isValidElement<ClockProps>(child) && typeof child.type === 'function' && 'timeUniform' in child.props);
    expect(timeChildren).toHaveLength(1);
    const timeChild = timeChildren[0] as ReactElement<ClockProps>;
    const uniform = timeChild.props.timeUniform;
    render(timeChild);
    expect(vi.mocked(useFrame).mock.calls).toHaveLength(1);
    const frame = vi.mocked(useFrame).mock.calls[0][0];
    const state = {} as RootState;
    frame(state, 1 / 60);
    const beforeHidden = uniform.value;

    pageVisibility = 'hidden';
    fireEvent(document, new Event('visibilitychange'));
    expect(canvasState.frameloop).toBe('never');
    // No frame callback is dispatched at the Canvas boundary while hidden.
    expect(uniform.value).toBe(beforeHidden);

    pageVisibility = 'visible';
    fireEvent(document, new Event('visibilitychange'));
    expect(canvasState.frameloop).toBe('always');
    frame(state, 30);
    expect(uniform.value - beforeHidden).toBeCloseTo(0.05, 8);
    const afterResume = uniform.value;
    frame(state, 1 / 60);
    expect(uniform.value - afterResume).toBeCloseTo(1 / 60, 8);
  });
});

function renderTouchScene() {
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 2 });
  const result = render(<StormScene score={50} tier={2} wavePercent={80} daysSinceStart={120} />);
  const viewport = result.container.querySelector<HTMLElement>('.storm-interaction-viewport')!;
  return { ...result, viewport };
}

function touchEvent(type: string, count: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', { value: Array.from({ length: count }, (_, identifier) => ({ identifier })) });
  return event;
}

function pointer(target: HTMLElement | Document, type: string, id: number, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId: id, pointerType: 'touch', pageX: x, pageY: y, clientX: x, clientY: y, button: 0 });
  fireEvent(target, event);
}

describe('scene touch interaction contract', () => {
  it('leaves one finger native, reserves only scene multi-touch, and removes both listeners on unmount', () => {
    vi.useFakeTimers();
    const { viewport, getByRole, unmount } = renderTouchScene();
    for (const type of ['touchstart', 'touchmove']) {
      const single = touchEvent(type, 1);
      fireEvent(viewport, single);
      expect(single.defaultPrevented).toBe(false);
      const double = touchEvent(type, 2);
      fireEvent(viewport, double);
      expect(double.defaultPrevented).toBe(true);
      const external = touchEvent(type, 2);
      fireEvent(getByRole('link'), external);
      expect(external.defaultPrevented).toBe(false);
    }
    unmount();
    for (const type of ['touchstart', 'touchmove']) {
      const afterUnmount = touchEvent(type, 2);
      viewport.dispatchEvent(afterUnmount);
      expect(afterUnmount.defaultPrevented).toBe(false);
    }
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([false, true])('keeps real one-/two-finger camera controls with reducedMotion=%s', (reducedMotion) => {
    scenePreferences.reducedMotion = reducedMotion;
    const { viewport } = renderTouchScene();
    const marker = Children.toArray(canvasState.children as ReactNode).find((child) => isValidElement(child) && child.type === OrbitMarker);
    expect(isValidElement(marker)).toBe(true);
    const props = (marker as { props: {
      touches: OrbitControls['touches']; enablePan: boolean; enableZoom: boolean; enableRotate: boolean;
      enableDamping: boolean; dampingFactor: number; autoRotate: boolean; autoRotateSpeed: number;
      minPolarAngle: number; maxPolarAngle: number;
    } }).props;
    expect(props.touches).toEqual({ ONE: undefined, TWO: TOUCH.DOLLY_ROTATE });
    expect(props.enableDamping).toBe(true);
    expect(props.dampingFactor).toBe(0.05);
    expect(props.autoRotate).toBe(!reducedMotion);
    expect(props.autoRotateSpeed).toBe(0.3);
    Object.defineProperties(viewport, {
      clientWidth: { value: 390 }, clientHeight: { value: 338 },
      releasePointerCapture: { value: vi.fn() },
    });
    const camera = new PerspectiveCamera(55, 390 / 338, 0.1, 1000);
    camera.position.set(0, 3, 9);
    const controls = new OrbitControls(camera, viewport);
    Object.assign(controls, props, { autoRotate: false, enableDamping: false });
    const target = controls.target.clone();
    const initialPosition = camera.position.clone();
    try {
      pointer(viewport, 'pointerdown', 1, 160, 180);
      pointer(document, 'pointermove', 1, 250, 80);
      pointer(document, 'pointerup', 1, 250, 80);
      expect(camera.position.distanceTo(initialPosition)).toBe(0);

      pointer(viewport, 'pointerdown', 2, 120, 170);
      pointer(viewport, 'pointerdown', 3, 220, 170);
      const beforeOrbit = controls.getAzimuthalAngle();
      pointer(document, 'pointermove', 2, 150, 130);
      pointer(document, 'pointermove', 3, 250, 130);
      expect(Math.abs(controls.getAzimuthalAngle() - beforeOrbit)).toBeGreaterThan(0.1);
      const beforePinch = camera.position.distanceTo(target);
      pointer(document, 'pointermove', 2, 110, 130);
      pointer(document, 'pointermove', 3, 290, 130);
      expect(camera.position.distanceTo(target)).toBeLessThan(beforePinch * 0.8);
      expect(controls.target.toArray()).toEqual(target.toArray());
      expect(controls.getPolarAngle()).toBeGreaterThanOrEqual(props.minPolarAngle);
      expect(controls.getPolarAngle()).toBeLessThanOrEqual(props.maxPolarAngle);

      pointer(viewport, 'pointercancel', 3, 290, 130);
      const afterCancel = camera.position.clone();
      pointer(document, 'pointermove', 2, 70, 50);
      pointer(document, 'pointerup', 2, 70, 50);
      expect(camera.position.distanceTo(afterCancel)).toBe(0);
    } finally {
      controls.dispose();
    }
  });
});
