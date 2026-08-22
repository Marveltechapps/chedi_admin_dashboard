import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { filterChipStyle, filterCountStyle, actionBtnStyle } from '../lib/buttons';

const GROUPS: [string, string][] = [
  ['all', 'All'],
  ['active', 'Active'],
  ['renewal_due', 'Renewal due'],
  ['payment_pending', 'Awaiting payment'],
  ['paused', 'Paused / ended'],
];

export function Subscriptions() {
  const { state, actions } = useApp();
  const rows = state.subscribers;

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {GROUPS.map(([k, label]) => {
          const on = state.subFilter === k;
          const count = state.subCounts[k] ?? 0;
          return (
            <button key={k} onClick={() => actions.setSubFilter(k)} style={filterChipStyle(on)}>
              {label}
              <span style={filterCountStyle(on)}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 1fr 1.2fr 1.1fr 1.4fr', background: '#eef2e9', padding: '13px 20px', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase', borderBottom: '1px solid #dbe0d1' }}>
          <span>Member</span><span>Plot</span><span>Plan</span><span>Cycle</span><span>Status</span><span></span>
        </div>
        {rows.map((m) => {
          const st = pill(m.subStatus);
          return (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 1fr 1.2fr 1.1fr 1.4fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #efe9db', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#1c3b2c' }}>{m.name}</div>
              <div style={{ color: '#4b5142' }}>{m.plotName || '—'}</div>
              <div style={{ color: '#4b5142' }}>{m.planName || '—'}</div>
              <div style={{ color: '#6f7566' }}>{m.cycleStart ? m.cycleStart + ' – ' + m.cycleEnd : '—'}</div>
              <div><span style={st.style}>{st.label}</span></div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {m.subStatus === 'pending_activation' && <button onClick={() => actions.subAction(m.id, 'activate')} style={actionBtnStyle(true)}>Activate</button>}
                {m.subStatus === 'active' && <button onClick={() => actions.subAction(m.id, 'pause')} style={actionBtnStyle()}>Pause</button>}
                {m.subStatus === 'paused' && <button onClick={() => actions.subAction(m.id, 'resume')} style={actionBtnStyle(true)}>Resume</button>}
                {m.subStatus === 'renewal_due' && (
                  <>
                    <button onClick={() => actions.subAction(m.id, 'renewbill')} style={actionBtnStyle(true)}>Generate bill</button>
                    <button onClick={() => actions.subAction(m.id, 'renewremind')} style={actionBtnStyle()}>Remind</button>
                  </>
                )}
                {m.subStatus === 'payment_pending' && <button onClick={() => actions.subAction(m.id, 'renewremind')} style={actionBtnStyle()}>Remind</button>}
                {!['cancelled', 'expired'].includes(m.subStatus) && <button onClick={() => actions.memberAction(m.id, 'cancel')} style={actionBtnStyle(false, true)}>Cancel</button>}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No subscriptions in this view.</div>}
      </div>
    </div>
  );
}
