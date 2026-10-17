import type { CSSProperties } from 'react';
import { useApp } from '../store/AppContext';
import { Icon, type IconName } from '../lib/icons';
import type { TabKey } from '../types';

const KIND_ICON: Record<string, IconName> = {
  collect_payment: 'card',
  review_cancellation: 'alert',
  renewal_due: 'refresh',
  open_ticket: 'life',
};

export function Dashboard() {
  const { state, actions } = useApp();
  const k = state.dashboard?.kpis;
  const pendingActions = state.dashboard?.pendingActions || [];
  const activity = state.dashboard?.recentActivity || [];

  const kpis: { label: string; value: string; sub: string; subColor: string; svg: IconName; tab: TabKey }[] = [
    { label: 'Total members', value: String(k?.totalMembers ?? 0), sub: (k?.activeMembers ?? 0) + ' active', subColor: '#6f7566', svg: 'users', tab: 'members' },
    { label: 'Pending payments', value: String(k?.pendingPayments ?? 0), sub: k?.pendingPaymentsAmountFormatted || '₹0', subColor: '#a9781f', svg: 'card', tab: 'payments' },
    { label: 'Active subscriptions', value: String(k?.activeSubscriptions ?? 0), sub: (k?.renewalsDue ?? 0) + ' renewal due', subColor: k?.renewalsDue ? '#a9781f' : '#6f7566', svg: 'refresh', tab: 'subs' },
    { label: 'Plots leased', value: (k?.plotsLeased ?? 0) + '/' + (k?.plotsTotal ?? 0), sub: (k?.plotsAvailable ?? 0) + ' available', subColor: '#6f7566', svg: 'pin', tab: 'plots' },
    { label: 'Upcoming deliveries', value: String(k?.upcomingDeliveries ?? 0), sub: 'This week', subColor: '#6f7566', svg: 'truck', tab: 'deliveries' },
    { label: 'Revenue collected', value: k?.revenueCollectedFormatted || '₹0', sub: 'All-time', subColor: '#2e5a41', svg: 'chart', tab: 'reports' },
    { label: 'Renewals due', value: String(k?.renewalsDue ?? 0), sub: 'Next 30 days', subColor: k?.renewalsDue ? '#a9781f' : '#6f7566', svg: 'refresh', tab: 'subs' },
    { label: 'Pending actions', value: String(k?.pendingActionCount ?? pendingActions.length), sub: 'Need attention', subColor: pendingActions.length ? '#a9781f' : '#6f7566', svg: 'alert', tab: 'dashboard' },
  ];

  const cardStyle: CSSProperties = { background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: '18px 20px', cursor: 'pointer' };

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => actions.go('plots')}
          className="ch-btn-primary"
          style={{ padding: '11px 18px', borderRadius: 3, fontSize: 14, fontWeight: 600 }}
        >
          Plots & Farm
        </button>
        <button
          onClick={() => actions.go('crops')}
          className="ch-btn-primary"
          style={{ padding: '11px 18px', borderRadius: 3, fontSize: 14, fontWeight: 600 }}
        >
          Crops & Harvest
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {kpis.map((item) => (
          <div key={item.label} onClick={() => actions.go(item.tab)} className="ch-card-hover" style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.06em', color: '#9aa08d', textTransform: 'uppercase' }}>{item.label}</span>
              <span style={{ width: 30, height: 30, borderRadius: 7, background: '#eef2e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={item.svg} color="#2e5a41" size={16} />
              </span>
            </div>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 32, color: '#1c3b2c', marginTop: 10, lineHeight: 1 }}>{item.value}</div>
            <div style={{ fontSize: 12, color: item.subColor, marginTop: 6 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 20, color: '#1c3b2c', margin: 0 }}>Pending actions</h3>
            <span style={{ fontSize: 12, color: '#9aa08d' }}>{pendingActions.length} need attention</span>
          </div>
          {pendingActions.slice(0, 5).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderTop: '1px solid #efe9db' }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: a.severity === 'overdue' ? '#f9e6df' : '#fdf3dc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={KIND_ICON[a.kind] || 'alert'} color="#2e5a41" size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: '#1c3b2c', fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: '#6f7566' }}>{a.description}</div>
              </div>
              <button onClick={() => actions.handlePending(a.href)} className="ch-btn-primary" style={{ padding: '9px 14px', borderRadius: 3, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {a.cta}
              </button>
            </div>
          ))}
          {pendingActions.length === 0 && <div style={{ padding: '22px 0', textAlign: 'center', fontSize: 14, color: '#9aa08d' }}>All clear — nothing waiting.</div>}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22 }}>
          <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 20, color: '#1c3b2c', margin: '0 0 8px' }}>Recent activity</h3>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: '1px solid #efe9db' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef2e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                <Icon name="check" color="#2e5a41" size={14} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#3a4033', lineHeight: 1.4 }}>{a.action}{a.detail ? ' — ' + a.detail : ''}</div>
                <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 2 }}>{a.actor} · {a.time}</div>
              </div>
            </div>
          ))}
          {activity.length === 0 && <div style={{ padding: '22px 0', textAlign: 'center', fontSize: 14, color: '#9aa08d' }}>No activity yet.</div>}
        </div>
      </div>
    </div>
  );
}
