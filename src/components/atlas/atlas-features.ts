import type { Point } from "./atlas-model";

export type SeaFeatureKind =
  | "hallucinations"
  | "containment"
  | "compute"
  | "debt"
  | "reviews"
  | "understanding"
  | "burnout";
export interface SeaFeature {
  id: SeaFeatureKind;
  name: string;
  center: Point;
  radius: number;
  color: string;
  animated: boolean;
  phase: number;
}
export const seaFeatures: [
  SeaFeatureKind,
  string,
  number,
  number,
  string,
  boolean,
][] = [
  ["hallucinations", "Hallucinations", 0.45, 0.15, "#a6bdc9", true],
  ["containment", "Containment Breach", 0.76, 0.48, "#9cae9c", true],
  ["compute", "Compute Shortage", 0.87, 0.87, "#b8a07f", false],
  ["debt", "Technical Debt", 0.29, 0.78, "#ae9182", false],
  ["reviews", "Skipped Reviews", 0.46, 0.56, "#aaa98d", false],
  ["understanding", "Drained Understanding", 0.1, 0.21, "#9cb6c0", true],
  ["burnout", "AI Cognitive Burn out", 0.3, 0.94, "#bf9896", true],
];
// Both renderers sample this existing journey clock. The collision envelope includes bobbing.
export function featureMotion(feature: SeaFeature, time: number) {
  return feature.animated ? Math.sin(time * 0.8 + feature.phase) * 2 : 0;
}
