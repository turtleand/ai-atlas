import { useEffect, useRef } from "react";
import type { AtlasScene } from "./atlas-model";
import { featureMotion, type SeaFeature } from "./atlas-features";
import type { JourneyDriver } from "./useAtlas";

function SeaArt({ feature }: { feature: SeaFeature }) {
  const { id, color } = feature;
  return (
    <g
      fill="#294853"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <ellipse
        cy="19"
        rx="68"
        ry="22"
        fill="#0d2e3b"
        stroke="none"
        opacity=".55"
      />
      <path d="M-68 23q24 12 47 5M24 29q29 1 44-13" fill="none" opacity=".3" />
      {id === "hallucinations" && (
        <>
          <path
            d="M-42 6Q-26-30 5-24L37-4 30 20Q-13 39-42 6L-64 20-58-4Z"
            fill="#36515c"
          />
          <path d="M-23-18-16-38-4-23M-24 26-11 39 2 28" fill="#637778" />
          <path d="M22-3Q54-11 30 20M29 1l7 6-6 4M28 15l8-1" fill="#132e3b" />
          <circle cx="12" cy="-9" r="6" fill="#b6dad4" />
          <circle cx="14" cy="-9" r="2" fill="#142b36" />
          <path d="M-3-23Q-3-71 37-59L42-43" fill="none" />
          <path
            d="M31-41 40-55 54-44 46-32Z"
            fill="#9dc6c1"
            opacity=".6"
            strokeDasharray="3 4"
          />
          <circle cx="42" cy="-42" r="4" fill="#cce4c5" />
          <path
            d="M-34 2q14-16 29-14M-26 15q9 7 21 7"
            fill="none"
            opacity=".5"
          />
        </>
      )}
      {id === "containment" && (
        <>
          <path
            d="M-47 22Q-24-2-31-18T-11-49Q9-58 13-37L-1-21Q15-8 29 17L48 15Q33 45 11 20T-19 8Q-22 30-47 22"
            fill="#445b55"
          />
          <path d="M-18-47-22-60-8-52M-2-48 8-61 9-45" fill="#8b9982" />
          <path d="M-3-37 4-38" stroke="#e3c594" strokeWidth="4" />
          <path
            d="M-55 24V-25L-32-39M12-46 42-30V0M-55 24-11 45 49 18M-11 45V20"
            fill="none"
            stroke="#688b91"
            strokeWidth="4"
          />
          <path
            d="M-54-24-40-18-35-26M18-41 10-31 19-21M42 0 34 7 47 11"
            fill="none"
            stroke="#b1d4cb"
          />
        </>
      )}
      {id === "compute" && (
        <>
          <path d="M-57 3-34-13 46-3 59 13 30 34-37 21Z" fill="#3d4c51" />
          <path d="M-52 8-36 23 30 36 56 18" fill="none" strokeWidth="5" />
          {[-1, 0, 1].map((n) => (
            <g key={n} transform={`translate(${n * 25},${n * 4 - 8})`}>
              <path d="M-10-23 6-28 13-21V8L-3 14-10 8Z" fill="#57605a" />
              <path d="M-5-16 2-19V4L-5 7Z" fill="#273941" />
              <path d="M-5 3 2 0" stroke="#ba9f6b" strokeWidth="3" />
            </g>
          ))}
          <path d="M-43-8V-44L-27-39V-5M-39-34h7" fill="#354853" />
          <path
            d="M-57 8-66 10M-57 17-64 19"
            stroke="#546b6e"
            strokeWidth="5"
          />
        </>
      )}
      {id === "debt" && (
        <>
          <path
            d="M-57 14-31-12-16 1 7-32 21-2 41-14 61 15 13 32Z"
            fill="#67594c"
          />
          <path d="M-30-5-35-28-11-33 5 17-11 25Z" fill="#4e5755" />
          <path
            d="M-23-18-12-21M-18-7-7-10M-13 4-2 1"
            stroke="#927568"
            strokeWidth="4"
          />
          <path
            d="M-54 21Q-59-17-20 16T42-6Q61 18 20 27T-4-20M-37 13Q-10 39 25 13T53 18"
            fill="none"
            stroke="#b68b70"
            strokeWidth="3"
          />
          <circle cx="28" cy="11" r="13" fill="none" strokeWidth="5" />
          <path d="M16 10h25M27-2v26" strokeWidth="4" />
        </>
      )}
      {id === "reviews" && (
        <>
          <path d="M-60 13-28-3 54 7 31 29Z" fill="#4e5754" />
          <path
            d="M-43 14V-38H5L13-29M34-19l10 8v33"
            fill="none"
            strokeWidth="7"
          />
          <path
            d="M-43-36-28-44H2L12-30M32-20 44-10"
            fill="none"
            stroke="#687e7d"
            strokeWidth="3"
          />
          <path d="M-24-31H-7V-12H-24Z" fill="#263f48" />
          <path d="M-20-26h8M-20-20h8" stroke="#8a9a91" />
          <path
            d="M1 7 12 0 24 8 12 17Z M31 20l14-7 11 9-14 7Z"
            fill="#ae9f73"
          />
          <path d="M12 17v12M42 29v8M5 3l-7-9M31-10l-6 2" />
        </>
      )}
      {id === "understanding" && (
        <>
          <path
            d="M-38 14Q-68-27-24-49T31-28Q44 7 15 25Q-17 43-38 14"
            fill="#42616b"
            fillOpacity=".32"
          />
          <path
            d="M-26 9Q-48-16-23-32T16-21Q31 1 10 14T-17 0Q-24-13-10-16T2-2"
            fill="none"
            strokeWidth="3"
          />
          <path
            d="M-36-32-23-20M-11-47-8-31M16-37 8-22M29-13 15-8M25 11 9 4M1 26-2 10M-26 24-18 9"
            fill="none"
            opacity=".5"
          />
          <ellipse
            cx="-7"
            cy="-4"
            rx="10"
            ry="9"
            fill="#183743"
            stroke="none"
          />
          <path
            d="M20 20Q47 20 60 6M19 25q28 13 42 0M10 29q18 17 33 12"
            fill="none"
            opacity=".65"
          />
          <path
            d="M-57-35h6M-47-50h4M-34-58h3"
            strokeDasharray="2 4"
            opacity=".5"
          />
        </>
      )}
      {id === "burnout" && (
        <>
          <path d="M-38 1Q-43-48-4-50T37 1Q4 27-38 1" fill="#61505a" />
          <path
            d="M-30 3q-7 19 3 28t-7 30M-13 11q-4 19 5 33t-3 25M8 13q-6 27 8 42M28 7q14 17 3 32t5 19"
            fill="none"
            strokeWidth="4"
          />
          <path
            d="M-32-3Q0 14 32-3M-3-46-14-23-4-6 8-20 4-37"
            fill="none"
            stroke="#b88e85"
          />
          <path
            d="M-28-21-12-17M10-17 26-22"
            stroke="#d3a88e"
            strokeWidth="3"
          />
          <path
            d="M-6-30 6-26 9-13-1-8-10-18Z"
            fill="#533e45"
            stroke="#99716d"
          />
          <path
            d="M-21-37-15-31M20-33l-7 7M4 0l4 7"
            stroke="#203742"
            strokeWidth="4"
          />
        </>
      )}
    </g>
  );
}
export function AtlasSea({
  scene,
  driver,
}: {
  scene: AtlasScene;
  driver: JourneyDriver;
}) {
  const root = useRef<SVGGElement>(null);
  useEffect(() => {
    const elements = root.current?.children;
    let last = -Infinity;
    const update = () => {
      const time = driver.ref.current.time;
      if (time - last < 1 / 15) return;
      const first = !Number.isFinite(last);
      last = time;
      scene.features.forEach((f, n) => {
        if (!first && !f.animated) return;
        elements?.[n]?.setAttribute(
          "transform",
          `translate(${f.center.x},${f.center.y + featureMotion(f, time)})`,
        );
      });
    };
    update();
    return driver.subscribe(update);
  }, [scene, driver]);
  return (
    <g ref={root}>
      {scene.features.map((f) => (
        <g key={f.id} data-sea-feature={f.id}>
          <SeaArt feature={f} />
        </g>
      ))}
    </g>
  );
}
