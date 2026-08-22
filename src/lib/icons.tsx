export type IconName =
  | 'grid' | 'card' | 'users' | 'leaf' | 'sprout' | 'truck' | 'bell' | 'gear'
  | 'pin' | 'check' | 'plus' | 'search' | 'chart' | 'basket' | 'life' | 'shield'
  | 'refresh' | 'alert';

interface IconProps {
  name: IconName;
  color?: string;
  size?: number;
}

export function Icon({ name, color, size }: IconProps) {
  const c = color || '#1c3b2c';
  const sw = 1.8;
  const s = size || 20;

  const path = (d: string, key: string) => (
    <path key={key} d={d} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  );
  const circle = (cx: number, cy: number, r: number, key: string) => (
    <circle key={key} cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={sw} />
  );
  const line = (x1: number, y1: number, x2: number, y2: number, key: string) => (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={sw} strokeLinecap="round" />
  );
  const rect = (x: number, y: number, w: number, h: number, key: string) => (
    <rect key={key} x={x} y={y} width={w} height={h} rx={1.5} fill="none" stroke={c} strokeWidth={sw} />
  );

  let kids: React.ReactNode[] = [];
  switch (name) {
    case 'grid':
      kids = [rect(3, 3, 7, 7, 'a'), rect(14, 3, 7, 7, 'b'), rect(3, 14, 7, 7, 'c'), rect(14, 14, 7, 7, 'd')];
      break;
    case 'card':
      kids = [rect(3, 5, 18, 14, 'a'), line(3, 9, 21, 9, 'b'), line(6, 15, 10, 15, 'c')];
      break;
    case 'users':
      kids = [
        circle(9, 8, 3.2, 'a'),
        path('M3.5 20v-1.5a4 4 0 014-4h3a4 4 0 014 4V20', 'b'),
        path('M16 5.2a3 3 0 010 5.6', 'c'),
        path('M19 20v-1.2a3.4 3.4 0 00-2.2-3.1', 'd'),
      ];
      break;
    case 'leaf':
      kids = [path('M4 12C4 6 9 4 20 4c0 11-6 16-12 16-5 0-4-8-4-8z', 'a'), path('M9 16c2-4 5-6 9-7', 'b')];
      break;
    case 'sprout':
      kids = [
        line(12, 20, 12, 11, 'a'),
        path('M12 13C12 9 9 8 5 8c0 4 3 5 7 5z', 'b'),
        path('M12 12c0-3 2-4 6-4 0 3-2 4-6 4z', 'c'),
      ];
      break;
    case 'truck':
      kids = [
        rect(2, 7, 12, 8, 'a'),
        path('M14 10h4l3 3v2h-7z', 'b'),
        circle(7, 19, 1.7, 'c'),
        circle(18, 19, 1.7, 'd'),
        line(9, 19, 16, 19, 'e'),
      ];
      break;
    case 'bell':
      kids = [
        path('M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'a'),
        path('M13.7 21a2 2 0 01-3.4 0', 'b'),
      ];
      break;
    case 'gear':
      kids = [
        circle(12, 12, 3, 'a'),
        path('M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1', 'b'),
      ];
      break;
    case 'pin':
      kids = [path('M12 22s7-6 7-12A7 7 0 105 10c0 6 7 12 7 12z', 'a'), circle(12, 10, 2.5, 'b')];
      break;
    case 'check':
      kids = [path('M5 12l4 4L19 7', 'a')];
      break;
    case 'plus':
      kids = [line(12, 5, 12, 19, 'a'), line(5, 12, 19, 12, 'b')];
      break;
    case 'search':
      kids = [circle(11, 11, 7, 'a'), line(16.5, 16.5, 21, 21, 'b')];
      break;
    case 'chart':
      kids = [path('M4 4v16h16', 'a'), path('M7 15l3-4 3 2 4-6', 'b')];
      break;
    case 'basket':
      kids = [path('M5 10h14l-1.5 9H6.5z', 'a'), path('M9 10l3-6 3 6', 'b')];
      break;
    case 'life':
      kids = [
        circle(12, 12, 8, 'a'),
        circle(12, 12, 3.2, 'b'),
        line(5, 5, 9.5, 9.5, 'c'),
        line(14.5, 14.5, 19, 19, 'd'),
        line(19, 5, 14.5, 9.5, 'e'),
        line(9.5, 14.5, 5, 19, 'f'),
      ];
      break;
    case 'shield':
      kids = [path('M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z', 'a'), path('M9 12l2 2 4-4', 'b')];
      break;
    case 'refresh':
      kids = [path('M20 11a8 8 0 10-2 6', 'a'), path('M20 4v5h-5', 'b')];
      break;
    case 'alert':
      kids = [path('M12 3l9 16H3z', 'a'), line(12, 9, 12, 14, 'b'), circle(12, 17, 0.4, 'c')];
      break;
  }

  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden style={{ display: 'block', flex: '0 0 auto' }}>
      {kids}
    </svg>
  );
}
