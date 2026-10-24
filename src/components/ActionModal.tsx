import { useApp } from '../store/AppContext';
import { Icon, type IconName } from '../lib/icons';
import { chipStyle } from '../lib/buttons';
import { describeCollectionRef } from '../lib/collectionRef';
import { upcomingSaturdayIsos } from '../lib/dates';

const PAY_CONTEXTS = [
  { key: 'membership', label: 'Membership' },
  { key: 'lease', label: 'Subscription' },
  { key: 'renewal', label: 'Renewal' },
  { key: 'delivery', label: 'Delivery' },
];

export function ActionModal() {
  const { state, actions } = useApp();
  const md = state.modal;
  if (!md) return null;

  let selectOpts: { key: string; label: string; on: boolean; onClick: () => void }[] = [];
  if (md.kind === 'createPay') {
    selectOpts = state.members.map((m) => ({
      key: m.id, label: m.name, on: md.selectVal === m.id,
      onClick: () => actions.setModal({ selectVal: m.id }),
    }));
  } else if (md.kind === 'sub' && md.sub === 'changeplan') {
    selectOpts = state.plans.map((p) => ({
      key: p.key, label: p.name, on: md.selectVal === p.key,
      onClick: () => actions.setModal({ selectVal: p.key }),
    }));
  } else if (md.kind === 'assign') {
    selectOpts = (md.assignOpts || []).map((m) => ({
      key: m.id, label: m.name, on: md.selectVal === m.id,
      onClick: () => actions.setModal({ selectVal: m.id }),
    }));
  } else if (md.kind === 'supplement') {
    selectOpts = state.crops.map((c) => ({
      key: c.key, label: c.name, on: md.selectVal === c.key,
      onClick: () => actions.setModal({ selectVal: c.key }),
    }));
  }

  const contextOpts = md.kind === 'createPay'
    ? PAY_CONTEXTS.map((c) => ({
        key: c.key,
        label: c.label,
        on: md.selectVal2 === c.key,
        onClick: () => actions.setModal({ selectVal2: c.key }),
      }))
    : [];

  const hasRows = !!(md.rows && md.rows.length);
  const hasField = !!md.fieldLabel;
  const hasSelect = selectOpts.length > 0;
  const hasContext = contextOpts.length > 0;
  const takenRefs = md.kind === 'markPaid'
    ? state.payments
        .filter((p) => (p.id || p.ref) !== md.ref)
        .map((p) => p.collectionRef || '')
        .filter(Boolean)
    : [];
  const utr = md.kind === 'markPaid' ? describeCollectionRef(md.fieldVal || '', takenRefs) : null;
  const fieldMessage = md.fieldError || utr?.message || '';
  const fieldTone = md.fieldError || utr?.tone === 'error' ? 'error' : utr?.tone === 'ok' ? 'ok' : 'hint';
  const saturdayOpts = md.kind === 'delivery'
    ? upcomingSaturdayIsos().map((s) => ({
        key: s.iso,
        label: s.label,
        on: (md.fieldVal || '').slice(0, 10) === s.iso,
        onClick: () => actions.setModal({ fieldVal: s.iso, fieldError: '' }),
      }))
    : [];
  const confirmBlocked = (md.kind === 'markPaid' && (Boolean(md.fieldError) || !utr?.ok))
    || (md.kind === 'delivery' && !(md.fieldVal || '').trim());

  const runModal = () => {
    if (md.kind === 'info') return actions.closeModal();
    if (state.busy) return;
    actions.runModal();
  };

  return (
    <div
      onClick={actions.closeModal}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,24,.5)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} className="ch-fade" style={{ width: '100%', maxWidth: 470, background: '#f6f3ea', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '26px 28px 0' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: md.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={(md.icon as IconName) || 'check'} color="#2e5a41" size={22} />
          </div>
          <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 23, color: '#1c3b2c', margin: '16px 0 6px' }}>{md.title}</h3>
          <p style={{ fontSize: 14, color: '#6f7566', lineHeight: 1.5, margin: 0 }}>{md.body}</p>
        </div>

        {hasRows && (
          <div style={{ margin: '20px 28px', background: '#fff', border: '1px solid #e4ded0', borderRadius: 7, padding: '14px 18px' }}>
            {md.rows!.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13.5 }}>
                <span style={{ color: '#9aa08d' }}>{r.k}</span>
                <span style={{ color: '#3a4033', fontWeight: r.w || 400, textAlign: 'right', maxWidth: '60%' }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}

        {hasContext && (
          <div style={{ margin: '16px 28px 0' }}>
            <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>Request type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {contextOpts.map((o) => (
                <button key={o.key} onClick={o.onClick} style={chipStyle(o.on)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasField && (
          <div style={{ margin: '18px 28px 0' }}>
            <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>{md.fieldLabel}</label>
            <input
              value={md.fieldVal || ''}
              onChange={(e) => actions.onModalField(e.target.value)}
              placeholder={md.fieldPh}
              autoComplete="off"
              spellCheck={false}
              style={{ width: '100%', marginTop: 6, padding: '12px 14px', border: `1px solid ${fieldTone === 'error' ? '#b0361f' : fieldTone === 'ok' ? '#2e5a41' : '#d8cfb8'}`, borderRadius: 3, fontSize: 14, background: '#faf8f2', fontFamily: md.kind === 'markPaid' ? "'Space Mono',monospace" : 'inherit' }}
            />
            {fieldMessage && (
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.4, color: fieldTone === 'error' ? '#b0361f' : fieldTone === 'ok' ? '#2e5a41' : '#6f7566', fontWeight: fieldTone === 'ok' ? 600 : 400 }}>{fieldMessage}</div>
            )}
          </div>
        )}

        {saturdayOpts.length > 0 && (
          <div style={{ margin: '16px 28px 0' }}>
            <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>{md.selectLabel || 'New Saturday'}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {saturdayOpts.map((o) => (
                <button key={o.key} type="button" onClick={o.onClick} style={chipStyle(o.on)}>
                  {o.label}
                </button>
              ))}
            </div>
            {md.fieldError && (
              <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.4, color: '#b0361f' }}>{md.fieldError}</div>
            )}
          </div>
        )}

        {hasSelect && (
          <div style={{ margin: '16px 28px 0' }}>
            <label style={{ fontSize: 13, color: '#6f7566', fontWeight: 600 }}>{md.selectLabel}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {selectOpts.map((o) => (
                <button key={o.key} onClick={o.onClick} style={chipStyle(o.on)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, padding: '22px 28px 28px' }}>
          <button onClick={actions.closeModal} className="ch-btn-outline" style={{ flex: 1, padding: 13, borderRadius: 2, fontWeight: 600, fontSize: 15 }}>
            Cancel
          </button>
          <button
            onClick={runModal}
            disabled={state.busy || confirmBlocked}
            style={{ flex: 1.4, background: md.confirmBg, color: md.confirmColor, border: 'none', padding: 13, borderRadius: 2, fontWeight: 600, fontSize: 15, cursor: state.busy || confirmBlocked ? 'not-allowed' : 'pointer', opacity: state.busy || confirmBlocked ? 0.55 : 1 }}
          >
            {state.busy ? 'Working…' : md.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
