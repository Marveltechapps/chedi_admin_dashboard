import { useApp } from '../store/AppContext';
import { pill, sPill } from '../lib/pill';
import { filterChipStyle, filterCountStyle } from '../lib/buttons';

const GROUPS: [string, string][] = [
  ['all', 'All plots'],
  ['available', 'Available'],
  ['cultivating', 'In cultivation'],
  ['reserved', 'Reserved'],
  ['maintenance', 'Maintenance'],
];

export function Plots() {
  const { state, actions } = useApp();
  const plotCards = state.plots;

  return (
    <div className="ch-fade">
      {state.farms.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
          {state.farms.map((f) => (
            <div key={f.id} style={{ background: '#1c3b2c', borderRadius: 8, padding: '18px 20px', color: '#f6f3ea' }}>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 19 }}>{f.name}</div>
              <div style={{ fontSize: 12.5, color: '#a8b8a0', marginTop: 2 }}>{f.region}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12.5 }}>
                <div>
                  <div style={{ color: '#d9b45f', fontFamily: "'Space Mono',monospace", fontSize: 18 }}>{f.plotCount ?? 0}</div>
                  <div style={{ color: '#8fa389' }}>plots</div>
                </div>
                <div>
                  <div style={{ color: '#d9b45f', fontFamily: "'Space Mono',monospace", fontSize: 18 }}>{f.leasedCount ?? 0}</div>
                  <div style={{ color: '#8fa389' }}>leased</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ color: '#8fa389' }}>Farmer</div>
                  <div style={{ color: '#f6f3ea', fontWeight: 600 }}>{f.farmer}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GROUPS.map(([k, label]) => {
            const on = state.plotFilter === k;
            const count = state.plotCounts[k] ?? 0;
            return (
              <button key={k} onClick={() => actions.setPlotFilter(k)} style={filterChipStyle(on)}>
                {label}
                <span style={filterCountStyle(on)}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {plotCards.map((p) => {
          const pil = pill(p.status);
          const stage = sPill(p.stage);
          const pillStyle = { ...pil.style, fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: '.04em', borderRadius: 3, padding: '3px 8px' };
          return (
            <div key={p.key} style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: 88, background: 'repeating-linear-gradient(45deg,#dbe1d1,#dbe1d1 10px,#e6ebdd 10px,#e6ebdd 20px)', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 10 }}>
                <span style={pillStyle}>{pil.label}</span>
                {p.cropKey && (
                  <span style={{ background: 'rgba(255,255,255,.85)', color: '#2e5a41', border: '1px solid #c3dcb8', fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 3 }}>
                    {stage.label}
                  </span>
                )}
              </div>
              <div style={{ padding: '15px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#1c3b2c' }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: '#9aa08d' }}>{p.size}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6f7566', marginTop: 2 }}>{p.region || ''}</div>
                <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid #efe9db', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9aa08d' }}>Member</span><span style={{ color: '#3a4033' }}>{p.memberName || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9aa08d' }}>Crop</span><span style={{ color: '#3a4033' }}>{p.cropName || '—'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9aa08d' }}>Farmer</span><span style={{ color: '#3a4033' }}>{p.farmerName || '—'}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 7, marginTop: 13 }}>
                  <button onClick={() => actions.plotDetail(p.key)} className="ch-btn-outline" style={{ flex: 1, padding: 8, borderRadius: 3, fontSize: 12.5, fontWeight: 600 }}>Details</button>
                  {p.status === 'available' && (
                    <button onClick={() => actions.assignPlot(p.key)} className="ch-btn-primary" style={{ flex: 1, padding: 8, borderRadius: 3, fontSize: 12.5, fontWeight: 600 }}>Assign</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {plotCards.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>
          No plots in this view.
        </div>
      )}
    </div>
  );
}
