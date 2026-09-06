// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TsunamiPage } from './TsunamiPage';
import {
  SKILL_DIMENSIONS,
  TIER_INFO,
} from '../../data/tsunami-data';

const STORAGE_KEY = 'tsunami-tracker-scores';
const EXPECTED_TIER_FLOORS = [0, 50, 80, 95, 99] as const;

vi.mock('./TsunamiNav', () => ({
  TsunamiNav: () => <nav aria-label="Tsunami navigation" />,
}));

vi.mock('./StormScene', () => ({
  StormScene: ({ score, tier }: { score: number; tier: number }) => (
    <div data-testid="storm-scene" data-score={score} data-tier={tier} />
  ),
}));

vi.mock('./ScoreDisplay', () => ({
  ScoreDisplay: ({ score, tier }: { score: number; tier: number }) => (
    <div>{`Score ${score} · Tier ${tier}`}</div>
  ),
}));

function getSliderValues(): number[] {
  return SKILL_DIMENSIONS.map((dimension) => {
    const input = screen.getByLabelText(dimension.name) as HTMLInputElement;
    return Number(input.value);
  });
}

describe('TsunamiPage ship profile preview', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('previews every ship across the score and sliders, then toggles back', () => {
    render(<TsunamiPage />);

    const defaultScores = SKILL_DIMENSIONS.map((dimension) => dimension.defaultValue);
    expect(screen.getByText("Turtleand's Profile")).toBeTruthy();
    expect(getSliderValues()).toEqual(defaultScores);

    for (const [index, tierInfo] of TIER_INFO.entries()) {
      const tierButton = screen.getByTitle(`${tierInfo.name} (${tierInfo.scoreRange})`);
      const tierFloor = EXPECTED_TIER_FLOORS[index];

      fireEvent.click(tierButton);

      expect(screen.getByText(`T${tierInfo.tier} reference profile`)).toBeTruthy();
      expect(screen.getByText(`Score ${tierFloor} · Tier ${tierInfo.tier}`)).toBeTruthy();
      expect(getSliderValues()).toEqual(SKILL_DIMENSIONS.map(() => tierFloor));
      expect(screen.getByTestId('storm-scene').getAttribute('data-score')).toBe(
        String(tierFloor)
      );
      expect(screen.getByTestId('storm-scene').getAttribute('data-tier')).toBe(
        String(tierInfo.tier)
      );
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

      fireEvent.click(tierButton);

      expect(screen.getByText("Turtleand's Profile")).toBeTruthy();
      expect(getSliderValues()).toEqual(defaultScores);
    }
  });

  it('keeps a saved user profile unchanged while previewing and restores it', () => {
    const savedScores = {
      aiIntegration: 72,
      automation: 61,
      adaptability: 83,
      aiIndependence: 54,
      strategicThinking: 77,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedScores));

    render(<TsunamiPage />);

    expect(screen.getByText('Your Profile')).toBeTruthy();
    expect(getSliderValues()).toEqual(Object.values(savedScores));

    fireEvent.click(screen.getByTitle('AI Flagship (95–98)'));

    expect(screen.getByText('T4 reference profile')).toBeTruthy();
    expect(getSliderValues()).toEqual(SKILL_DIMENSIONS.map(() => 95));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual(savedScores);

    fireEvent.click(screen.getByText('← Back to saved score'));

    expect(screen.getByText('Your Profile')).toBeTruthy();
    expect(getSliderValues()).toEqual(Object.values(savedScores));
  });

  it('turns an edited preview into the saved user profile and can reset it', () => {
    render(<TsunamiPage />);

    fireEvent.click(screen.getByTitle('Unprotected Sloop (50–79)'));
    fireEvent.input(screen.getByLabelText('AI Integration'), {
      target: { value: '63' },
    });

    const editedScores = {
      aiIntegration: 63,
      automation: 50,
      adaptability: 50,
      aiIndependence: 50,
      strategicThinking: 50,
    };

    expect(screen.getByText('Your Profile')).toBeTruthy();
    expect(getSliderValues()).toEqual(Object.values(editedScores));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual(editedScores);

    fireEvent.click(screen.getByText('reset'));

    expect(screen.getByText("Turtleand's Profile")).toBeTruthy();
    expect(getSliderValues()).toEqual(
      SKILL_DIMENSIONS.map((dimension) => dimension.defaultValue)
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
