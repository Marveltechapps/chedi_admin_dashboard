import type { ReactElement } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast } from './components/Toast';
import { MemberDrawer } from './components/MemberDrawer';
import { ActionModal } from './components/ActionModal';
import { ReceiptModal } from './components/ReceiptModal';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Payments } from './pages/Payments';
import { Subscriptions } from './pages/Subscriptions';
import { Plots } from './pages/Plots';
import { Crops } from './pages/Crops';
import { Basket } from './pages/Basket';
import { Deliveries } from './pages/Deliveries';
import { Cancellations } from './pages/Cancellations';
import { Notifications } from './pages/Notifications';
import { Support } from './pages/Support';
import { Reports } from './pages/Reports';
import { Audit } from './pages/Audit';
import { PageSkeleton } from './components/Skeleton';
import type { TabKey } from './types';

const PAGES: Record<TabKey, () => ReactElement | null> = {
  dashboard: Dashboard,
  members: Members,
  payments: Payments,
  subs: Subscriptions,
  plots: Plots,
  crops: Crops,
  basket: Basket,
  deliveries: Deliveries,
  cancellations: Cancellations,
  notifs: Notifications,
  support: Support,
  reports: Reports,
  audit: Audit,
};

function Console() {
  const { state } = useApp();
  const Page = PAGES[state.tab] || Dashboard;

  return (
    <div className="ch-admin-shell" style={{ height: '100vh', background: '#f0ece0', display: 'flex', overflow: 'hidden' }}>
      <Sidebar />
      <main className="ch-admin-main" style={{ flex: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div className="ch-admin-pad" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>
          {state.bootstrapping ? <PageSkeleton tab={state.tab} /> : <Page />}
        </div>
      </main>

      {state.drawerId && <MemberDrawer />}
      {state.modal && <ActionModal />}
      {state.receipt && <ReceiptModal />}
      <Toast />
    </div>
  );
}

function Shell() {
  const { state } = useApp();
  return state.route === 'login' ? <Login /> : <Console />;
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
