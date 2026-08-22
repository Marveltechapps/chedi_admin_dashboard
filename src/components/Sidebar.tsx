import { useApp } from '../store/AppContext';
import { Icon, type IconName } from '../lib/icons';
import { canAccessTab } from '../lib/roles';
import type { TabKey } from '../types';

const NAV_ITEMS: { key: TabKey; label: string; svg: IconName }[] = [
  { key: 'dashboard', label: 'Dashboard', svg: 'grid' },
  { key: 'members', label: 'Members', svg: 'users' },
  { key: 'payments', label: 'Payments', svg: 'card' },
  { key: 'subs', label: 'Subscriptions', svg: 'refresh' },
  { key: 'plots', label: 'Plots & Farm', svg: 'pin' },
  { key: 'crops', label: 'Crops & Harvest', svg: 'sprout' },
  { key: 'basket', label: 'Weekly Basket', svg: 'basket' },
  { key: 'deliveries', label: 'Deliveries', svg: 'truck' },
  { key: 'cancellations', label: 'Cancellations', svg: 'alert' },
  { key: 'notifs', label: 'Notifications', svg: 'bell' },
  { key: 'support', label: 'Support', svg: 'life' },
  { key: 'reports', label: 'Reports', svg: 'chart' },
  { key: 'audit', label: 'Audit & Roles', svg: 'shield' },
];

export function Sidebar() {
  const { state, actions } = useApp();
  const me = state.team.find((t) => t.id === state.me) || state.team[0];
  const roleKey = me?.roleKey;
  const awaiting = state.payCounts.pending ?? state.payments.filter((p) => ['pending', 'overdue', 'failed'].includes(p.status)).length;
  const pendingCancellations = state.cancellations.filter((c) => c.status === 'pending').length;
  const openTickets = state.tickets.filter((t) => t.status === 'open').length;
  const badges: Partial<Record<TabKey, number>> = { payments: awaiting, cancellations: pendingCancellations, support: openTickets };
  const items = NAV_ITEMS.filter((item) => canAccessTab(roleKey, item.key));

  return (
    <aside style={{ width: 246, flex: '0 0 246px', background: '#1c3b2c', height: '100vh', padding: '22px 14px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid #2f4c3c' }}>
        <div style={{ fontFamily: "'Newsreader',serif", fontSize: 23, fontWeight: 600, letterSpacing: '.14em', color: '#f6f3ea' }}>CHEDI</div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9.5, color: '#d9b45f', letterSpacing: '.18em', marginTop: 3 }}>ADMIN CONSOLE</div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12, overflowY: 'auto', overflowX: 'hidden' }}>
        {items.map((item) => {
          const on = state.tab === item.key;
          const badge = badges[item.key];
          return (
            <button
              key={item.key}
              onClick={() => actions.go(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
                background: on ? 'rgba(217,180,95,.16)' : 'none', border: 'none',
                color: on ? '#f6f3ea' : '#9fb096', fontSize: 13.5, fontWeight: on ? 600 : 500,
                padding: '10px 11px', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon name={item.svg} color={on ? '#f6f3ea' : '#9fb096'} size={17} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {!!badge && (
                <span
                  style={{
                    background: on ? '#d9b45f' : '#b0361f', color: on ? '#1c3b2c' : '#fff',
                    fontSize: 10.5, fontWeight: 700, minWidth: 19, height: 19, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', padding: '14px 8px 0', borderTop: '1px solid #2f4c3c' }}>
        {me && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#d9b45f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontWeight: 600, color: '#1c3b2c', fontSize: 16 }}>
              {me.initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, color: '#f6f3ea', fontWeight: 600 }}>{me.name}</div>
              <div style={{ fontSize: 11, color: '#8fa389' }}>{me.roleLabel || me.role}</div>
            </div>
          </div>
        )}
        <button onClick={actions.logout} className="ch-signout" style={{ width: '100%', marginTop: 12, padding: 9, borderRadius: 2, fontSize: 12 }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
