import type { CSSProperties } from 'react';

export interface Pill {
  label: string;
  style: CSSProperties;
}

const g: [string, string, string] = ['#e6f0e2', '#2e5a41', '#c3dcb8'];
const y: [string, string, string] = ['#fdf3dc', '#a9781f', '#ecd9a8'];
const r: [string, string, string] = ['#f9e6df', '#b0361f', '#eabfb2'];
const n: [string, string, string] = ['#eef2e9', '#4b5142', '#dbe0d1'];
const d: [string, string, string] = ['#edeae1', '#7c8370', '#d8d2c2'];
const k9: [string, string, string] = ['#1c3b2c', '#f6f3ea', '#1c3b2c'];

const map: Record<string, [string, string, string, string]> = {
  active: [...g, 'Active'],
  pending: [...r, 'Membership unpaid'],
  suspended: [...r, 'Suspended'],
  cancelled: [...d, 'Cancelled'],
  paused: [...d, 'Paused'],
  paid: [...g, 'Paid'],
  overdue: [...r, 'Overdue'],
  failed: [...r, 'Failed'],
  refunded: [...d, 'Refunded'],
  pending_activation: [...y, 'Pending activation'],
  renewal_due: [...y, 'Renewal due'],
  payment_pending: [...y, 'Payment pending'],
  expired: [...d, 'Expired'],
  none: [...d, 'No subscription'],
  available: [...g, 'Available'],
  reserved: [...y, 'Reserved'],
  leased: [...k9, 'Leased'],
  cultivating: [...g, 'Cultivating'],
  harvesting: [...y, 'Harvesting'],
  maintenance: [...d, 'Maintenance'],
  unavailable: [...r, 'Unavailable'],
  planned: [...d, 'Planned'],
  growing: [...g, 'Growing'],
  flowering: [...g, 'Flowering'],
  fruiting: [...g, 'Fruiting'],
  ready: [...y, 'Ready'],
  harvested: [...n, 'Harvested'],
  scheduled: [...n, 'Scheduled'],
  packed: [...y, 'Packed'],
  ready_dispatch: [...y, 'Ready to dispatch'],
  out: [...y, 'Out for delivery'],
  delivered: [...g, 'Delivered'],
  rescheduled: [...n, 'Rescheduled'],
  draft: [...d, 'Draft'],
  review: [...y, 'In review'],
  locked: [...n, 'Locked'],
  published: [...g, 'Published'],
  open: [...r, 'Open'],
  in_progress: [...y, 'In progress'],
  waiting: [...n, 'Waiting'],
  resolved: [...g, 'Resolved'],
  closed: [...d, 'Closed'],
};

export function pill(kind: string): Pill {
  const m = map[kind] || [...n, kind];
  return {
    label: m[3],
    style: {
      display: 'inline-block',
      background: m[0],
      color: m[1],
      border: `1px solid ${m[2]}`,
      padding: '4px 11px',
      borderRadius: 20,
      fontSize: 11.5,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    },
  };
}

export function sPill(kind: string): Pill {
  const q = pill(kind);
  return { label: q.label, style: { ...q.style, padding: '3px 8px', fontSize: 10 } };
}
