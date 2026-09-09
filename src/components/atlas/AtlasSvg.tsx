import { STROKE_RATE } from "./journey";
import { AtlasSea } from "./AtlasSea";
import { useEffect, useRef } from "react";
import {
  coastPath,
  random,
  islandPoint,
  type AtlasScene,
  type AtlasIsland,
} from "./atlas-model";
import { AtlasLandmark } from "./AtlasLandmark";
import { projection, type AtlasView, type JourneyDriver } from "./useAtlas";

function IslandArt({
  island,
  selected,
}: {
  island: AtlasIsland;
  selected: boolean;
}) {
  const { center: c, coast, seed, accent, palette } = island;
  const d = coastPath(coast),
    rng = random(seed);
  const trail = [
    islandPoint(island, 35, 27),
    islandPoint(island, 83, 55),
    islandPoint(island, island.radius, 26),
  ];
  const transform = (scale: number, dy = 0) =>
    `translate(${c.x},${c.y + dy}) scale(${scale}) translate(${-c.x},${-c.y})`;
  return (
    <g>
      <defs>
        <linearGradient id={`land-${island.id}`} x2=".5" y2="1">
          <stop stopColor={palette.raised} />
          <stop offset=".5" stopColor={palette.land} />
          <stop offset="1" stopColor={palette.shadow} />
        </linearGradient>
      </defs>
      <path
        d={d}
        transform={transform(1.25, 10)}
        fill="#397f85"
        opacity=".12"
      />
      <path
        d={d}
        transform={transform(1.17, 8)}
        fill={accent}
        opacity=".19"
        stroke="#7bb9a0"
        strokeWidth="1"
      />
      <path d={d} transform={transform(1.055, 8)} fill="#102e35" opacity=".7" />
      <path d={d} fill="url(#atlas-sand)" stroke="#e0d2a4" strokeWidth="2" />
      <path
        d={d}
        transform={transform(0.91, -3)}
        fill={`url(#land-${island.id})`}
        stroke={palette.raised}
        strokeWidth="2.5"
      />
      <path
        d={d}
        transform={transform(0.75, -13)}
        fill={palette.land}
        opacity=".7"
        stroke={palette.raised}
        strokeWidth="1.2"
      />
      <path
        d={d}
        transform={transform(0.55, -22)}
        fill={palette.raised}
        opacity=".5"
      />
      <path
        d={d}
        transform={transform(1.12, 5)}
        fill="none"
        stroke={accent}
        strokeWidth={selected ? 3 : 1.2}
        opacity={selected ? 0.85 : 0.3}
        strokeDasharray={selected ? undefined : "14 19 4 21"}
      />
      <path
        d={`M${trail[0].x},${trail[0].y} Q${trail[1].x},${trail[1].y} ${trail[2].x},${trail[2].y}`}
        stroke="#dbd0a0"
        strokeWidth="8"
        fill="none"
        opacity=".7"
      />
      {Array.from({ length: 7 }, (_, n) => {
        const a = rng() * Math.PI * 2,
          r = island.radius * (0.57 + rng() * 0.19),
          { x, y } = islandPoint(
            island,
            Math.cos(a) * r,
            Math.sin(a) * r * 0.68,
          );
        return (
          <g key={n} transform={`translate(${x},${y})`}>
            <ellipse
              cx="5"
              cy="5"
              rx="13"
              ry="6"
              fill="#183f32"
              opacity=".24"
            />
            <path
              d="M0 9Q-5-2 1-19"
              stroke="#8d7956"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M1-19Q-18-27-20-12Q-10-21 1-19M1-19Q16-30 20-17Q9-23 1-19M1-19Q-3-34-10-31Q-3-30 1-19M1-19Q14-15 13-4Q8-14 1-19"
              fill="#365d43"
              stroke="#7d9b6c"
              strokeWidth="1"
            />
          </g>
        );
      })}
      <g transform={`translate(${c.x},${c.y - 13}) scale(1.18)`}>
        <AtlasLandmark kind={island.landmark} accent={accent} />
      </g>
      <g
        transform={`translate(${island.jetty.x},${island.jetty.y}) rotate(${(island.rotation * 180) / Math.PI - 8})`}
      >
        <path d="M-10-9H19V9H-10Z" fill="#ad9871" stroke="#645e44" />
        <path d="M-4-9V9M4-9V9M12-9V9" stroke="#ddcda2" strokeWidth="1.4" />
      </g>
    </g>
  );
}
export function TurtleArt() {
  return (
    <g>
      <ellipse cx="-3" cy="5" rx="27" ry="17" fill="#102e35" opacity=".35" />
      <path d="M-20-3Q-33 0-31 4L-19 4" fill="#91aa76" />
      {[-1, 1].map((side) => (
        <g key={`rear${side}`} data-paddle={`rear:${side}`}>
          <path
            d={`M-13 ${side * 8}Q-31 ${side * 8}-28 ${side * 21}Q-19 ${side * 24}-9 ${side * 11}`}
            fill="#84a577"
            stroke="#3b6654"
            strokeWidth="1"
          />
        </g>
      ))}
      <ellipse
        cx="-1"
        rx="24"
        ry="17"
        fill="#b9c58d"
        stroke="#376653"
        strokeWidth="1.4"
      />
      <ellipse
        cx="-3"
        cy="-1"
        rx="22"
        ry="15.5"
        fill="url(#atlas-shell)"
        stroke="#d0b278"
        strokeWidth="1"
      />
      <g stroke="#385d4a" strokeWidth="1.1" fill="#7c9160">
        <path d="M-15-5-7-10 1-5-1 4-12 5Z" />
        <path d="M1-5 9-9 17-3 15 5 6 8-1 4Z" />
        <path
          d="M-22-6-15-5-12 5-20 8M-7-10-8-15M9-9 8-15M6 8 7 14M-12 5-13 12"
          fill="none"
        />
      </g>
      <path
        d="M-17-4-10-4-10-7-4-7M-6 6 2 6 2 1 10 1 10-3 16-3"
        fill="none"
        stroke="#8ce0c5"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="-4" cy="-7" r="1.4" fill="#c2f6dc" />
      <circle cx="16" cy="-3" r="1.4" fill="#c2f6dc" />
      {[-1, 1].map((side) => (
        <g key={`front${side}`} data-paddle={`front:${side}`}>
          <path
            d={`M10 ${side * 10}C17 ${side * 14}19 ${side * 31}30 ${side * 25}C33 ${side * 21}23 ${side * 8}16 ${side * 7}`}
            fill="#b0c991"
            stroke="#406e58"
            strokeWidth="1.2"
          />
          <path
            d={`M17 ${side * 13}Q23 ${side * 19}27 ${side * 23}`}
            fill="none"
            stroke="#d4dfac"
            strokeWidth="1"
          />
          {side === -1 && (
            <g transform="translate(21,-17) rotate(-35)">
              <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#284e50" />
              <rect
                x="-2.5"
                y="-2"
                width="5"
                height="4"
                rx="1"
                fill="#85dfc3"
              />
            </g>
          )}
        </g>
      ))}
      <path
        d="M17-7C25-11 38-9 39 0C38 10 25 10 18 7Z"
        fill="#b0c991"
        stroke="#496f55"
        strokeWidth="1.2"
      />
      <ellipse cx="29" cy="-5" rx="3.7" ry="2.6" fill="#e9e5cd" />
      <ellipse cx="29" cy="5" rx="3.7" ry="2.6" fill="#e9e5cd" />
      <circle cx="30.5" cy="-5" r="1.65" fill="#244741" />
      <circle cx="30.5" cy="5" r="1.65" fill="#244741" />
      <circle cx="31" cy="-5.5" r=".5" fill="#fff" />
      <circle cx="31" cy="4.5" r=".5" fill="#fff" />
      <path d="M35-2Q37 0 35 2" stroke="#638060" fill="none" strokeWidth=".8" />
      <path
        d="M23-7Q16-15 22-16Q28-15 27-9"
        stroke="#23464b"
        strokeWidth="2.5"
        fill="none"
      />
      <ellipse
        cx="23"
        cy="-7"
        rx="4"
        ry="2.5"
        fill="#284f53"
        stroke="#98dfc3"
        strokeWidth="1"
      />
    </g>
  );
}
export function AtlasSvg({
  scene,
  view,
  selected,
  driver,
}: {
  scene: AtlasScene;
  view: AtlasView;
  selected: string | null;
  driver: JourneyDriver;
}) {
  const turtle = useRef<SVGGElement>(null),
    wake = useRef<SVGPathElement>(null),
    route = useRef<SVGPathElement>(null);
  useEffect(() => {
    let lastPath: typeof driver.ref.current.path | null = null;
    const paddles =
      turtle.current?.querySelectorAll<SVGGElement>("[data-paddle]");
    const update = () => {
      const j = driver.ref.current,
        p = projection(j.position, view);
      const scale = Math.min(
        view.zoom * 1.15,
        Math.max(0.32, view.zoom * 0.85),
      );
      turtle.current?.setAttribute(
        "transform",
        `translate(${p.x},${p.y}) rotate(${(j.heading * 180) / Math.PI}) scale(${scale})`,
      );
      paddles?.forEach((el) => {
        const [part, sideString] = el.dataset.paddle!.split(":");
        const side = Number(sideString),
          front = part === "front";
        const angle =
          Math.sin(j.time * STROKE_RATE + (front ? 0 : 1)) *
          (front ? 18 : 7) *
          side *
          (j.phase === "visit" ? 0.18 : 1);
        el.setAttribute(
          "transform",
          `rotate(${angle},${front ? 12 : -13},${side * 9})`,
        );
      });
      wake.current?.setAttribute(
        "d",
        j.wake
          .map((a, n) => {
            const q = projection(a, view);
            return `${n ? "L" : "M"}${q.x},${q.y}`;
          })
          .join(" "),
      );
      if (lastPath !== j.path || route.current?.getAttribute("d") === "") {
        lastPath = j.path;
        route.current?.setAttribute(
          "d",
          j.path
            .map((a, n) => {
              const q = projection(a, view);
              return `${n ? "L" : "M"}${q.x},${q.y}`;
            })
            .join(" "),
        );
      }
    };
    update();
    return driver.subscribe(update);
  }, [driver, view]);
  return (
    <svg
      className="atlas-svg"
      width={view.width}
      height={view.height}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="atlas-sand" x2=".3" y2="1">
          <stop stopColor="#e4d6ab" />
          <stop offset="1" stopColor="#b9ab80" />
        </linearGradient>
        <radialGradient id="atlas-shell" cx=".3" cy=".25">
          <stop stopColor="#c5bc7b" />
          <stop offset=".6" stopColor="#8e9560" />
          <stop offset="1" stopColor="#4b6e50" />
        </radialGradient>
        <pattern
          id="atlas-grid"
          width="72"
          height="72"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M72 0H0V72"
            fill="none"
            stroke="#86aea8"
            strokeWidth=".6"
            opacity=".085"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#atlas-grid)" />
      <g
        transform={`translate(${view.width / 2 - view.center.x * view.zoom},${view.height / 2 - view.center.y * view.zoom}) scale(${view.zoom})`}
      >
        <g fill="none" stroke="#7ba7a6" strokeWidth="1.4" opacity=".16">
          {Array.from({ length: 6 }, (_, n) => (
            <path
              key={n}
              d={`M20 ${280 + n * 120}Q430 ${80 + n * 130} 650 ${350 + n * 110}T1450 ${180 + n * 150}`}
            />
          ))}
        </g>
        <AtlasSea scene={scene} driver={driver} />
        {scene.islands.map((island) => (
          <IslandArt
            key={island.id}
            island={island}
            selected={selected === island.id}
          />
        ))}
      </g>
      <path
        ref={route}
        d=""
        stroke="#a3cebc"
        strokeWidth="1"
        strokeDasharray="3 8"
        fill="none"
        opacity=".3"
      />
      <path
        ref={wake}
        fill="none"
        stroke="#a4dbc8"
        strokeWidth="3"
        opacity=".28"
        strokeLinecap="round"
      />
      <g ref={turtle}>
        <TurtleArt />
      </g>
    </svg>
  );
}
