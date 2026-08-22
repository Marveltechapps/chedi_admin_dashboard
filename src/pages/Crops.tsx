import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { Icon } from '../lib/icons';

export function Crops() {
  const { state, actions } = useApp();
  const rows = state.cultivations;
  const shortfalls = rows.filter((r) => r.shortfall);

  return (
    <div className="ch-fade">
      {shortfalls.map((s) => (
        <div key={s.plotKey} style={{ background: '#f9e6df', border: '1px solid #eabfb2', borderRadius: 8, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            <Icon name="alert" color="#b0361f" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#b0361f' }}>Harvest shortfall detected</div>
            <div style={{ fontSize: 13, color: '#8a4433' }}>
              {s.plotName} · {s.cropName} came in {s.actualYield}/{s.targetYield} {s.unit}. Add supplementary produce to keep baskets full.
            </div>
          </div>
          <button onClick={actions.addSupplement} className="ch-btn-primary" style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Add supplement → update basket
          </button>
        </div>
      ))}

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 1.1fr 1fr 1fr 1.3fr 1fr', background: '#eef2e9', padding: '13px 20px', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase', borderBottom: '1px solid #dbe0d1' }}>
          <span>Plot</span><span>Crop</span><span>Planted</span><span>Harvest</span><span>Stage</span><span>Yield</span><span></span>
        </div>
        {rows.map((row) => {
          const st = pill(row.cropStage);
          const yieldLabel =
            row.actualYield != null
              ? `${row.actualYield}/${row.targetYield} ${row.unit}${row.shortfall ? ' ⚠' : ''}`
              : `target ${row.targetYield} ${row.unit}`;
          return (
            <div key={row.plotKey} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 1.1fr 1fr 1fr 1.3fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #efe9db', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#1c3b2c' }}>{row.plotName}</div>
              <div style={{ color: '#4b5142' }}>{row.cropName || '—'}</div>
              <div style={{ color: '#6f7566' }}>{row.plantDate || '—'}</div>
              <div style={{ color: '#6f7566' }}>{row.harvestDate || '—'}</div>
              <div><span style={st.style}>{st.label}</span></div>
              <div style={{ color: '#4b5142' }}>{yieldLabel}</div>
              <div style={{ textAlign: 'right' }}>
                {row.canAdvance && row.nextStage && (
                  <button onClick={() => actions.advanceStage(row.plotKey)} className="ch-btn-outline" style={{ padding: '7px 11px', borderRadius: 3, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    → {pill(row.nextStage).label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No cultivations yet.</div>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22, marginTop: 16 }}>
        <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 19, color: '#1c3b2c', margin: '0 0 14px' }}>Crop library</h3>
        {state.crops.length === 0 && <div style={{ fontSize: 14, color: '#9aa08d' }}>No crops in the library.</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {state.crops.map((c) => (
            <span key={c.key} style={{ background: '#eef2e9', border: '1px solid #dbe0d1', color: '#2e5a41', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
              {c.name} <span style={{ color: '#9aa08d', fontSize: 11 }}>· {c.season}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
