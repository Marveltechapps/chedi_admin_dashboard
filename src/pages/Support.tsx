import { useApp } from '../store/AppContext';
import { pill, sPill } from '../lib/pill';

export function Support() {
  const { state, actions } = useApp();
  const t = state.tickets.find((x) => x.id === state.openTicket);

  return (
    <div className="ch-fade" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #efe9db', fontFamily: "'Space Mono',monospace", fontSize: 10.5, letterSpacing: '.05em', color: '#6f7566', textTransform: 'uppercase' }}>
          Tickets
        </div>
        {state.tickets.map((row) => {
          const q = sPill(row.status);
          const on = state.openTicket === row.id;
          return (
            <div
              key={row.id}
              onClick={() => actions.openTicketRow(row.id)}
              style={{ padding: '13px 18px', borderBottom: '1px solid #efe9db', cursor: 'pointer', background: on ? '#faf8f2' : '#fff', borderLeft: `3px solid ${on ? '#b98a2e' : 'transparent'}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: '#1c3b2c', fontSize: 13.5 }}>{row.memberName || '—'}</span>
                <span style={q.style}>{q.label}</span>
              </div>
              <div style={{ fontSize: 13, color: '#4b5142', marginTop: 3 }}>{row.subject}</div>
              <div style={{ fontSize: 11, color: '#9aa08d', marginTop: 4, fontFamily: "'Space Mono',monospace" }}>{row.id} · {row.category} · {row.assigneeName || '—'}</div>
            </div>
          );
        })}
        {state.tickets.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>No tickets.</div>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ded0', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
        {t ? (
          <>
            {(() => {
              const q = pill(t.status);
              return (
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #efe9db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: "'Newsreader',serif", fontSize: 19, color: '#1c3b2c' }}>{t.subject}</div>
                      <div style={{ fontSize: 12, color: '#9aa08d', marginTop: 2 }}>{t.id} · {t.memberName || '—'} · {t.category}</div>
                    </div>
                    <span style={q.style}>{q.label}</span>
                  </div>
                </div>
              );
            })()}

            <div style={{ flex: 1, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 340 }}>
              {t.msgs.map((mm, i) => {
                const admin = mm.who !== t.memberName;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: admin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: 11, color: '#9aa08d', marginBottom: 3 }}>{mm.who} · {mm.time}</div>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, lineHeight: 1.4, background: admin ? '#1c3b2c' : '#eef2e9', color: admin ? '#f6f3ea' : '#3a4033' }}>
                      {mm.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '16px 22px', borderTop: '1px solid #efe9db' }}>
              <textarea
                value={state.ticketReply}
                onChange={(e) => actions.setTicketReply(e.target.value)}
                rows={2}
                placeholder="Type a reply…"
                style={{ width: '100%', padding: '11px 13px', border: '1px solid #d8cfb8', borderRadius: 3, fontSize: 13.5, background: '#faf8f2', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button onClick={actions.sendReply} className="ch-btn-primary" style={{ padding: '9px 15px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
                  Reply
                </button>
                {t.status !== 'resolved' && t.status !== 'closed' && (
                  <button onClick={() => actions.ticketAct(t.id, 'resolved')} className="ch-btn-outline" style={{ padding: '9px 13px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
                    Mark resolved
                  </button>
                )}
                {t.status === 'open' && (
                  <button onClick={() => actions.ticketAct(t.id, 'assign')} className="ch-btn-outline" style={{ padding: '9px 13px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
                    Take (assign me)
                  </button>
                )}
                {t.status === 'resolved' && (
                  <button onClick={() => actions.ticketAct(t.id, 'closed')} className="ch-btn-outline" style={{ padding: '9px 13px', borderRadius: 3, fontSize: 13, fontWeight: 600 }}>
                    Close
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#9aa08d', fontSize: 14 }}>Select a ticket to view the thread.</div>
        )}
      </div>
    </div>
  );
}
