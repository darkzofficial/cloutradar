import Link from 'next/link';

export function RadarMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="#ff6a13" strokeWidth="2" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="#ff6a13" strokeWidth="1.5" opacity=".55" />
      <path d="M16 16 L27 8" stroke="#ff6a13" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="22" cy="20" r="2.2" fill="#ffa25c" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="CloutRadar home">
      <RadarMark />
      <span>
        Clout<b>Radar</b>
      </span>
    </Link>
  );
}
