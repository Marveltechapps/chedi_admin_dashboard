import { useApp } from '../store/AppContext';
import { Icon } from '../lib/icons';
import type { TabKey } from '../types';

const TITLES: Record<TabKey, [string, (memberCount: number) => string]> = {
  dashboard: ['Dashboard', () => 'Farm Club at a glance'],
  members: ['Members', (n) => (n ? n + ' members' : 'No members yet')],
  payments: ['Payments', () => 'Payment center — requests, receipts, refunds'],
  subs: ['Subscriptions', () => 'Full lifecycle and renewals'],
  plots: ['Plots & Farm', () => 'Farms, plots, farmers and assignments'],
  crops: ['Crops & Harvest', () => 'Crop cycles, stages and shortfalls'],
  basket: ['Weekly Basket', () => 'Compose and publish the weekly basket'],
  deliveries: ['Deliveries', () => 'Delivery operations'],
  cancellations: ['Cancellations', () => 'Review member cancellation requests'],
  notifs: ['Notifications', () => 'Message the member app'],
  support: ['Support', () => 'Member tickets'],
  reports: ['Reports', () => 'Operational reports and exports'],
  audit: ['Audit & Roles', () => 'Activity log and access control'],
};

export function Topbar() {
  const { state, actions } = useApp();
  const [title, subFn] = TITLES[state.tab] || TITLES.dashboard;
  const memberCount = state.dashboard?.kpis.totalMembers ?? state.members.length;
  const subtitle = subFn(memberCount);
  const actionCount = state.dashboard?.kpis.pendingActionCount ?? 0;

  return (
    <div style={{ flex: '0 0 auto', height: 72, background: '#f6f3ea', borderBottom: '1px solid #e0d9c6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
      <div>
        <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: '#1c3b2c', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#9aa08d', marginTop: 1 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <input
            value={state.search}
            onChange={(e) => actions.onSearch(e.target.value)}
            placeholder="Search members, refs, plots"
            style={{ width: 250, padding: '10px 14px 10px 36px', border: '1px solid #d8cfb8', borderRadius: 4, fontSize: 13, background: '#faf8f2' }}
          />
          <span style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon name="search" color="#8a8f7f" size={16} />
          </span>
        </div>
        <button
          onClick={() => actions.go('dashboard')}
          style={{ position: 'relative', background: '#fff', border: '1px solid #e0d9c6', width: 40, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Icon name="bell" color="#4b5142" size={18} />
          {!!actionCount && (
            <span
              style={{
                position: 'absolute', top: -5, right: -5, background: '#b0361f', color: '#fff',
                fontSize: 10, fontWeight: 700, minWidth: 17, height: 17, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}
            >
              {actionCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
