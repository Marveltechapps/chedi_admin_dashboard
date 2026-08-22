import { useApp } from '../store/AppContext';
import { Icon } from '../lib/icons';

export function Toast() {
  const { state } = useApp();
  if (!state.toast) return null;
  return (
    <div
      className="ch-toast"
      style={{
        position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
        background: '#1c3b2c', color: '#f6f3ea', padding: '14px 22px', borderRadius: 6, fontSize: 14,
        fontWeight: 500, boxShadow: '0 8px 30px rgba(20,30,24,.35)', display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      <Icon name="check" color="#d9b45f" size={17} />
      {state.toast}
    </div>
  );
}
