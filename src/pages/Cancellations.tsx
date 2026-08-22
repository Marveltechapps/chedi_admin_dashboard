import { useApp } from '../store/AppContext';

export function Cancellations() {
  const { state, actions } = useApp();
  const rows = state.cancellations.filter((c) => c.status === 'pending');

  return (
    <div className="ch-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 920 }}>
      {rows.map((c) => {
        const eligible = !c.locked;
        return (
          <div key={c.id} style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: "'Newsreader',serif", fontSize: 18, color: '#1c3b2c' }}>{c.memberName || '—'}</span>
                  <span style={{ background: eligible ? '#e6f0e2' : '#f9e6df', color: eligible ? '#2e5a41' : '#b0361f', border: `1px solid ${eligible ? '#c3dcb8' : '#eabfb2'}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    {eligible ? 'Eligible' : 'Basket locked'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#6f7566', marginTop: 5 }}>
                  Delivery <strong style={{ color: '#3a4033' }}>{c.date}</strong> · {c.plotName || ''} · {c.deliveryId}
                </div>
                <div style={{ fontSize: 13.5, color: '#3a4033', marginTop: 8, background: '#f6f3ea', borderLeft: '3px solid #d9b45f', padding: '9px 13px', borderRadius: '0 4px 4px 0' }}>
                  “{c.reason}”
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 180 }}>
                {eligible ? (
                  <>
                    <button onClick={() => actions.resolveCancel(c.id, true)} className="ch-btn-primary" style={{ padding: 11, borderRadius: 3, fontSize: 13.5, fontWeight: 600 }}>
                      Approve & cancel
                    </button>
                    <button onClick={() => actions.resolveCancel(c.id, false)} className="ch-btn-outline" style={{ padding: 11, borderRadius: 3, fontSize: 13.5, fontWeight: 600 }}>
                      Reject
                    </button>
                  </>
                ) : (
                  <div style={{ background: '#f9e6df', border: '1px solid #eabfb2', color: '#b0361f', padding: 11, borderRadius: 3, fontSize: 12.5, fontWeight: 600, textAlign: 'center' }}>
                    Basket locked — cannot cancel
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, padding: 40, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>
          No cancellation requests pending.
        </div>
      )}
    </div>
  );
}
