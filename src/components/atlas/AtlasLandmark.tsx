import type { Landmark } from "./atlas-model";

// The same small vocabulary is used by the SVG scene and procedural 3D model.
export function AtlasLandmark({
  kind,
  accent,
}: {
  kind: Landmark;
  accent: string;
}) {
  const ink = "#233e39",
    wall = "#d8ceb0",
    roof = "#526f63";
  return (
    <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round">
      <ellipse
        cy="24"
        rx="59"
        ry="18"
        fill="#173d32"
        opacity=".28"
        stroke="none"
      />
      {kind === "pavilion" && (
        <>
          <ellipse cy="22" rx="55" ry="23" fill="#b7b291" />
          <path
            d="M-39 12V-24M-14 23V-13M15 23V-13M40 12V-24"
            stroke={wall}
            strokeWidth="6"
          />
          <path d="M-53-22 0-53 53-22 0 1Z" fill={accent} />
          <path d="M0-53V1L53-22" fill="#ae8451" />
          <path
            d="M-25 8q12-13 23 0M9 8q12-13 23 0"
            fill="none"
            stroke={wall}
            strokeWidth="5"
          />
        </>
      )}
      {kind === "pigment" && (
        <>
          {["#9d7477", "#d5ae70", "#75a2a0"].map((c, n) => (
            <g key={c} transform={`translate(${(n - 1) * 33},${(n % 2) * 15})`}>
              <path d="M-22-15 5-28 25-15 0 0Z" fill={c} />
              <path d="M-22-15V7L0 23V0Z" fill="#78957d" />
              <path d="M0 0 25-15V7L0 23Z" fill="#557964" />
              <ellipse cy="-9" rx="12" ry="5" fill={c} stroke={wall} />
            </g>
          ))}
          <path d="M-27-32-8-48M-13-26 7-46" stroke={wall} strokeWidth="4" />
        </>
      )}
      {kind === "cinema" && (
        <>
          <path d="M-48 24-45-43 41-36 47 26Z" fill={wall} />
          <path d="M-38-35 34-29 38 11-37 14Z" fill="#294f62" />
          <path d="M-10-20 12-8-9 4Z" fill={accent} stroke="none" />
          <path
            d="M-51 26Q0 48 51 26M-40 36Q0 52 39 36"
            fill="none"
            stroke="#a79d78"
            strokeWidth="7"
          />
        </>
      )}
      {kind === "workshop" && (
        <>
          <path d="M-44-14V24L0 39 44 21V-16L0-31Z" fill={wall} />
          <path d="M0 39V-5L44-16V21Z" fill="#91a894" />
          <path d="M-53-14-9-45 48-24 0 0Z" fill={roof} />
          <path d="M-9-45 3-22 0 0 48-24Z" fill={accent} />
          <path
            d="M-32 4-22 8-32 13M-10 12-17 16-10 21"
            fill="none"
            stroke={ink}
            strokeWidth="3"
          />
          <path d="M13 12 31 6V24L13 31Z" fill={ink} />
        </>
      )}
      {kind === "observatory" && (
        <>
          <path d="M-32-5V22Q0 44 33 22V-5" fill={wall} />
          <ellipse cy="-5" rx="33" ry="17" fill={roof} />
          <path d="M-34-6C-35-59 35-59 35-6Z" fill={accent} />
          <path
            d="M0-44Q-15-30-10-6M0-44Q13-29 17-6"
            fill="none"
            stroke="#497c86"
          />
          <path d="M-4-20 24-52 36-45 9-13Z" fill={wall} />
          <ellipse cx="30" cy="-49" rx="9" ry="5" fill="#284d55" />
          <path d="M-10 20V7Q0-5 10 7V24" fill={ink} />
        </>
      )}
      {kind === "library" && (
        <>
          <path d="M-52-17 0-34 52-17V25L0 39-52 25Z" fill={wall} />
          <path d="M0-34V39L52 25V-17Z" fill="#afba99" />
          <path d="M-55-20 0-39 55-20 0-1Z" fill={roof} />
          <path d="M0-1V39" fill="none" />
          {[-35, -20, 18, 33].map((x) => (
            <path key={x} d={`M${x} 4v15`} stroke={ink} strokeWidth="6" />
          ))}
          <path d="M-6 21-19 17V-5L-6-1 8-6V17Z" fill={accent} />
        </>
      )}
      {kind === "utilities" && (
        <>
          {[-1, 0, 1].map((n) => (
            <g key={n} transform={`translate(${n * 31},${-Math.abs(n) * 7})`}>
              <path d="M-14-25 4-33 21-23V25L3 34-14 25Z" fill={wall} />
              <path d="M3-17 21-23V25L3 34Z" fill="#829c87" />
              <path
                d="M-8-13-1-10M-8-4-1-1M-8 5-1 8"
                stroke={ink}
                strokeWidth="3"
              />
              <circle cx="-5" cy="18" r="2" fill={accent} />
            </g>
          ))}
          <path
            d="M-49 31-25 41 1 41 25 36"
            stroke={accent}
            fill="none"
            strokeWidth="3"
          />
        </>
      )}
      {kind === "harbor" && (
        <>
          <path d="M-45 13-9 28 44 5V16L-9 40-45 23Z" fill="#bbaa7e" />
          <path d="M-45 17-9 33 44 10" fill="none" />
          <path d="M-12 17-12-31 9-37 21-31 21 16Z" fill={wall} />
          <path d="M-17-30 3-49 25-31Z" fill={accent} />
          <path d="M-3-22H12V-8H-3Z" fill="#e5c47b" />
          <path d="M-32 5-29-12-17 8ZM29-2 34-18 45-6Z" fill={accent} />
        </>
      )}
      {kind === "jetty" && (
        <>
          <path d="M-44-2 15 22 54 7V17L15 35-44 10Z" fill="#c5b183" />
          <path
            d="M-35 3 16 26 47 13M-30 0V13M-15 6V19M0 13V25M17 20V33M33 15V26"
            fill="none"
          />
          <path d="M-33-5V-29L-8-39 12-28V10Z" fill={wall} />
          <path d="M-39-29-13-47 18-28-8-18Z" fill={accent} />
          <path d="M-20-10V-20L-7-15V-5Z" fill={ink} />
          <path d="M29 4V-22L45-17 29-11" fill={accent} />
        </>
      )}
    </g>
  );
}
