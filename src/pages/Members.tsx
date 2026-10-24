import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { actionBtnStyle, filterChipStyle, filterCountStyle } from '../lib/buttons';
import { Icon } from '../lib/icons';
import { canWriteMembers } from '../lib/roles';

const GROUPS: [string, string][] = [
  ['all', 'All'],
  ['active', 'Active'],
  ['pending', 'Unpaid'],
  ['suspended', 'Suspended'],
  ['renewal', 'Renewal due'],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COLS = '1.7fr 1.05fr 1fr 0.85fr 1.35fr 1fr 52px';

type MemberForm = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
};

const EMPTY_FORM: MemberForm = { userId: '', name: '', email: '', phone: '', address: '', city: '', pin: '' };

const fieldStyle = {
  width: '100%',
  marginTop: 6,
  padding: '11px 12px',
  border: '1px solid #d8cfb8',
  borderRadius: 3,
  fontSize: 14,
  background: '#fff',
} as const;

export function Members() {
  const { state, actions, helpers } = useApp();
  const rows = state.members;
  const me = state.team.find((t) => t.id === state.me);
  const canWrite = canWriteMembers(me?.roleKey);
  const [lookup, setLookup] = useState('');
  const [form, setForm] = useState<MemberForm | null>(null);

  const openById = () => {
    const id = lookup.trim();
    if (!id) {
      actions.flash('Enter a user ID');
      return;
    }
    actions.openDrawer(id);
  };

  const submit = async () => {
    if (!form) return;
    if (form.name.trim().length < 2) {
      actions.flash('Enter a name');
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      actions.flash('Enter a valid email address');
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      actions.flash('Enter a valid mobile number');
      return;
    }
    if (!form.address.trim() || !form.city.trim()) {
      actions.flash('Enter the delivery address and city');
      return;
    }
    if (!/^\d{6}$/.test(form.pin.trim())) {
      actions.flash('PIN must be 6 digits');
      return;
    }
    const ok = await actions.saveMember({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      pin: form.pin,
      userId: form.userId,
    });
    if (ok) setForm(null);
  };

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GROUPS.map(([k, label]) => {
            const on = state.memberFilter === k;
            const count = state.memberCounts[k] ?? 0;
            return (
              <button key={k} onClick={() => actions.setMemberFilter(k)} style={filterChipStyle(on)}>
                {label}
                <span style={filterCountStyle(on)}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openById();
            }}
            placeholder="User ID"
            style={{ width: 150, padding: '10px 12px', border: '1px solid #d8cfb8', borderRadius: 4, fontSize: 13, background: '#faf8f2' }}
          />
          <button type="button" onClick={openById} style={actionBtnStyle()}>Open</button>
          {canWrite && !form && (
            <button type="button" onClick={() => setForm({ ...EMPTY_FORM })} className="ch-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
              <Icon name="plus" color="#f6f3ea" size={14} />
              Add member
            </button>
          )}
        </div>
      </div>

      {form && (
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#1c3b2c', marginBottom: 4 }}>New member</div>
          <p style={{ fontSize: 12.5, color: '#9aa08d', margin: '0 0 14px' }}>Leave user ID blank to assign the next one, such as CHEDI-0501.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
              User ID
              <input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="Optional" style={fieldStyle} />
            </label>
            <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
              Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" style={fieldStyle} />
            </label>
            <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="name@email.com" style={fieldStyle} />
            </label>
            <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
              Mobile
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" style={fieldStyle} />
            </label>
            <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
              City
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Chennai" style={fieldStyle} />
            </label>
            <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
              PIN
              <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="600001" inputMode="numeric" style={fieldStyle} />
            </label>
          </div>
          <label style={{ display: 'block', marginTop: 12, fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
            Delivery address
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, area" style={fieldStyle} />
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="button" onClick={submit} disabled={state.busy} className="ch-btn-primary" style={{ padding: '9px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
              Create member
            </button>
            <button type="button" onClick={() => setForm(null)} style={actionBtnStyle()}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, background: '#eef2e9', padding: '13px 20px', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase', borderBottom: '1px solid #dbe0d1' }}>
          <span>Member</span><span>User ID</span><span>Location</span><span>Joined</span><span>Plot · Plan</span><span>Status</span><span></span>
        </div>
        {rows.map((m) => {
          const leasePays = state.payments.filter(
            (p) => p.memberId === m.id && p.context === 'lease' && (p.plotKey || p.planKey)
          );
          const pendingLease = leasePays.find((p) => ['pending', 'overdue'].includes(p.status));
          const leasePay = pendingLease || (!m.planKey ? leasePays.find((p) => p.status === 'paid') : undefined);
          const st = pill(
            pendingLease && (!m.subStatus || ['none', 'active'].includes(m.subStatus))
              ? 'payment_pending'
              : m.subStatus && !['none', 'active'].includes(m.subStatus)
                ? m.subStatus
                : m.status
          );
          const plotKey = m.plotKey || leasePay?.plotKey;
          const planKey = m.planKey || leasePay?.planKey;
          const plotPlan = plotKey || planKey
            ? `${m.plotName || helpers.plotName(plotKey) || 'Plot'} · ${m.planName || helpers.planName(planKey) || 'Plan'}`
            : '—';
          return (
            <div
              key={m.id}
              onClick={() => actions.openDrawer(m.id)}
              className="ch-row-hover"
              style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #efe9db', fontSize: 13.5, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2e9', border: '1px solid #dbe0d1', color: '#2e5a41', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flex: '0 0 auto' }}>
                  {m.name[0] || '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#1c3b2c' }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9aa08d', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email || '—'}</div>
                </div>
              </div>
              <div style={{ color: '#1c3b2c', fontFamily: "'Space Mono',monospace", fontSize: 12 }}>{m.memberCode || m.id}</div>
              <div style={{ color: '#4b5142' }}>{m.city || '—'}</div>
              <div style={{ color: '#6f7566' }}>{m.joined || '—'}</div>
              <div style={{ color: '#4b5142' }}>{plotPlan}</div>
              <div><span style={st.style}>{st.label}</span></div>
              <div style={{ textAlign: 'right', color: '#b98a2e', fontSize: 12.5, fontWeight: 600 }}>View</div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No members match.</div>}
      </div>
    </div>
  );
}
