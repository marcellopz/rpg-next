import { MapPin } from "lucide-react";

const PINS = [
  { label: "Eldermoor", left: "28%", top: "68%", color: "text-red-600" },
  { label: "Old bridge", left: "53%", top: "44%", color: "text-sky-600" },
  { label: "The Grove", left: "78%", top: "66%", color: "text-violet-600" },
];

export function MapPreview() {
  return (
    <div className="relative h-full w-full max-w-xl overflow-hidden rounded-xl border border-[#8d7957] bg-[#dcc99d] shadow-sm">
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <pattern id="map-paper" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 4 22 1M3 22 20 18" stroke="#7d6947" strokeWidth="0.5" opacity="0.12" />
            <circle cx="6" cy="9" r="0.7" fill="#765f3d" opacity="0.14" />
          </pattern>
          <pattern id="map-waves" width="18" height="12" patternUnits="userSpaceOnUse">
            <path d="M0 7q4-4 9 0t9 0" fill="none" stroke="#6490a0" strokeWidth="1" opacity="0.45" />
          </pattern>
          <filter id="map-shadow">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#45371f" floodOpacity="0.25" />
          </filter>
        </defs>

        <rect width="640" height="360" fill="#dfcca0" />
        <rect width="640" height="360" fill="url(#map-paper)" />

        {/* Eastern sea and rugged coastline */}
        <path
          d="M547-5c-22 31-7 55-24 77-15 20-8 42 3 57 14 20-5 37 4 58 10 24 34 31 25 56-8 24 1 46 22 61 17 12 20 34 14 61h54V-5Z"
          fill="#a9c7c9"
          stroke="#6d877e"
          strokeWidth="2"
        />
        <path
          d="M555 0c-23 31-8 54-25 76-17 22-8 44 3 59 13 18-6 35 4 57 10 23 34 29 26 54-8 26 2 46 23 62"
          fill="none"
          stroke="#f3e5bd"
          strokeWidth="7"
          opacity="0.75"
        />
        <path d="M565 0h75v360h-48c5-31-2-48-19-62-19-16-27-34-18-58 8-24-15-31-25-54-9-21 10-38-4-58-11-15-18-37-3-57 17-22 2-46 24-77Z" fill="url(#map-waves)" />

        {/* Mountain range */}
        <g fill="#b09b70" stroke="#715e3d" strokeWidth="2" filter="url(#map-shadow)">
          <path d="m55 92 34-57 32 57Z" />
          <path d="m101 105 45-76 42 76Z" />
          <path d="m161 94 32-54 30 54Z" />
          <path d="m211 111 43-72 41 72Z" />
        </g>
        <g fill="none" stroke="#f0dfb7" strokeWidth="3">
          <path d="m73 65 16-30 15 31-10-6-7 9-7-8Z" />
          <path d="m124 67 22-38 21 38-14-8-8 11-9-10Z" />
          <path d="m177 67 16-27 14 27-9-6-7 9-6-8Z" />
          <path d="m233 74 21-35 19 34-11-7-9 11-8-10Z" />
        </g>
        <text x="145" y="125" textAnchor="middle" fill="#6f5a3a" fontSize="11" fontWeight="700" letterSpacing="2">
          ASHEN PEAKS
        </text>

        {/* River, tributary and roads */}
        <path
          d="M253 95c17 35 60 24 76 53 18 32-26 49-5 77 20 27 72 13 103 46 18 19 31 48 33 89"
          fill="none"
          stroke="#6d9fae"
          strokeWidth="9"
          opacity="0.8"
        />
        <path
          d="M253 95c17 35 60 24 76 53 18 32-26 49-5 77 20 27 72 13 103 46 18 19 31 48 33 89"
          fill="none"
          stroke="#c5dadd"
          strokeWidth="4"
          opacity="0.75"
        />
        <path d="M329 148c54-16 92-4 124-30" fill="none" stroke="#826944" strokeWidth="3" strokeDasharray="7 5" />
        <path d="M178 271c53-10 91-45 144-47 59-2 108 30 163 8" fill="none" stroke="#826944" strokeWidth="4" strokeDasharray="8 5" />
        <path d="M177 268c-18 23-35 44-40 79" fill="none" stroke="#826944" strokeWidth="3" strokeDasharray="7 5" />

        {/* Forests */}
        <g fill="#71845a" stroke="#536344" strokeWidth="1.5" opacity="0.95">
          <path d="m407 78-12 22h8l-10 17h28l-10-17h8Z" />
          <path d="m440 55-13 24h8l-10 18h30l-11-18h9Z" />
          <path d="m477 82-12 22h8l-10 17h28l-10-17h8Z" />
          <path d="m456 105-13 24h8l-10 18h30l-11-18h9Z" />
          <path d="m497 118-12 22h8l-10 17h28l-10-17h8Z" />
          <path d="m385 118-12 22h8l-10 17h28l-10-17h8Z" />
          <path d="m410 150-13 24h8l-10 18h30l-11-18h9Z" />
          <path d="m448 158-12 22h8l-10 17h28l-10-17h8Z" />
          <path d="m482 164-12 22h8l-10 17h28l-10-17h8Z" />
        </g>
        <text x="446" y="42" textAnchor="middle" fill="#556044" fontSize="11" fontWeight="700" letterSpacing="2">
          WHISPERWOOD
        </text>

        {/* Marsh, ruins and settlements */}
        <g fill="none" stroke="#758769" strokeWidth="2" opacity="0.65">
          <path d="M65 215q18-10 36 0t36 0M55 229q21-10 42 0t42 0M72 244q18-10 36 0t36 0" />
        </g>
        <text x="96" y="265" textAnchor="middle" fill="#68725c" fontSize="10" fontWeight="700" letterSpacing="1.5">
          GREYFEN
        </text>
        <g transform="translate(475 242)" fill="#8b7753" stroke="#665436" strokeWidth="1.5">
          <path d="M0 23V8l9-7 9 7v15M23 23V4h13v19M-4 23h44" />
          <path d="M27 4V-4h5v8" />
        </g>
        <text x="493" y="283" textAnchor="middle" fill="#705c3c" fontSize="9" fontWeight="700">
          OLD WATCH
        </text>
        <g transform="translate(170 233)" fill="#8a6844" stroke="#59442f" strokeWidth="1.5">
          <rect x="-12" y="-7" width="24" height="17" rx="2" />
          <path d="m-16-7 16-11L16-7M-5 10V1h10v9" />
        </g>
        <g transform="translate(338 139)" stroke="#705738" strokeWidth="3">
          <path d="M-17 0h34M-13-5v10M-5-5v10M5-5v10M13-5v10" />
        </g>

        {/* Compass rose */}
        <g transform="translate(52 307)" fill="#6d593a" stroke="#6d593a">
          <circle r="23" fill="#ead9ae" fillOpacity="0.75" strokeWidth="1.5" />
          <path d="M0-19 5-4 0 0-5-4ZM19 0 4 5 0 0 4-5ZM0 19-5 4 0 0 5 4ZM-19 0-4-5 0 0-4 5Z" />
          <text y="-26" textAnchor="middle" fontSize="9" fontWeight="700">N</text>
        </g>
      </svg>

      {PINS.map((pin) => (
        <div
          key={pin.label}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: pin.left, top: pin.top }}
        >
          <MapPin
            className={`h-8 w-8 fill-white drop-shadow-md ${pin.color}`}
            aria-hidden
          />
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/95 px-1.5 py-0.5 text-[0.6rem] font-semibold text-gray-700 shadow">
            {pin.label}
          </span>
        </div>
      ))}

      <div className="absolute bottom-3 right-3 rounded border border-gray-200 bg-white/95 px-3 py-2 text-right shadow">
        <p className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-400">
          Campaign map
        </p>
        <p className="mt-0.5 text-xs font-semibold text-gray-800">
          The Eldermoor Valley
        </p>
      </div>
      <div className="absolute right-3 top-3 flex gap-1 rounded border border-gray-200 bg-white/95 p-1.5 shadow">
        <span className="h-5 w-5 rounded bg-gray-100 text-center text-sm font-bold text-gray-500">
          +
        </span>
        <span className="h-5 w-5 rounded bg-gray-100 text-center text-sm font-bold text-gray-500">
          −
        </span>
      </div>
    </div>
  );
}
