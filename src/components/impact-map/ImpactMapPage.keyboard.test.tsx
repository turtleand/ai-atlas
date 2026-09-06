// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImpactMapPage } from './ImpactMapPage';

beforeEach(() => {
  window.history.replaceState(null, '', '/ai-impact-map/');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => '# Code Review\n\n## Explanation\nReview requires context and judgment.\n' })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openEvidence() {
  render(<MemoryRouter><ImpactMapPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Code Review/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Open evidence' }));
  await waitFor(() => expect(document.querySelector('.notes-explanation')?.textContent).toContain('Review requires context'));
  expect(document.querySelector('.notes-panel.open')).not.toBeNull();
}

describe('Impact Map overlay keyboard dismissal', () => {
  it('dismisses the topmost evidence panel before the underlying role detail', async () => {
    await openEvidence();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.notes-panel.open')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Code Review' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open evidence' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.impact-role-detail')).toBeNull();
  });

  it('keeps role dismissal available after the evidence close button', async () => {
    await openEvidence();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.querySelector('.notes-panel.open')).toBeNull();
    expect(document.querySelector('.impact-role-detail')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.impact-role-detail')).toBeNull();
  });

  it('keeps role dismissal available after the evidence backdrop', async () => {
    await openEvidence();
    fireEvent.click(document.querySelector('.notes-backdrop')!);
    expect(document.querySelector('.notes-panel.open')).toBeNull();
    expect(document.querySelector('.impact-role-detail')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close role detail' }));
    expect(document.querySelector('.impact-role-detail')).toBeNull();
  });
});
