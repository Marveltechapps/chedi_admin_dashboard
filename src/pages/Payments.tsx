import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { fmt } from '../lib/format';
import { filterChipStyle, filterCountStyle, actionBtnStyle } from '../lib/buttons';
import { Icon } from '../lib/icons';

const GROUPS: [string, string][] = [
  ['all', 'All'],
  ['pending', 'Pending'],
  ['overdue', 'Overdue'],
  ['paid', 'Paid'],
  ['failed', 'Failed'],
];

const TYPE_LABEL: Record<string, string> = { membership: 'MEMBERSHIP', subscription: 'SUBSCRIPTION', renewal: 'RENEWAL', delivery: 'DELIVERY' };
const STATUS_LABEL: Record<string, string> = { pending: 'Pending', overdue: 'Overdue', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', cancelled: 'Cancelled' };

export function Payments() {
  const { state, actions } = useApp();
  const rows = state.payments;

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GROUPS.map(([k, label]) => {
            const on = state.payFilter === k;
            const count = state.payCounts[k] ?? 0;
            return (
              <button key={k} onClick={() => actions.setPayFilter(k)} style={filterChipStyle(on)}>
                {label}
                <span style={filterCountStyle(on)}>{count}</span>
              </button>
            );
          })}
        </div>
        <button onClick={actions.openCreatePay} className="ch-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 3, fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <Icon name="plus" color="#f6f3ea" size={15} />
          Create request
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.9fr 0.9fr 0.9fr 1fr 150px', background: '#eef2e9', padding: '13px 20px', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase', borderBottom: '1px solid #dbe0d1' }}>
          <span>Member</span><span>Description</span><span>Amount</span><span>Date</span><span>Status</span><span></span>
        </div>
        {rows.map((p) => {
          const st = pill(p.status);
          const label = STATUS_LABEL[p.status] || st.label;
          return (
            <div key={p.id || p.ref} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.9fr 0.9fr 0.9fr 1fr 150px', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #efe9db', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1c3b2c' }}>{p.memberName || '—'}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#9aa08d', marginTop: 2 }}>{TYPE_LABEL[p.type] || p.type}</div>
              </div>
              <div style={{ color: '#4b5142' }}>
                {p.desc}
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#b5b09c', marginTop: 2 }}>{p.ref}</div>
              </div>
              <div style={{ fontWeight: 700, color: '#1c3b2c' }}>{fmt(p.amount)}</div>
              <div style={{ color: '#6f7566' }}>{p.date}</div>
              <div><span style={st.style}>{label}</span></div>
              <div style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {['pending', 'overdue', 'failed'].includes(p.status) && (
                  <>
                    <button onClick={() => actions.markPaid(p.id || p.ref)} style={actionBtnStyle(true)}>Mark paid</button>
                    <button onClick={() => actions.payReminder(p.id || p.ref)} style={actionBtnStyle()}>Remind</button>
                  </>
                )}
                {p.status === 'paid' && (
                  <button onClick={() => actions.showReceipt(p.id || p.ref)} style={actionBtnStyle()}>Receipt</button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No payments in this view.</div>}
      </div>
    </div>
  );
}
