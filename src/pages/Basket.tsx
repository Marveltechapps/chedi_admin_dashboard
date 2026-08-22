import { useApp } from '../store/AppContext';
import { pill } from '../lib/pill';
import { Icon } from '../lib/icons';

const FLOW = ['draft', 'review', 'locked', 'published', 'packed'] as const;

export function Basket() {
  const { state, actions } = useApp();
  const cur = state.baskets[0];
  if (!cur) {
    return (
      <div className="ch-fade" style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>
        No weekly basket yet.
      </div>
    );
  }
  const st = pill(cur.status);
  const i = FLOW.indexOf(cur.status);
  const history = state.baskets.slice(1);

  return (
    <div className="ch-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 21, color: '#1c3b2c', margin: 0 }}>{cur.week}</h3>
              <div style={{ fontSize: 12.5, color: '#9aa08d', marginTop: 2 }}>Basket flow: Draft → Review → Locked → Published → Packed</div>
            </div>
            <span style={st.style}>{st.label}</span>
          </div>

          <div style={{ marginTop: 14 }}>
            {cur.items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px solid #efe9db' }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: '#eef2e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="sprout" color="#2e5a41" size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#1c3b2c', fontWeight: 600 }}>
                    {it.cropName || it.cropKey}
                    {it.supp && (
                      <span style={{ background: '#fdf3dc', color: '#a9781f', border: '1px solid #ecd9a8', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, marginLeft: 8 }}>
                        Supplement
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9aa08d' }}>from {it.supp ? 'CHEDI supply (supplement)' : 'member plots'}</div>
                </div>
                <div style={{ fontSize: 14, color: '#3a4033', fontWeight: 600 }}>{it.qty} {it.unit || ''}</div>
              </div>
            ))}
            {cur.items.length === 0 && <div style={{ padding: '16px 0', color: '#9aa08d', fontSize: 14 }}>No items in this basket yet.</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {i < FLOW.length - 1 && i >= 0 && (
              <button onClick={actions.advanceBasket} className="ch-btn-primary" style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13.5, fontWeight: 600 }}>
                Advance → {pill(FLOW[i + 1]).label}
              </button>
            )}
            <button onClick={actions.addSupplement} className="ch-btn-outline" style={{ padding: '10px 16px', borderRadius: 3, fontSize: 13.5, fontWeight: 600 }}>
              Add substitution
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 22 }}>
          <h3 style={{ fontFamily: "'Newsreader',serif", fontWeight: 500, fontSize: 19, color: '#1c3b2c', margin: '0 0 12px' }}>Previous weeks</h3>
          {history.map((b) => {
            const q = pill(b.status);
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #efe9db' }}>
                <div>
                  <div style={{ fontSize: 14, color: '#1c3b2c', fontWeight: 600 }}>{b.week}</div>
                  <div style={{ fontSize: 12, color: '#9aa08d' }}>{b.items.length} items</div>
                </div>
                <span style={q.style}>{q.label}</span>
              </div>
            );
          })}
          {history.length === 0 && <div style={{ fontSize: 13, color: '#9aa08d', padding: '8px 0' }}>No previous baskets.</div>}
          <button onClick={actions.dupBasket} className="ch-btn-outline" style={{ width: '100%', marginTop: 16, padding: 11, borderRadius: 3, fontSize: 13.5, fontWeight: 600 }}>
            Duplicate last week → new draft
          </button>
        </div>
      </div>
    </div>
  );
}
