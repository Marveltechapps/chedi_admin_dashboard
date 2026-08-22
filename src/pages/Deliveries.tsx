import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { filterChipStyle, filterCountStyle, actionBtnStyle } from '../lib/buttons';

const GROUPS: [string, string][] = [
  ['all', 'All'],
  ['upcoming', 'Upcoming'],
  ['delivered', 'Delivered'],
  ['failed', 'Failed / cancelled'],
  ['rescheduled', 'Rescheduled'],
];

const FLOW: Record<string, string> = { scheduled: 'packed', packed: 'ready_dispatch', ready_dispatch: 'out', out: 'delivered' };
const FLOW_LABEL: Record<string, string> = { scheduled: 'Pack', packed: 'Ready', ready_dispatch: 'Dispatch', out: 'Delivered' };

export function Deliveries() {
  const { state, actions } = useApp();
  const rows = state.deliveries;

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {GROUPS.map(([k, label]) => {
          const on = state.deliveryFilter === k;
          const count = state.deliveryCounts[k] ?? 0;
          return (
            <button key={k} onClick={() => actions.setDeliveryFilter(k)} style={filterChipStyle(on)}>
              {label}
              <span style={filterCountStyle(on)}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 0.9fr 0.7fr 1.1fr 1.5fr', background: '#eef2e9', padding: '13px 20px', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase', borderBottom: '1px solid #dbe0d1' }}>
          <span>Member · Address</span><span>Plot · Basket</span><span>Date</span><span>Boxes</span><span>Status</span><span></span>
        </div>
        {rows.map((d) => {
          const q = pill(d.status);
          return (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 0.9fr 0.7fr 1.1fr 1.5fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #efe9db', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1c3b2c' }}>{d.memberName || '—'}</div>
                <div style={{ fontSize: 11.5, color: '#9aa08d' }}>{d.addressDisplay || ''}</div>
              </div>
              <div style={{ color: '#4b5142' }}>
                {d.plotName || d.plotKey || '—'}
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#b5b09c', marginTop: 1 }}>{d.basketId}</div>
              </div>
              <div style={{ color: '#6f7566' }}>{d.date}</div>
              <div style={{ color: '#4b5142' }}>{d.boxes}</div>
              <div><span style={q.style}>{q.label}</span></div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {FLOW[d.status] && <button onClick={() => actions.deliveryStep(d.id)} style={actionBtnStyle(true)}>{FLOW_LABEL[d.status]}</button>}
                {['scheduled', 'packed'].includes(d.status) && (
                  <>
                    <button onClick={() => actions.deliveryAct(d.id, 'reschedule')} style={actionBtnStyle()}>Reschedule</button>
                    <button onClick={() => actions.deliveryAct(d.id, 'cancel')} style={actionBtnStyle(false, true)}>Cancel</button>
                  </>
                )}
                {d.status === 'out' && <button onClick={() => actions.deliveryAct(d.id, 'fail')} style={actionBtnStyle(false, true)}>Failed</button>}
                {['failed', 'cancelled'].includes(d.status) && <button onClick={() => actions.deliveryAct(d.id, 'reschedule')} style={actionBtnStyle()}>Reschedule</button>}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No deliveries in this view.</div>}
      </div>
    </div>
  );
}
