import { useState, type CSSProperties } from 'react';
import { useApp } from '../store/AppContext';
import { Icon } from '../lib/icons';
import { pill, sPill } from '../lib/pill';
import { actionBtnStyle, avatarBtnStyle } from '../lib/buttons';
import { fmt } from '../lib/format';
import { formatCollectionRef } from '../lib/collectionRef';
import { canWriteMembers } from '../lib/roles';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fieldStyle = {
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  border: '1px solid #d8cfb8',
  borderRadius: 3,
  fontSize: 14,
  background: '#faf8f2',
} as const;

type DrawerTab = 'profile' | 'payments' | 'deliveries' | 'timeline';

export function MemberDrawer() {
  const { state, actions, helpers } = useApp();
  const m = helpers.member(state.drawerId);
  const me = state.team.find((t) => t.id === state.me);
  const canWrite = canWriteMembers(me?.roleKey);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', phone: '', address: '', city: '', pin: '' });
  if (!m) return null;

  const startEdit = () => {
    setConfirmDelete(false);
    setDraft({
      name: m.name,
      email: m.email,
      phone: m.phone,
      address: m.addressLine || '',
      city: m.city || '',
      pin: m.pin || '',
    });
    setEditing(true);
    actions.setDrawerTab('profile');
  };

  const saveEdit = async () => {
    if (draft.name.trim().length < 2) {
      actions.flash('Enter a name');
      return;
    }
    if (!EMAIL_RE.test(draft.email.trim())) {
      actions.flash('Enter a valid email address');
      return;
    }
    if (draft.phone.replace(/\D/g, '').length < 10) {
      actions.flash('Enter a valid mobile number');
      return;
    }
    if (!draft.address.trim() || !draft.city.trim() || !/^\d{6}$/.test(draft.pin.trim())) {
      actions.flash('Enter address, city, and a 6-digit PIN');
      return;
    }
    const ok = await actions.saveMember({ id: m.id, ...draft });
    if (ok) setEditing(false);
  };

  const remove = async () => {
    const ok = await actions.deleteMember(m.id);
    if (ok) setConfirmDelete(false);
  };

  const status = pill(m.status);
  const sub = pill(m.subStatus === 'none' ? 'none' : m.subStatus);
  const subStyle: CSSProperties = {
    display: 'inline-block', background: 'rgba(246,243,234,.14)', color: '#d9b45f',
    border: '1px solid #3a5545', padding: '4px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
  };

  const drawerActions: { label: string; kind: string; danger?: boolean }[] = [];
  if (m.status === 'pending') drawerActions.push({ label: 'Activate', kind: 'activate' });
  if (m.status === 'active') drawerActions.push({ label: 'Suspend', kind: 'suspend', danger: true });
  if (m.status === 'suspended') drawerActions.push({ label: 'Reactivate', kind: 'reactivate' });
  if (m.status !== 'cancelled') drawerActions.push({ label: 'Send notification', kind: 'notify' });
  if (m.plotKey || m.status === 'pending') drawerActions.push({ label: m.plotKey ? 'Change plot' : 'Assign plot', kind: 'assignplot' });
  drawerActions.push({ label: 'Change plan', kind: 'changeplan' });
  if (m.status !== 'cancelled') drawerActions.push({ label: 'Cancel', kind: 'cancel', danger: true });

  const tabs: { key: DrawerTab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'payments', label: 'Payments' },
    { key: 'deliveries', label: 'Deliveries' },
    { key: 'timeline', label: 'Timeline' },
  ];

  const profileRows = [
    { k: 'User ID', v: m.memberCode || m.id },
    { k: 'Mobile', v: m.phone || '—' },
    { k: 'Email', v: m.email || '—' },
    { k: 'Delivery address', v: m.address || '—' },
    { k: 'City', v: m.city || '—' },
    { k: 'Joined', v: m.joined || '—' },
    { k: 'Plan', v: m.planName || helpers.planName(m.planKey) },
    { k: 'Plot', v: m.plotName || helpers.plotName(m.plotKey) },
    { k: 'Cycle', v: m.cycleStart ? m.cycleStart + ' – ' + m.cycleEnd : '—' },
  ];

  const payLbl: Record<string, string> = { pending: 'Pending', overdue: 'Overdue', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', cancelled: 'Cancelled' };
  const payments = (state.drawerPayments.length ? state.drawerPayments : state.payments.filter((p) => p.memberId === m.id)).map((p) => {
    const q = sPill(p.status);
    return { ...p, statusLabel: payLbl[p.status] || q.label, statusStyle: q.style };
  });
  const deliveries = (state.drawerDeliveries.length ? state.drawerDeliveries : state.deliveries.filter((d) => d.memberId === m.id)).map((d) => {
    const q = sPill(d.status);
    return { ...d, statusLabel: q.label, statusStyle: q.style, plotDisplay: d.plotName || helpers.plotName(d.plotKey) };
  });
  const timeline = state.drawerTimeline;

  return (
    <div onClick={actions.closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,24,.44)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="ch-slide" style={{ width: 520, maxWidth: '94vw', height: '100vh', background: '#f6f3ea', overflowY: 'auto' }}>
        <div style={{ background: '#1c3b2c', padding: '24px 26px 20px', position: 'sticky', top: 0, zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#d9b45f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontWeight: 600, color: '#1c3b2c', fontSize: 20 }}>
                {m.name[0] || '?'}
              </div>
              <div>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, color: '#f6f3ea' }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#8fa389', fontFamily: "'Space Mono',monospace" }}>{m.memberCode || m.id}</div>
              </div>
            </div>
            <button onClick={actions.closeDrawer} style={{ background: 'none', border: 'none', color: '#b6c1ac', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={status.style}>{status.label}</span>
            <span style={subStyle}>Sub: {sub.label}</span>
          </div>
        </div>

        <div style={{ padding: '20px 26px' }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
            {drawerActions.map((a) => (
              <button key={a.kind} onClick={() => actions.drawerAct(a.kind)} style={avatarBtnStyle(a.danger)}>
                {a.label}
              </button>
            ))}
            {canWrite && <button type="button" onClick={startEdit} style={avatarBtnStyle()}>Edit</button>}
            {canWrite && !confirmDelete && (
              <button type="button" onClick={() => { setEditing(false); setConfirmDelete(true); }} style={avatarBtnStyle(true)}>Delete</button>
            )}
          </div>
          {confirmDelete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '-6px 0 16px', fontSize: 13, color: '#6f7566' }}>
              Delete {m.memberCode || m.id}? This removes the account and releases any leased plot.
              <button type="button" onClick={remove} disabled={state.busy} style={actionBtnStyle(false, true)}>Confirm delete</button>
              <button type="button" onClick={() => setConfirmDelete(false)} style={actionBtnStyle()}>Cancel</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, borderBottom: '1px solid #e4ded0' }}>
            {tabs.map((t) => {
              const on = state.drawerTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => actions.setDrawerTab(t.key)}
                  style={{ background: 'none', border: 'none', borderBottom: `2px solid ${on ? '#b98a2e' : 'transparent'}`, color: on ? '#1c3b2c' : '#9aa08d', padding: '9px 12px 10px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {state.drawerTab === 'profile' && editing && (
            <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 7, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1c3b2c', marginBottom: 8 }}>Edit {m.memberCode || m.id}</div>
              <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>Name</label>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={fieldStyle} />
              <label style={{ display: 'block', marginTop: 12, fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>Email</label>
              <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} type="email" style={fieldStyle} />
              <label style={{ display: 'block', marginTop: 12, fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>Mobile</label>
              <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} style={fieldStyle} />
              <label style={{ display: 'block', marginTop: 12, fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>Delivery address</label>
              <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} style={fieldStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginTop: 12 }}>
                <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
                  City
                  <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} style={fieldStyle} />
                </label>
                <label style={{ fontSize: 12.5, color: '#6f7566', fontWeight: 600 }}>
                  PIN
                  <input value={draft.pin} onChange={(e) => setDraft({ ...draft, pin: e.target.value })} inputMode="numeric" style={fieldStyle} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button type="button" onClick={saveEdit} disabled={state.busy} className="ch-btn-primary" style={{ padding: '8px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>Save changes</button>
                <button type="button" onClick={() => setEditing(false)} style={actionBtnStyle()}>Cancel</button>
              </div>
            </div>
          )}

          {state.drawerTab === 'profile' && !editing && (
            <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 7, padding: '16px 18px' }}>
              {profileRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13.5, borderTop: i === 0 ? 'none' : '1px solid #f2ede1' }}>
                  <span style={{ color: '#9aa08d' }}>{r.k}</span>
                  <span style={{ color: '#3a4033', textAlign: 'right', maxWidth: '62%' }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {state.drawerTab === 'payments' && (
            <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 7, overflow: 'hidden' }}>
              {payments.map((p, i) => (
                <div key={p.id || p.ref} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: i === 0 ? 'none' : '1px solid #f2ede1', fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#3a4033' }}>{p.desc}</div>
                    <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 1, fontFamily: "'Space Mono',monospace" }}>{p.id || p.ref}</div>
                    {p.collectionRef && <div style={{ fontSize: 11, color: '#1c3b2c', marginTop: 1, fontFamily: "'Space Mono',monospace" }}>UTR {formatCollectionRef(p.collectionRef)}</div>}
                    <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 1 }}>{p.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#1c3b2c' }}>{fmt(p.amount)}</div>
                    <span style={p.statusStyle}>{p.statusLabel}</span>
                  </div>
                </div>
              ))}
              {payments.length === 0 && <div style={{ padding: '16px 18px', fontSize: 13, color: '#9aa08d' }}>No payments recorded.</div>}
            </div>
          )}

          {state.drawerTab === 'deliveries' && (
            <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 7, overflow: 'hidden' }}>
              {m.welcomeBasket && (() => {
                const gift = sPill(m.welcomeBasket.status);
                const received = m.welcomeBasket.status === 'received' || m.welcomeBasket.status === 'delivered';
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', fontSize: 13 }}>
                    <div>
                      <div style={{ color: '#3a4033' }}>Welcome gift · {m.welcomeBasket.description || 'Token of Love'}</div>
                      <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 1 }}>
                        {received ? 'Received' : 'In transit'}
                        {m.welcomeBasket.etaLabel ? ` · ${m.welcomeBasket.etaLabel}` : ''}
                      </div>
                    </div>
                    <span style={gift.style}>{gift.label}</span>
                  </div>
                );
              })()}
              {deliveries.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: i === 0 && !m.welcomeBasket ? 'none' : '1px solid #f2ede1', fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#3a4033' }}>{d.date} · {d.boxes}</div>
                    <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 1 }}>{d.plotDisplay}</div>
                  </div>
                  <span style={d.statusStyle}>{d.statusLabel}</span>
                </div>
              ))}
              {deliveries.length === 0 && !m.welcomeBasket && <div style={{ padding: '16px 18px', fontSize: 13, color: '#9aa08d' }}>No deliveries yet.</div>}
            </div>
          )}

          {state.drawerTab === 'timeline' && (
            <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 7, padding: '6px 18px 14px' }}>
              {timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid #f2ede1' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#eef2e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    <Icon name={t.isLeaf ? 'leaf' : 'check'} color="#2e5a41" size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#3a4033', lineHeight: 1.4 }}>{t.text}</div>
                    <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 1 }}>{t.time}</div>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && <div style={{ padding: '12px 0', fontSize: 13, color: '#9aa08d' }}>No timeline yet.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
