import { useApp } from '../store/AppContext';
import { chipStyle } from '../lib/buttons';
import { Icon, type IconName } from '../lib/icons';

const AUDIENCES: { key: string; label: string }[] = [
  { key: 'all_members', label: 'All members' },
  { key: 'active_subscribers', label: 'Active subscribers' },
  { key: 'pending_payments', label: 'Pending payments' },
  { key: 'renewal_due', label: 'Renewal due' },
  { key: 'individual', label: 'Individual member' },
];
const CHANNELS: { key: string; label: string }[] = [
  { key: 'push', label: 'Push' },
  { key: 'sms', label: 'SMS' },
  { key: 'email', label: 'Email' },
];

export function Notifications() {
  const { state, actions } = useApp();
  const n = state.notif;
  const audLabel = AUDIENCES.find((a) => a.key === n.aud)?.label || n.aud;
  const chLabel = CHANNELS.find((c) => c.key === n.channel)?.label || n.channel;
  const individualName = n.memberId ? state.members.find((m) => m.id === n.memberId)?.name : null;

  return (
    <div className="ch-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 21, color: '#1c3b2c', margin: '0 0 16px' }}>Compose notification</h3>

        <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Template</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '8px 0 16px' }}>
          {state.notifTemplates.map((t) => (
            <button
              key={t.key}
              onClick={() => actions.chooseTemplate(t.title, t.body)}
              style={{ background: '#faf8f2', border: '1px solid #d8cfb8', color: '#4b5142', padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {t.title}
            </button>
          ))}
          {state.notifTemplates.length === 0 && <span style={{ fontSize: 13, color: '#9aa08d' }}>No templates loaded.</span>}
        </div>

        <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Audience</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, margin: '8px 0 16px' }}>
          {AUDIENCES.map((a) => (
            <button key={a.key} onClick={() => actions.chooseAudience(a.key)} style={{ ...chipStyle(n.aud === a.key), padding: '7px 12px', fontSize: 12 }}>
              {a.label}
            </button>
          ))}
        </div>

        {n.aud === 'individual' && (
          <div style={{ margin: '0 0 16px' }}>
            <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Member</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
              {state.members.map((m) => (
                <button key={m.id} onClick={() => actions.setNotifMember(m.id)} style={chipStyle(n.memberId === m.id)}>
                  {m.name}
                </button>
              ))}
              {state.members.length === 0 && <span style={{ fontSize: 13, color: '#9aa08d' }}>No members to message.</span>}
            </div>
          </div>
        )}

        <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Channel</label>
        <div style={{ display: 'flex', gap: 7, margin: '8px 0 16px' }}>
          {CHANNELS.map((c) => (
            <button key={c.key} onClick={() => actions.chooseChannel(c.key)} style={{ ...chipStyle(n.channel === c.key), padding: '8px 16px' }}>
              {c.label}
            </button>
          ))}
        </div>

        <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Title</label>
        <input
          value={n.title}
          onChange={(e) => actions.setNotifTitle(e.target.value)}
          placeholder="e.g. Out for delivery"
          style={{ width: '100%', margin: '6px 0 14px', padding: '12px 14px', border: '1px solid #d8cfb8', borderRadius: 3, fontSize: 14, background: '#faf8f2' }}
        />

        <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Message</label>
        <textarea
          value={n.body}
          onChange={(e) => actions.setNotifBody(e.target.value)}
          rows={3}
          placeholder="Write a short update…"
          style={{ width: '100%', margin: '6px 0 18px', padding: '12px 14px', border: '1px solid #d8cfb8', borderRadius: 3, fontSize: 14, background: '#faf8f2', resize: 'vertical' }}
        />

        <button onClick={actions.sendNotif2} className="ch-btn-primary" style={{ width: '100%', padding: 14, borderRadius: 2, fontWeight: 600, fontSize: 15 }}>
          Send {chLabel} to {individualName || audLabel}
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 21, color: '#1c3b2c', margin: '0 0 12px' }}>Recently sent</h3>
        {state.sent.map((x, i) => (
          <div key={i} style={{ display: 'flex', gap: 13, padding: '13px 0', borderTop: '1px solid #efe9db' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#eef2e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
              <Icon name={(x.icon as IconName) || 'bell'} color="#2e5a41" size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1c3b2c' }}>{x.title}</div>
              <div style={{ fontSize: 12.5, color: '#6f7566', marginTop: 1 }}>{x.body}</div>
              <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 4 }}>{x.channel} · {x.aud} · {x.time}</div>
            </div>
          </div>
        ))}
        {state.sent.length === 0 && <div style={{ padding: '18px 0', textAlign: 'center', fontSize: 14, color: '#9aa08d' }}>No notifications sent yet.</div>}
      </div>
    </div>
  );
}
