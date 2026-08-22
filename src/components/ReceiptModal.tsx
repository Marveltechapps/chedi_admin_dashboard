import { useApp } from '../store/AppContext';

export function ReceiptModal() {
  const { state, actions } = useApp();
  const rc = state.receipt;
  if (!rc) return null;

  return (
    <div
      onClick={actions.closeReceipt}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,30,24,.5)', zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} className="ch-fade" style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ background: '#1c3b2c', padding: '24px 28px', color: '#f6f3ea' }}>
          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 24, letterSpacing: '.12em' }}>CHEDI</div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#d9b45f', letterSpacing: '.15em', marginTop: 2 }}>PAYMENT RECEIPT</div>
        </div>
        <div style={{ padding: '22px 28px' }}>
          {rc.rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13.5, borderBottom: '1px solid #f2ede1' }}>
              <span style={{ color: '#9aa08d' }}>{r.k}</span>
              <span style={{ color: '#3a4033', textAlign: 'right', maxWidth: '60%' }}>{r.v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 18, fontWeight: 700, color: '#1c3b2c' }}>
            <span>Total paid</span>
            <span>{rc.total}</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#9aa08d' }}>Thank you for growing with CHEDI Farm Club.</div>
        </div>
        <div style={{ padding: '0 28px 24px' }}>
          <button onClick={actions.closeReceipt} className="ch-btn-primary" style={{ width: '100%', padding: 12, borderRadius: 2, fontWeight: 600, fontSize: 14 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
