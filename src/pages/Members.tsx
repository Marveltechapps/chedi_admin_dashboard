import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { filterChipStyle, filterCountStyle } from '../lib/buttons';

const GROUPS: [string, string][] = [
  ['all', 'All'],
  ['active', 'Active'],
  ['pending', 'Unpaid'],
  ['suspended', 'Suspended'],
  ['renewal', 'Renewal due'],
];

export function Members() {
  const { state, actions, helpers } = useApp();
  const rows = state.members;

  return (
    <div className="ch-fade">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
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

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1.4fr 1.1fr 60px', background: '#eef2e9', padding: '13px 20px', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase', borderBottom: '1px solid #dbe0d1' }}>
          <span>Member</span><span>Location</span><span>Joined</span><span>Plot · Plan</span><span>Status</span><span></span>
        </div>
        {rows.map((m) => {
          const st = pill(m.status);
          const plotPlan = m.plotName || m.plotKey
            ? `${m.plotName || helpers.plotName(m.plotKey)} · ${m.planName || helpers.planName(m.planKey)}`
            : (m.planName || helpers.planName(m.planKey) || '—');
          return (
            <div
              key={m.id}
              onClick={() => actions.openDrawer(m.id)}
              className="ch-row-hover"
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1.4fr 1.1fr 60px', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #efe9db', fontSize: 13.5, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eef2e9', border: '1px solid #dbe0d1', color: '#2e5a41', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flex: '0 0 auto' }}>
                  {m.name[0] || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#1c3b2c' }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9aa08d' }}>{m.email || m.memberCode || m.id}</div>
                </div>
              </div>
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
