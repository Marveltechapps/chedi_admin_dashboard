import type { CSSProperties, ReactNode } from 'react';
import type { TabKey } from '../types';

type Size = number | string;

function px(v: Size) {
  return typeof v === 'number' ? `${v}px` : v;
}

export function Bone({
  w = '100%',
  h = 12,
  r = 4,
  style,
}: {
  w?: Size;
  h?: Size;
  r?: number;
  style?: CSSProperties;
}) {
  return <span className="ch-skel" style={{ width: px(w), height: px(h), borderRadius: r, ...style }} />;
}

function Panel({ children, pad = 22, style }: { children: ReactNode; pad?: number; style?: CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: pad, ...style }}>
      {children}
    </div>
  );
}

function Chips({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {Array.from({ length: count }, (_, i) => (
        <Bone key={i} w={i === 0 ? 72 : 96} h={34} r={20} />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, background: '#eef2e9', padding: '14px 20px', borderBottom: '1px solid #dbe0d1' }}>
        {Array.from({ length: cols }, (_, i) => (
          <Bone key={i} w={i === cols - 1 ? 36 : '58%'} h={10} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #efe9db' }}>
          {Array.from({ length: cols }, (_, col) =>
            col === 0 ? (
              <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bone w={36} h={36} r={18} />
                <div style={{ flex: 1 }}>
                  <Bone w="72%" h={12} />
                  <Bone w="48%" h={10} style={{ marginTop: 7 }} />
                </div>
              </div>
            ) : (
              <Bone key={col} w={col === cols - 1 ? 48 : '70%'} h={12} />
            )
          )}
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
        <Bone w={128} h={40} r={3} />
        <Bone w={148} h={40} r={3} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <Panel key={i} pad={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Bone w="46%" h={10} />
              <Bone w={30} h={30} r={7} />
            </div>
            <Bone w="42%" h={28} style={{ marginTop: 16 }} />
            <Bone w="55%" h={11} style={{ marginTop: 10 }} />
          </Panel>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 16 }}>
        <Panel>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Bone w={160} h={18} />
            <Bone w={90} h={12} />
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: '1px solid #efe9db' }}>
              <Bone w={34} h={34} r={7} />
              <div style={{ flex: 1 }}>
                <Bone w="62%" h={13} />
                <Bone w="40%" h={11} style={{ marginTop: 7 }} />
              </div>
              <Bone w={84} h={34} r={3} />
            </div>
          ))}
        </Panel>
        <Panel>
          <Bone w={150} h={18} style={{ marginBottom: 8 }} />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid #efe9db' }}>
              <Bone w={28} h={28} r={14} />
              <div style={{ flex: 1 }}>
                <Bone w="88%" h={12} />
                <Bone w="48%" h={10} style={{ marginTop: 7 }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <Chips count={3} />
        <Bone w={120} h={38} r={3} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Panel key={i} pad={22}>
            <Bone w="40%" h={10} />
            <Bone w="36%" h={26} style={{ marginTop: 12 }} />
            <Bone w="58%" h={11} style={{ marginTop: 10 }} />
            <div style={{ marginTop: 16, display: 'flex', gap: 4, alignItems: 'flex-end', height: 44 }}>
              {Array.from({ length: 6 }, (_, b) => (
                <Bone key={b} h={18 + ((i + b) % 5) * 6} style={{ flex: 1 }} r={2} />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
        <Bone w={110} h={38} r={3} />
        <Bone w={110} h={38} r={3} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Panel key={i} pad={0} style={{ overflow: 'hidden' }}>
            <Bone h={120} r={0} />
            <div style={{ padding: '14px 16px 18px' }}>
              <Bone w="64%" h={16} />
              <Bone w="42%" h={11} style={{ marginTop: 8 }} />
              <Bone w="80%" h={11} style={{ marginTop: 14 }} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function SplitSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: 16 }}>
      <Panel pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #efe9db' }}>
          <Bone w={90} h={10} />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ padding: '14px 18px', borderBottom: '1px solid #efe9db' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <Bone w="46%" h={13} />
              <Bone w={64} h={18} r={20} />
            </div>
            <Bone w="78%" h={12} style={{ marginTop: 8 }} />
            <Bone w="36%" h={10} style={{ marginTop: 8 }} />
          </div>
        ))}
      </Panel>
      <Panel>
        <Bone w="48%" h={18} />
        <Bone w="70%" h={12} style={{ marginTop: 12 }} />
        <Bone h={42} style={{ marginTop: 18 }} />
        <Bone h={88} r={6} style={{ marginTop: 14 }} />
        <Bone w={120} h={38} r={3} style={{ marginTop: 16 }} />
      </Panel>
    </div>
  );
}

function StackSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 920 }}>
      {Array.from({ length: 4 }, (_, i) => (
        <Panel key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Bone w={180} h={16} />
              <Bone w="55%" h={12} style={{ marginTop: 10 }} />
              <Bone h={42} r={4} style={{ marginTop: 14 }} />
            </div>
            <div style={{ width: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bone h={36} r={3} />
              <Bone h={36} r={3} />
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function ListPageSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Chips />
      </div>
      <TableSkeleton />
    </div>
  );
}

export function PageSkeleton({ tab }: { tab: TabKey }) {
  let body: ReactNode;
  if (tab === 'dashboard') body = <DashboardSkeleton />;
  else if (tab === 'reports') body = <ReportsSkeleton />;
  else if (tab === 'plots' || tab === 'crops' || tab === 'basket') body = <CardGridSkeleton />;
  else if (tab === 'support' || tab === 'notifs' || tab === 'audit') body = <SplitSkeleton />;
  else if (tab === 'cancellations') body = <StackSkeleton />;
  else body = <ListPageSkeleton />;

  return (
    <div className="ch-fade" role="status" aria-busy="true" aria-live="polite">
      <span className="ch-sr">Loading</span>
      {body}
    </div>
  );
}
