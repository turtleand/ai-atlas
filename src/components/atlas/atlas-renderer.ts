import type { AtlasScene } from "./atlas-model";
import type { AtlasView, JourneyDriver } from "./useAtlas";
import type { Journey } from "./journey";
export interface AtlasThreeProps {
  scene: AtlasScene;
  view: AtlasView;
  driver: JourneyDriver;
  active: boolean;
  selected: string | null;
  onReady: () => void;
  onFail: (error?: unknown) => void;
  onSlow: () => void;
}

export interface RenderConfig {
  view: AtlasView;
  active: boolean;
  selected: string | null;
  maxDpr: number;
  initialLow: boolean;
}
export type RenderInput =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      scene: AtlasScene;
      journey: Journey;
      config: RenderConfig;
    }
  | { type: "config"; config: RenderConfig }
  | {
      type: "pose";
      journey: Omit<Journey, "path" | "lengths">;
      path?: Journey["path"];
    }
  | { type: "lose-context" }
  | { type: "dispose" };
export type RenderOutput =
  | { type: "ready" }
  | { type: "frame" }
  | { type: "slow" }
  | { type: "disposed" }
  | { type: "error"; message: string }
  | { type: "stats"; stats: Record<string, unknown> }
  | { type: "timing"; contextMs: number };
