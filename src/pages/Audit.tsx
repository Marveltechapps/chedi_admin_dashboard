import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Icon, type IconName } from '../lib/icons';
import { actionBtnStyle, chipStyle } from '../lib/buttons';
import type { TeamMember } from '../types';

const ROLES: { key: string; label: string }[] = [
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'farm_manager', label: 'Farm Manager' },
  { key: 'billing_manager', label: 'Billing Manager' },
  { key: 'delivery_manager', label: 'Delivery Manager' },
  { key: 'support_agent', label: 'Support Agent' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type StaffForm = {
  id: string | null;
  name: string;
  email: string;
  role: string;
  password: string;
};

const EMPTY_FORM: StaffForm = { id: null, name: '', email: '', role: 'support_agent', password: '' };

function iconFor(action: string): IconName {
  if (action.includes('Staff')) return 'shield';
  if (action.includes('Payment') || action.includes('Refund')) return 'card';
  if (action.includes('Subscription') || action.includes('Plan')) return 'refresh';
  if (action.includes('Plot')) return 'pin';
  if (action.includes('Crop') || action.includes('Basket') || action.includes('Supplement')) return 'sprout';
  if (action.includes('Delivery') || action.includes('Cancellation')) return 'truck';
  if (action.includes('Member')) return 'users';
  if (action.includes('Ticket')) return 'life';
  return 'check';
}

const fieldStyle = {
  width: '100%',
  marginTop: 6,
  padding: '11px 12px',
  border: '1px solid #d8cfb8',
  borderRadius: 3,
  fontSize: 14,
  background: '#faf8f2',
} as const;

export function Audit() {
  const { state, actions } = useApp();
  const me = state.team.find((t) => t.id === state.me);
  const canManage = me?.roleKey === 'super_admin';
  const [form, setForm] = useState<StaffForm | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const team = state.team
    .filter((t) => t.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));

  const startCreate = () => {
    setPendingRemove(null);
    setForm({ ...EMPTY_FORM });
  };

  const startEdit = (member: TeamMember) => {
    setPendingRemove(null);
    setForm({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.roleKey || 'support_agent',
      password: '',
    });
  };

  const submit = async () => {
    if (!form) return;
    const name = form.name.trim();
    const email = form.email.trim();
    if (name.length < 2) {
      actions.flash('Enter a name');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      actions.flash('Enter a valid email address');
      return;
    }
    if (!form.id && form.password.length < 8) {
      actions.flash('Password must be at least 8 characters');
      return;
    }
    if (form.id && form.password && form.password.length < 8) {
      actions.flash('Password must be at least 8 characters');
      return;
    }
    const ok = await actions.saveStaff({
      id: form.id || undefined,
      name,
      email,
      role: form.role,
      password: form.password || undefined,
    });
    if (ok) setForm(null);
  };

  const confirmRemove = async (id: string) => {
    const ok = await actions.removeStaff(id);
    if (ok) {
      setPendingRemove(null);
      if (form?.id === id) setForm(null);
    }
  };

  return (
    <div className="ch-fade" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, alignItems: 'start' }}>
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 19, color: '#1c3b2c', margin: '0 0 4px' }}>Roles & access</h3>
            <p style={{ fontSize: 12.5, color: '#9aa08d', margin: 0 }}>
              {me ? `Signed in as ${me.name}` : 'Staff directory'}
            </p>
          </div>
          {canManage && !form && (
            <button onClick={startCreate} className="ch-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 3, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <Icon name="plus" color="#f6f3ea" size={14} />
              Add staff
            </button>
          )}
        </div>

        {canManage && form && (
          <div style={{ marginTop: 16, padding: 14, background: '#faf8f2', border: '1px solid #e4ded0', borderRadius: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1c3b2c', marginBottom: 10 }}>
              {form.id ? 'Edit staff' : 'New staff'}
            </div>
            <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" style={fieldStyle} />
            <label style={{ display: 'block', marginTop: 12, fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" autoComplete="off" placeholder="name@chedi.in" style={fieldStyle} />
            <label style={{ display: 'block', marginTop: 12, fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
              {form.id ? 'New password' : 'Password'}
            </label>
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              autoComplete="new-password"
              placeholder={form.id ? 'Leave blank to keep the current password' : 'At least 8 characters'}
              style={fieldStyle}
            />
            <div style={{ marginTop: 12, fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>Role</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {ROLES.map((role) => (
                <button key={role.key} type="button" onClick={() => setForm({ ...form, role: role.key })} style={{ ...chipStyle(form.role === role.key), padding: '6px 10px', fontSize: 12 }}>
                  {role.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="button" onClick={submit} disabled={state.busy} className="ch-btn-primary" style={{ padding: '8px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
                {form.id ? 'Save changes' : 'Create staff'}
              </button>
              <button type="button" onClick={() => setForm(null)} style={actionBtnStyle()}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          {team.map((t) => {
            const isSelf = t.id === state.me;
            return (
              <div key={t.id} style={{ padding: '12px 0', borderTop: '1px solid #efe9db' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1c3b2c', color: '#d9b45f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontWeight: 600, fontSize: 15, flex: '0 0 auto' }}>
                    {t.initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1c3b2c' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#6f7566', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.email || t.scope || ''}</div>
                  </div>
                  <span style={{ background: '#eef2e9', border: '1px solid #dbe0d1', color: '#2e5a41', padding: '5px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {t.roleLabel || t.role}
                  </span>
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, paddingLeft: 51, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => startEdit(t)} style={actionBtnStyle()}>Edit</button>
                    {!isSelf && pendingRemove !== t.id && (
                      <button type="button" onClick={() => { setForm(null); setPendingRemove(t.id); }} style={actionBtnStyle(false, true)}>Remove</button>
                    )}
                    {pendingRemove === t.id && (
                      <>
                        <span style={{ fontSize: 12, color: '#6f7566', alignSelf: 'center' }}>Remove this account?</span>
                        <button type="button" onClick={() => confirmRemove(t.id)} disabled={state.busy} style={actionBtnStyle(false, true)}>Confirm</button>
                        <button type="button" onClick={() => setPendingRemove(null)} style={actionBtnStyle()}>Cancel</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {team.length === 0 && <div style={{ padding: '12px 0', fontSize: 13, color: '#9aa08d' }}>No staff loaded.</div>}
        </div>
      </div>
    </div>
  );
}
