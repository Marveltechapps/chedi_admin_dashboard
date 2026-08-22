import { useApp } from '../store/AppContext';
import { Icon, type IconName } from '../lib/icons';

function iconFor(action: string): IconName {
  if (action.includes('Payment') || action.includes('Refund')) return 'card';
  if (action.includes('Subscription') || action.includes('Plan')) return 'refresh';
  if (action.includes('Plot')) return 'pin';
  if (action.includes('Crop') || action.includes('Basket') || action.includes('Supplement')) return 'sprout';
  if (action.includes('Delivery') || action.includes('Cancellation')) return 'truck';
  if (action.includes('Member')) return 'users';
  if (action.includes('Ticket')) return 'life';
  return 'check';
}

export function Audit() {
  const { state } = useApp();
  const me = state.team.find((t) => t.id === state.me);

  return (
    <div className="ch-fade" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #efe9db', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase' }}>
          Audit log
        </div>
        {state.audit.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 20px', borderBottom: '1px solid #efe9db' }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: '#eef2e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
              <Icon name={iconFor(a.action)} color="#2e5a41" size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: '#1c3b2c', fontWeight: 600 }}>{a.action}</div>
              <div style={{ fontSize: 12.5, color: '#6f7566' }}>{a.detail}</div>
              <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 2, fontFamily: "'Space Mono',monospace" }}>{a.entity || '—'} · {a.actor} · {a.time}</div>
            </div>
          </div>
        ))}
        {state.audit.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No audit entries yet.</div>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22 }}>
        <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 19, color: '#1c3b2c', margin: '0 0 4px' }}>Roles & access</h3>
        <p style={{ fontSize: 12.5, color: '#9aa08d', margin: '0 0 14px' }}>
          {me ? `Signed in as ${me.name}` : 'Staff directory'}
        </p>
        {state.team.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 0', borderTop: '1px solid #efe9db' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1c3b2c', color: '#d9b45f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: 15 }}>
              {t.initial}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1c3b2c' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#6f7566' }}>{t.scope || ''}</div>
            </div>
            <span style={{ background: '#eef2e9', border: '1px solid #dbe0d1', color: '#2e5a41', padding: '5px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>{t.roleLabel || t.role}</span>
          </div>
        ))}
        {state.team.length === 0 && <div style={{ padding: '12px 0', fontSize: 13, color: '#9aa08d' }}>No staff loaded.</div>}
      </div>
    </div>
  );
}
