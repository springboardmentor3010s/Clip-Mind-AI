export default function Waveform({ className = "" }) {
  const heights = [4, 10, 6, 14, 8, 18, 10, 22, 14, 26, 16, 22, 12, 18, 8, 14, 6, 10, 4, 8];
  return (
    <svg viewBox="0 0 200 32" className={className} aria-hidden="true">
      {heights.map((h, i) => (
        <rect key={i} x={i * 10} y={16 - h / 2} width="4" height={h} rx="2" fill="currentColor" />
      ))}
    </svg>
  );
}