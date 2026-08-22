import { useApp } from '../store/AppContext';
import { chipStyle } from '../lib/buttons';

const RANGES: { key: string; label: string }[] = [
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'this_year', label: 'This year' },
];

function bars(arr: number[] | undefined, color: string) {
  const values = arr && arr.length ? arr : [0, 0, 0, 0, 0, 0];
  const max = Math.max(...values, 1);
  return values.map((h) => ({ h: Math.max(6, Math.round((h / max) * 100)) + '%', color }));
}

export function Reports() {
  const { state, actions } = useApp();
  const r = state.reports;
  const rangeLabel = r?.rangeLabel || RANGES.find((x) => x.key === state.reportRange)?.label || 'This month';

  const reportCards = [
    { label: 'Revenue', value: r?.revenue.amountFormatted || '₹0', sub: rangeLabel + ' · paid', bars: bars(r?.revenue.series, '#1c3b2c') },
    { label: 'New members', value: '+' + (r?.newMembers.count ?? 0), sub: 'Joined ' + rangeLabel.toLowerCase(), bars: bars(r?.newMembers.series, '#2e5a41') },
    { label: 'Active subscriptions', value: String(r?.activeSubscriptions.count ?? 0), sub: (r?.activeSubscriptions.renewalsDue ?? 0) + ' due to renew', bars: bars(r?.activeSubscriptions.series, '#d9b45f') },
    { label: 'Payments collected', value: String(r?.paymentsCollected.count ?? 0), sub: (r?.paymentsCollected.outstanding ?? 0) + ' outstanding', bars: bars(r?.paymentsCollected.series, '#2e5a41') },
    { label: 'Deliveries', value: String(r?.deliveries.delivered ?? 0), sub: (r?.deliveries.failed ?? 0) + ' failed', bars: bars(r?.deliveries.series, '#1c3b2c') },
    { label: 'Plot utilization', value: (r?.plotUtilization.percent ?? 0) + '%', sub: (r?.plotUtilization.available ?? 0) + ' available', bars: bars(r?.plotUtilization.series, '#d9b45f') },
  ];

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RANGES.map((item) => (
            <button key={item.key} onClick={() => actions.setReportRange(item.key)} style={chipStyle(state.reportRange === item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <button onClick={actions.exportReport} className="ch-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 3, fontSize: 13.5, fontWeight: 600 }}>
          Export CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {reportCards.map((card) => (
          <div key={card.label} style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: '20px 22px' }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.06em', color: '#9aa08d', textTransform: 'uppercase' }}>{card.label}</div>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 30, color: '#1c3b2c', marginTop: 8, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: 12.5, color: '#6f7566', marginTop: 6 }}>{card.sub}</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 4, alignItems: 'flex-end', height: 44 }}>
              {card.bars.map((b, i) => (
                <div key={i} style={{ flex: 1, background: b.color, height: b.h, borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
