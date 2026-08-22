import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AppState,
  TabKey,
  MemberStatus,
  ModalState,
  TeamMember,
} from '../types';
import { emptyState } from '../data/empty';
import { fmt } from '../lib/format';
import { api, downloadCsv, errorMessage } from '../lib/api';
import { clearSession, getAccessToken, getStoredStaff, saveSession } from '../lib/session';
import { nextSaturdayIso } from '../lib/dates';
import { HREF_TAB } from '../lib/roles';
import { connectRealtime, disconnectRealtime, subscribeRealtime, REALTIME_EVENTS } from '../lib/realtime';
import {
  asRecord,
  asRecords,
  mapAudit,
  mapBasket,
  mapCancellation,
  mapCrop,
  mapCultivation,
  mapDashboard,
  mapDelivery,
  mapFarm,
  mapMember,
  mapPayment,
  mapPlan,
  mapPlot,
  mapReports,
  mapSent,
  mapStaff,
  mapTicket,
} from '../lib/mappers';

const LIST_Q = { page: 1, limit: 100 };
const RANGE_API: Record<string, string> = {
  this_week: 'this_week',
  this_month: 'this_month',
  this_year: 'this_year',
  'This week': 'this_week',
  'This month': 'this_month',
  'This year': 'this_year',
};

export function useAppLogic() {
  const [state, setState] = useState<AppState>(emptyState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback((p: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...p }));
  }, []);

  const flash = useCallback((msg: string) => {
    patch({ toast: msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setState((prev) => (prev.toast === msg ? { ...prev, toast: '' } : prev));
    }, 2800);
  }, [patch]);

  const fail = useCallback((err: unknown, fallback?: string) => {
    flash(errorMessage(err, fallback));
  }, [flash]);

  const member = (id?: string | null) => {
    if (!id) return null;
    return state.members.find((m) => m.id === id || m.memberCode === id) || null;
  };
  const plot = (key?: string | null) => state.plots.find((p) => p.key === key) || null;
  const plan = (key?: string | null) => state.plans.find((p) => p.key === key) || null;
  const crop = (key?: string | null) => state.crops.find((c) => c.key === key) || null;
  const farm = (id?: string | null) => state.farms.find((f) => f.id === id) || null;
  const basket = (id?: string | null) => state.baskets.find((b) => b.id === id) || null;
  const actor = () => state.team.find((t) => t.id === state.me)?.name || 'Admin';
  const planName = (k?: string | null) => plan(k)?.name || state.members.find((m) => m.planKey === k)?.planName || '—';
  const plotName = (k?: string | null) => plot(k)?.name || state.members.find((m) => m.plotKey === k)?.plotName || '—';
  const paymentOf = (key?: string | null) =>
    state.payments.find((p) => p.ref === key || p.id === key) || null;

  const countsOf = (meta?: Record<string, unknown> | null) => {
    const counts = meta?.counts;
    return counts && typeof counts === 'object' ? (counts as Record<string, number>) : {};
  };

  const loadDashboard = async () => {
    const { data } = await api.get('/admin/dashboard');
    patch({ dashboard: mapDashboard(asRecord(data)) });
  };

  const loadMembers = async (extra: Record<string, string | number | undefined> = {}) => {
    const q = stateRef.current.search.trim();
    const { data, meta } = await api.get('/admin/members', {
      ...LIST_Q,
      filter: stateRef.current.memberFilter,
      q: q || undefined,
      ...extra,
    });
    patch({ members: asRecords(data).map(mapMember), memberCounts: countsOf(meta) });
  };

  const loadPayments = async (status?: string) => {
    const { data, meta } = await api.get('/admin/payments', {
      ...LIST_Q,
      status: status || stateRef.current.payFilter,
    });
    patch({ payments: asRecords(data).map(mapPayment), payCounts: countsOf(meta) });
  };

  const loadSubscriptions = async (filter?: string) => {
    const { data, meta } = await api.get('/admin/subscriptions', {
      ...LIST_Q,
      filter: filter || stateRef.current.subFilter,
    });
    const rows = asRecords(data).map(mapMember);
    patch({ subscribers: rows, subCounts: countsOf(meta) });
    if (rows.length) {
      setState((prev) => {
        const byId = new Map(prev.members.map((m) => [m.id, m]));
        for (const m of rows) byId.set(m.id, { ...(byId.get(m.id) || m), ...m });
        return { ...prev, members: Array.from(byId.values()), subscribers: rows, subCounts: countsOf(meta) };
      });
    }
  };

  const loadFarms = async () => {
    const { data } = await api.get('/admin/farms');
    patch({ farms: asRecords(data).map(mapFarm) });
  };

  const loadPlots = async (filter?: string) => {
    const { data, meta } = await api.get('/admin/plots', {
      ...LIST_Q,
      filter: filter || stateRef.current.plotFilter,
    });
    patch({ plots: asRecords(data).map(mapPlot), plotCounts: countsOf(meta) });
  };

  const loadCrops = async () => {
    const { data } = await api.get('/admin/crops');
    patch({ crops: asRecords(data).map(mapCrop) });
  };

  const loadCultivations = async () => {
    const { data } = await api.get('/admin/cultivations');
    const rec = asRecord(data);
    const rows = Array.isArray(data) ? asRecords(data) : asRecords(rec.data);
    patch({ cultivations: rows.map(mapCultivation) });
  };

  const loadBaskets = async () => {
    const { data } = await api.get('/admin/baskets');
    const rec = asRecord(data);
    const current = rec.current ? mapBasket(asRecord(rec.current)) : null;
    const history = asRecords(rec.history).map(mapBasket);
    patch({ baskets: current ? [current, ...history] : history });
  };

  const loadDeliveries = async (status?: string) => {
    const { data, meta } = await api.get('/admin/deliveries', {
      ...LIST_Q,
      filter: status || stateRef.current.deliveryFilter,
    });
    patch({ deliveries: asRecords(data).map(mapDelivery), deliveryCounts: countsOf(meta) });
  };

  const loadCancellations = async () => {
    const { data } = await api.get('/admin/cancellations', { status: 'pending' });
    patch({ cancellations: asRecords(data).map(mapCancellation) });
  };

  const loadTickets = async () => {
    const { data } = await api.get('/admin/tickets', LIST_Q);
    const tickets = asRecords(data).map(mapTicket);
    setState((prev) => ({
      ...prev,
      tickets,
      openTicket: tickets.some((t) => t.id === prev.openTicket) ? prev.openTicket : tickets[0]?.id || '',
    }));
  };

  const loadTemplates = async () => {
    const { data } = await api.get('/admin/notifications/templates');
    patch({
      notifTemplates: asRecords(data).map((t) => ({
        key: String(t.key || ''),
        title: String(t.title || ''),
        body: String(t.body || ''),
      })),
    });
  };

  const loadSent = async () => {
    const { data } = await api.get('/admin/notifications/sent', LIST_Q);
    patch({ sent: asRecords(data).map(mapSent) });
  };

  const loadAudit = async () => {
    const { data } = await api.get('/admin/audit', LIST_Q);
    patch({ audit: asRecords(data).map(mapAudit) });
  };

  const loadStaff = async () => {
    const { data } = await api.get('/admin/staff');
    patch({ team: asRecords(data).map(mapStaff) });
  };

  const loadPlans = async () => {
    const { data } = await api.get('/admin/plans');
    patch({ plans: asRecords(data).map(mapPlan) });
  };

  const loadReports = async (range?: string) => {
    const r = RANGE_API[range || stateRef.current.reportRange] || 'this_month';
    const { data } = await api.get('/admin/reports', { range: r });
    patch({ reports: mapReports(asRecord(data)), reportRange: r });
  };

  const bootstrap = async () => {
    patch({ bootstrapping: true });
    const results = await Promise.allSettled([
      loadDashboard(),
      loadMembers({ filter: 'all' }),
      loadPayments(),
      loadSubscriptions(),
      loadFarms(),
      loadPlots(),
      loadCrops(),
      loadCultivations(),
      loadBaskets(),
      loadDeliveries(),
      loadCancellations(),
      loadTickets(),
      loadTemplates(),
      loadSent(),
      loadAudit(),
      loadStaff(),
      loadPlans(),
      loadReports(),
    ]);
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (failed.length === results.length) {
      fail(failed[0]?.reason, 'Could not load admin data');
    } else if (failed.length) {
      fail(failed[0]?.reason, 'Some admin data could not be loaded');
    }
    patch({ bootstrapping: false });
  };

  const afterWrite = async (reload: Array<() => Promise<void>> = []) => {
    await Promise.allSettled([loadDashboard(), loadAudit(), ...reload.map((fn) => fn())]);
  };

  const run = async (fn: () => Promise<void>, okToast?: string) => {
    if (stateRef.current.busy) return;
    patch({ busy: true });
    try {
      await fn();
      if (okToast) flash(okToast);
    } catch (err) {
      fail(err);
    } finally {
      patch({ busy: false });
    }
  };

  const applyStaff = (staff: TeamMember) => {
    patch({
      me: staff.id,
      team: [staff],
      route: 'app',
    });
  };

  const restoreSession = async () => {
    if (!getAccessToken() && !getStoredStaff()) return;
    const stored = getStoredStaff();
    if (stored) {
      applyStaff(mapStaff(stored as unknown as Record<string, unknown>));
      patch({ bootstrapping: true, route: 'app' });
    }
    try {
      const { data } = await api.get('/admin/me');
      const rec = asRecord(data);
      const staff = mapStaff(asRecord(rec.staff || rec));
      applyStaff(staff);
      await bootstrap();
    } catch (err) {
      clearSession();
      setState(emptyState());
      fail(err, 'Session expired. Sign in again.');
    }
  };

  useEffect(() => {
    void restoreSession();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      disconnectRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadersRef = useRef({
    bootstrap,
    loadDashboard,
    loadMembers,
    loadPayments,
    loadSubscriptions,
    loadFarms,
    loadPlots,
    loadCrops,
    loadCultivations,
    loadBaskets,
    loadDeliveries,
    loadCancellations,
    loadTickets,
    loadSent,
    loadAudit,
  });
  loadersRef.current = {
    bootstrap,
    loadDashboard,
    loadMembers,
    loadPayments,
    loadSubscriptions,
    loadFarms,
    loadPlots,
    loadCrops,
    loadCultivations,
    loadBaskets,
    loadDeliveries,
    loadCancellations,
    loadTickets,
    loadSent,
    loadAudit,
  };

  const revalidateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scheduleReload = (key: string, fn: () => Promise<void>) => {
    if (revalidateTimers.current[key]) clearTimeout(revalidateTimers.current[key]);
    revalidateTimers.current[key] = setTimeout(() => {
      void fn().catch(() => undefined);
    }, 180);
  };

  const applyAdminRealtime = (event: string, payload: Record<string, unknown>) => {
    const memberRec = payload.member && typeof payload.member === 'object' ? asRecord(payload.member) : null;
    if (memberRec?.id) {
      const mapped = mapMember(memberRec);
      setState((prev) => {
        const match = (m: typeof mapped) => m.id === mapped.id || (!!mapped.memberCode && m.memberCode === mapped.memberCode);
        const members = prev.members.some(match)
          ? prev.members.map((m) => (match(m) ? { ...m, ...mapped } : m))
          : event === 'customer:deleted'
            ? prev.members
            : [mapped, ...prev.members];
        const subscribers = prev.subscribers.some(match)
          ? prev.subscribers.map((m) => (match(m) ? { ...m, ...mapped } : m))
          : prev.subscribers;
        return { ...prev, members, subscribers };
      });
    } else if (
      (event === 'customer:address:created' ||
        event === 'customer:address:updated' ||
        event === 'customer:address:deleted') &&
      payload.memberId &&
      payload.address &&
      typeof payload.address === 'object'
    ) {
      const addr = asRecord(payload.address);
      const addressDisplay = [addr.line, addr.city && addr.pin ? `${addr.city} ${addr.pin}` : addr.city]
        .filter(Boolean)
        .join(', ');
      const memberId = String(payload.memberId);
      setState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId || m.memberCode === memberId
            ? { ...m, address: addressDisplay || m.address, city: String(addr.city || m.city) }
            : m
        ),
      }));
    }

    if (event === 'customer:deleted') {
      const id = String(payload.memberId || memberRec?.id || '');
      if (id) {
        setState((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.id !== id && m.memberCode !== id),
          subscribers: prev.subscribers.filter((m) => m.id !== id && m.memberCode !== id),
          drawerId: prev.drawerId === id ? null : prev.drawerId,
        }));
      }
    }

    const L = loadersRef.current;
    if (event.startsWith('customer:')) {
      scheduleReload('members', () => L.loadMembers());
      scheduleReload('dashboard', () => L.loadDashboard());
    }
    if (event.startsWith('payment')) {
      scheduleReload('payments', () => L.loadPayments());
      scheduleReload('dashboard', () => L.loadDashboard());
    }
    if (event.startsWith('subscription:')) {
      scheduleReload('subs', () => L.loadSubscriptions());
      scheduleReload('members', () => L.loadMembers());
    }
    if (event === 'delivery:updated') scheduleReload('deliveries', () => L.loadDeliveries());
    if (event === 'cancellation:updated') scheduleReload('cancellations', () => L.loadCancellations());
    if (event === 'plot:updated') {
      scheduleReload('plots', () => L.loadPlots());
      scheduleReload('farms', () => L.loadFarms());
    }
    if (event === 'crop:updated') {
      scheduleReload('crops', () => L.loadCrops());
      scheduleReload('cultivations', () => L.loadCultivations());
    }
    if (event === 'basket:updated') scheduleReload('baskets', () => L.loadBaskets());
    if (event === 'ticket:updated') scheduleReload('tickets', () => L.loadTickets());
    if (event === 'notification:created') scheduleReload('sent', () => L.loadSent());
  };

  useEffect(() => {
    if (state.route !== 'app' || !getAccessToken()) {
      disconnectRealtime();
      return;
    }
    connectRealtime({
      kind: 'admin',
      getToken: getAccessToken,
      onReconnect: () => {
        void loadersRef.current.bootstrap().catch(() => undefined);
      },
    });
    const unsubscribe = subscribeRealtime(REALTIME_EVENTS, applyAdminRealtime);
    return () => {
      unsubscribe();
    };
  }, [state.route]);

  const go = (tab: TabKey) => {
    patch({ tab, search: '' });
    const loaders: Partial<Record<TabKey, () => Promise<void>>> = {
      dashboard: loadDashboard,
      members: () => loadMembers({ filter: stateRef.current.memberFilter }),
      payments: loadPayments,
      subs: loadSubscriptions,
      plots: async () => {
        await loadFarms();
        await loadPlots();
      },
      crops: async () => {
        await loadCrops();
        await loadCultivations();
      },
      basket: loadBaskets,
      deliveries: loadDeliveries,
      cancellations: loadCancellations,
      notifs: async () => {
        await loadTemplates();
        await loadSent();
      },
      support: loadTickets,
      reports: () => loadReports(),
      audit: async () => {
        await loadAudit();
        await loadStaff();
      },
    };
    void loaders[tab]?.().catch((err) => fail(err));
  };

  const openDrawer = (id: string) => {
    patch({ drawerId: id, drawerTab: 'profile', drawerPayments: [], drawerDeliveries: [], drawerTimeline: [] });
    void (async () => {
      try {
        const { data } = await api.get(`/admin/members/${id}`);
        const rec = asRecord(data);
        const m = mapMember(asRecord(rec.member));
        setState((prev) => ({
          ...prev,
          members: prev.members.some((x) => x.id === m.id)
            ? prev.members.map((x) => (x.id === m.id ? m : x))
            : [m, ...prev.members],
          drawerPayments: asRecords(rec.payments).map(mapPayment),
          drawerDeliveries: asRecords(rec.deliveries).map(mapDelivery),
          drawerTimeline: asRecords(rec.timeline).map((t) => ({
            text: t.detail ? `${t.action} — ${t.detail}` : String(t.action || t.text || ''),
            time: [t.actorName, t.timeLabel || t.time].filter(Boolean).join(' · '),
            isLeaf: !t.actorName,
          })),
        }));
      } catch (err) {
        fail(err, 'Could not load member');
      }
    })();
  };

  const closeDrawer = () => patch({ drawerId: null });
  const closeModal = () => patch({ modal: null });
  const closeReceipt = () => patch({ receipt: null });
  const setModal = (p: Partial<ModalState>) =>
    patch({ modal: stateRef.current.modal ? { ...stateRef.current.modal, ...p } : stateRef.current.modal });

  const doLogin = async (email: string, password: string) => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      flash('Email address and password are required.');
      return;
    }
    await run(async () => {
      const { data } = await api.post(
        '/admin/login',
        { email: trimmed, password },
        { skipAuth: true }
      );
      const rec = asRecord(data);
      const staffDto = asRecord(rec.staff);
      const staff = mapStaff(staffDto);
      saveSession(String(rec.accessToken || ''), String(rec.refreshToken || ''), {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.roleKey || String(staffDto.role || ''),
        roleLabel: staff.roleLabel || staff.role,
        initial: staff.initial,
        scope: staff.scope,
      });
      applyStaff(staff);
      await bootstrap();
    }, 'Signed in');
  };

  const logout = () => {
    const refreshToken = sessionStorage.getItem('chedi.admin.refreshToken');
    void api.post('/admin/logout', { refreshToken }).catch(() => undefined);
    disconnectRealtime();
    clearSession();
    setState(emptyState());
  };

  const onSearch = (value: string) => {
    const nextTab = value && stateRef.current.tab === 'dashboard' ? 'members' : stateRef.current.tab;
    patch({ search: value, tab: nextTab as TabKey });
    if (nextTab === 'members') {
      void loadMembers({ q: value.trim() || undefined, filter: stateRef.current.memberFilter }).catch((err) => fail(err));
    }
  };

  const markPaid = (ref: string) => {
    const p = paymentOf(ref);
    if (!p) return;
    const m = member(p.memberId);
    patch({
      modal: {
        kind: 'markPaid',
        ref: p.id || p.ref,
        iconBg: '#eef2e9',
        icon: 'card',
        title: 'Confirm payment collected',
        body:
          p.type === 'membership'
            ? 'Recording this activates the member account.'
            : 'Recording this activates the subscription and leases the plot.',
        rows: [
          { k: 'Member', v: m?.name || p.memberName || '—' },
          { k: 'For', v: p.desc },
          { k: 'Reference', v: p.ref },
          { k: 'Amount', v: fmt(p.amount), w: 700 },
        ],
        fieldLabel: 'Payment reference / UTR',
        fieldPh: 'e.g. UPI 4471 / NEFT ref',
        fieldVal: '',
        confirmLabel: 'Mark as paid',
        confirmBg: '#1c3b2c',
        confirmColor: '#f6f3ea',
      },
    });
  };

  const doMarkPaid = () => {
    const md = stateRef.current.modal;
    if (!md?.ref) return;
    const p = paymentOf(md.ref);
    void run(async () => {
      await api.post(`/admin/payments/${md.ref}/mark-paid`, {
        collectionRef: md.fieldVal || undefined,
        method: 'offline',
      }, { idempotent: true });
      patch({ modal: null });
      await afterWrite([loadPayments, loadMembers, loadSubscriptions, loadDeliveries, loadPlots]);
    }, p ? `Payment recorded · ${p.memberName || member(p.memberId)?.name || ''}` : 'Payment recorded');
  };

  const payReminder = (ref: string) => {
    const p = paymentOf(ref);
    if (!p) return;
    void run(async () => {
      await api.post(`/admin/payments/${p.id || p.ref}/remind`);
      await afterWrite([loadSent]);
    }, `Reminder sent to ${p.memberName || member(p.memberId)?.name || 'member'}`);
  };

  const refundPay = (ref: string) => {
    const p = paymentOf(ref);
    if (!p) return;
    const m = member(p.memberId);
    patch({
      modal: {
        kind: 'refund',
        ref: p.id || p.ref,
        iconBg: '#f9e6df',
        icon: 'card',
        title: 'Issue refund',
        body: 'This reverses the collected payment and logs a refund. The member will be notified.',
        rows: [
          { k: 'Member', v: m?.name || p.memberName || '—' },
          { k: 'For', v: p.desc },
          { k: 'Amount', v: fmt(p.amount), w: 700 },
        ],
        confirmLabel: 'Issue refund',
        confirmBg: '#b0361f',
        confirmColor: '#fff',
      },
    });
  };

  const doRefund = () => {
    const ref = stateRef.current.modal?.ref;
    if (!ref) return;
    void run(async () => {
      await api.post(`/admin/payments/${ref}/refund`, {}, { idempotent: true });
      patch({ modal: null });
      await afterWrite([loadPayments, loadMembers]);
    }, 'Refund issued');
  };

  const showReceipt = (ref: string) => {
    const p = paymentOf(ref);
    if (!p) return;
    void run(async () => {
      const { data } = await api.get(`/admin/payments/${p.id || p.ref}/receipt`);
      const rec = asRecord(data);
      const rows = Array.isArray(rec.rows)
        ? rec.rows.map((r: Record<string, unknown>) => ({ k: String(r.k), v: String(r.v) }))
        : [];
      patch({ receipt: { rows, total: String(rec.amountFormatted || fmt(p.amount)) } });
    });
  };

  const openCreatePay = () => {
    patch({
      modal: {
        kind: 'createPay',
        iconBg: '#eef2e9',
        icon: 'plus',
        title: 'Create payment request',
        body: 'Raise a new request. The member receives it in their app and you collect offline.',
        selectLabel: 'Member',
        selectVal: stateRef.current.members[0]?.id || null,
        selectVal2: 'membership',
        fieldLabel: 'Amount (₹)',
        fieldPh: 'e.g. 500',
        fieldVal: '',
        confirmLabel: 'Send request',
        confirmBg: '#1c3b2c',
        confirmColor: '#f6f3ea',
      },
    });
    if (!stateRef.current.members.length) void loadMembers({ filter: 'all' }).catch((err) => fail(err));
  };

  const doCreatePay = () => {
    const md = stateRef.current.modal;
    if (!md) return;
    if (!md.selectVal || !md.fieldVal) {
      flash('Pick a member and amount');
      return;
    }
    const amountInr = Number(md.fieldVal);
    if (!Number.isInteger(amountInr) || amountInr <= 0) {
      flash('Amount must be a whole rupee amount');
      return;
    }
    const context = md.selectVal2 || 'membership';
    const m = member(md.selectVal);
    const metadata: Record<string, string> = {};
    if (context === 'lease') {
      if (!m?.plotKey || !m.planKey) {
        flash('This member needs a plot and plan for a lease request');
        return;
      }
      metadata.plotKey = m.plotKey;
      metadata.planKey = m.planKey;
    }
    if (context === 'renewal') {
      if (!m?.activeSubscriptionId) {
        flash('This member has no subscription to renew');
        return;
      }
      metadata.subscriptionId = m.activeSubscriptionId;
    }
    void run(async () => {
      await api.post(
        '/admin/payments',
        { memberId: md.selectVal, context, amountInr, metadata },
        { idempotent: true }
      );
      patch({ modal: null, tab: 'payments' });
      await afterWrite([loadPayments, loadMembers]);
    }, `Request sent to ${m?.name || 'member'}`);
  };

  const memberAction = (id: string, kind: 'activate' | 'suspend' | 'reactivate' | 'cancel') => {
    const m = member(id);
    if (!m) return;
    const cfg = {
      activate: { title: 'Activate member', body: 'Set this member to active.', label: 'Activate', bg: '#1c3b2c', color: '#f6f3ea', ns: 'active' as MemberStatus },
      suspend: { title: 'Suspend member', body: 'Suspends the account and pauses future deliveries.', label: 'Suspend', bg: '#b0361f', color: '#fff', ns: 'suspended' as MemberStatus },
      reactivate: { title: 'Reactivate member', body: 'Restores the account and resumes deliveries.', label: 'Reactivate', bg: '#1c3b2c', color: '#f6f3ea', ns: 'active' as MemberStatus },
      cancel: { title: 'Cancel membership', body: 'Cancels the subscription, releases the plot and voids future deliveries.', label: 'Cancel membership', bg: '#b0361f', color: '#fff', ns: 'cancelled' as MemberStatus },
    }[kind];
    patch({
      modal: {
        kind: 'member',
        memberId: id,
        sub: kind,
        iconBg: kind === 'suspend' || kind === 'cancel' ? '#f9e6df' : '#eef2e9',
        icon: 'users',
        title: cfg.title,
        body: cfg.body,
        rows: [{ k: 'Member', v: m.name }, { k: 'ID', v: m.memberCode || m.id }],
        confirmLabel: cfg.label,
        confirmBg: cfg.bg,
        confirmColor: cfg.color,
        ns: cfg.ns,
      },
    });
  };

  const doMemberAction = () => {
    const md = stateRef.current.modal;
    if (!md?.memberId || !md.sub) return;
    const path =
      md.sub === 'activate'
        ? 'activate'
        : md.sub === 'suspend'
          ? 'suspend'
          : md.sub === 'reactivate'
            ? 'reactivate'
            : 'cancel';
    void run(async () => {
      await api.post(`/admin/members/${md.memberId}/${path}`, md.sub === 'suspend' ? { reason: 'Admin action' } : {});
      patch({ modal: null });
      await afterWrite([loadMembers, loadPlots, loadDeliveries, loadSubscriptions]);
      if (stateRef.current.drawerId === md.memberId) openDrawer(md.memberId);
    }, `${member(md.memberId)?.name || 'Member'} — ${md.sub}`);
  };

  const sendMemberNotif = (id: string) => {
    const m = member(id);
    patch({
      drawerId: null,
      tab: 'notifs',
      notif: { ...stateRef.current.notif, aud: 'individual', memberId: id, title: '', body: '' },
    });
    flash(`Composing message to ${m?.name || 'member'}`);
  };

  const onModalField = (value: string) => setModal({ fieldVal: value });

  const drawerAct = (kind: string) => {
    const id = stateRef.current.drawerId;
    if (!id) return;
    if (kind === 'notify') return sendMemberNotif(id);
    if (kind === 'assignplot') return openAssignPlot();
    if (kind === 'changeplan') return openChangePlan(id);
    return memberAction(id, kind as 'activate' | 'suspend' | 'reactivate' | 'cancel');
  };

  const openAssignPlot = () => {
    go('plots');
    flash('Pick a plot to assign from the Plots page');
    patch({ drawerId: null });
  };

  const openChangePlan = (id: string) => {
    const m = member(id);
    if (!m) return;
    patch({
      modal: {
        kind: 'sub',
        sub: 'changeplan',
        memberId: id,
        iconBg: '#eef2e9',
        icon: 'refresh',
        title: 'Change plan',
        body: 'Switch the member to a different plan. A pro-rata payment request can follow.',
        selectLabel: 'New plan',
        selectVal: m.planKey,
        confirmLabel: 'Change plan',
        confirmBg: '#1c3b2c',
        confirmColor: '#f6f3ea',
      },
    });
    if (!stateRef.current.plans.length) void loadPlans().catch((err) => fail(err));
  };

  const doSubAction = () => {
    const md = stateRef.current.modal;
    if (!md) return;
    if (md.sub === 'changeplan' && md.memberId) {
      if (!md.selectVal) {
        flash('Pick a plan');
        return;
      }
      void run(async () => {
        await api.post(`/admin/members/${md.memberId}/plan`, { planKey: md.selectVal });
        patch({ modal: null });
        await afterWrite([loadMembers, loadSubscriptions]);
      }, 'Plan changed');
      return;
    }
    closeModal();
  };

  const plotDetail = (key: string) => {
    void run(async () => {
      const { data } = await api.get(`/admin/plots/${key}`);
      const rec = asRecord(data);
      const p = mapPlot(rec);
      const fm = farm(p.farmId);
      patch({
        modal: {
          kind: 'info',
          iconBg: '#eef2e9',
          icon: 'pin',
          title: p.name,
          body: [p.region || fm?.region, p.size].filter(Boolean).join(' · '),
          rows: [
            { k: 'Status', v: pillLabel(p.status) },
            { k: 'Member', v: p.memberName || member(p.memberId)?.name || '—' },
            { k: 'Subscription', v: planName(p.memberId ? member(p.memberId)?.planKey : null) },
            { k: 'Farmer', v: p.farmerName || fm?.farmer || '—' },
            { k: 'Current crop', v: p.cropName || crop(p.cropKey)?.name || '—' },
            { k: 'Crop stage', v: p.cropKey ? pillLabel(p.stage) : '—' },
            { k: 'Planted', v: p.plantDate || '—' },
            { k: 'Expected harvest', v: p.harvestDate || '—' },
          ],
          confirmLabel: 'Close',
          confirmBg: '#1c3b2c',
          confirmColor: '#f6f3ea',
        },
      });
    });
  };

  const assignPlot = (key: string) => {
    const p = plot(key);
    if (!p) return;
    const unassigned = stateRef.current.members.filter((m) => !m.plotKey && m.status !== 'cancelled');
    patch({
      modal: {
        kind: 'assign',
        plotKey: key,
        iconBg: '#eef2e9',
        icon: 'pin',
        title: `Assign ${p.name}`,
        body: 'Lease this plot to a member. Their subscription plot updates immediately.',
        selectLabel: 'Member',
        selectVal: unassigned[0]?.id || null,
        confirmLabel: 'Assign plot',
        confirmBg: '#1c3b2c',
        confirmColor: '#f6f3ea',
        assignOpts: unassigned,
      },
    });
  };

  const doAssign = () => {
    const md = stateRef.current.modal;
    if (!md?.plotKey) return;
    if (!md.selectVal) {
      flash('No member selected');
      return;
    }
    void run(async () => {
      await api.post(`/admin/plots/${md.plotKey}/assign`, { memberId: md.selectVal });
      patch({ modal: null });
      await afterWrite([loadPlots, loadMembers, loadFarms]);
    }, 'Plot assigned');
  };

  const runModal = () => {
    const k = stateRef.current.modal?.kind;
    if (k === 'markPaid') return doMarkPaid();
    if (k === 'refund') return doRefund();
    if (k === 'createPay') return doCreatePay();
    if (k === 'member') return doMemberAction();
    if (k === 'sub') return doSubAction();
    if (k === 'assign') return doAssign();
    if (k === 'supplement') return doAddSupplement();
    closeModal();
  };

  const advanceStage = (key: string) => {
    void run(async () => {
      await api.post(`/admin/plots/${key}/advance-stage`);
      await afterWrite([loadCultivations, loadPlots]);
    }, 'Crop stage updated');
  };

  const addSupplement = () => {
    const shortfall = stateRef.current.cultivations.find((c) => c.shortfall);
    const used = new Set(stateRef.current.baskets[0]?.items.map((i) => i.cropKey) || []);
    if (shortfall) used.add(shortfall.cropKey);
    const pick = stateRef.current.crops.find((c) => !used.has(c.key)) || stateRef.current.crops[0];
    if (!pick) {
      flash('No crops in the library to add');
      return;
    }
    patch({
      modal: {
        kind: 'supplement',
        iconBg: '#eef2e9',
        icon: 'sprout',
        title: 'Add supplement to basket',
        body: shortfall
          ? `${shortfall.plotName} · ${shortfall.cropName} is short. Pick a crop from the library.`
          : 'Add a supplementary item to this week’s basket.',
        selectLabel: 'Crop',
        selectVal: pick.key,
        confirmLabel: 'Add to basket',
        confirmBg: '#1c3b2c',
        confirmColor: '#f6f3ea',
      },
    });
  };

  const doAddSupplement = () => {
    const md = stateRef.current.modal;
    if (!md?.selectVal) {
      flash('Pick a crop');
      return;
    }
    void run(async () => {
      await api.post('/admin/baskets/items', { cropKey: md.selectVal, qty: 1, supp: true });
      patch({ modal: null, tab: 'basket' });
      await afterWrite([loadBaskets]);
    }, 'Supplement added to this week’s basket');
  };

  const advanceBasket = () => {
    void run(async () => {
      await api.post('/admin/baskets/advance');
      await afterWrite([loadBaskets, loadSent]);
    }, 'Basket updated');
  };

  const dupBasket = () => {
    void run(async () => {
      await api.post('/admin/baskets/duplicate');
      await afterWrite([loadBaskets]);
    }, 'New draft basket created');
  };

  const deliveryStep = (id: string) => {
    void run(async () => {
      await api.post(`/admin/deliveries/${id}/advance`);
      await afterWrite([loadDeliveries, loadSent]);
    }, 'Delivery updated');
  };

  const deliveryAct = (id: string, kind: 'cancel' | 'fail' | 'reschedule') => {
    void run(async () => {
      if (kind === 'reschedule') {
        await api.post(`/admin/deliveries/${id}/reschedule`, { date: nextSaturdayIso() });
      } else {
        await api.post(`/admin/deliveries/${id}/${kind}`);
      }
      await afterWrite([loadDeliveries, loadSent]);
    }, `Delivery ${kind === 'reschedule' ? 'rescheduled' : kind === 'fail' ? 'failed' : 'cancelled'}`);
  };

  const resolveCancel = (id: string, approve: boolean) => {
    void run(async () => {
      await api.post(`/admin/cancellations/${id}/${approve ? 'approve' : 'reject'}`);
      await afterWrite([loadCancellations, loadDeliveries]);
    }, approve ? 'Cancellation approved' : 'Cancellation rejected');
  };

  const subAction = (id: string, kind: 'activate' | 'pause' | 'resume' | 'renewbill' | 'renewremind') => {
    const path =
      kind === 'activate'
        ? 'activate'
        : kind === 'pause'
          ? 'pause'
          : kind === 'resume'
            ? 'resume'
            : kind === 'renewbill'
              ? 'renewal-bill'
              : 'renewal-remind';
    void run(async () => {
      await api.post(`/admin/subscriptions/${id}/${path}`);
      await afterWrite([loadSubscriptions, loadMembers, loadPayments, loadDeliveries, loadPlots]);
    }, kind === 'renewbill' ? 'Renewal bill generated' : kind === 'renewremind' ? 'Reminder sent' : `Subscription ${kind}d`);
  };

  const chooseTemplate = (title: string, body: string) =>
    patch({ notif: { ...stateRef.current.notif, title, body } });
  const chooseAudience = (aud: string) =>
    patch({ notif: { ...stateRef.current.notif, aud, memberId: aud === 'individual' ? stateRef.current.notif.memberId : null } });
  const chooseChannel = (channel: string) => patch({ notif: { ...stateRef.current.notif, channel } });
  const setNotifTitle = (title: string) => patch({ notif: { ...stateRef.current.notif, title } });
  const setNotifBody = (body: string) => patch({ notif: { ...stateRef.current.notif, body } });
  const setNotifMember = (memberId: string) =>
    patch({ notif: { ...stateRef.current.notif, aud: 'individual', memberId } });

  const sendNotif2 = () => {
    const n = stateRef.current.notif;
    if (!n.title) {
      flash('Add a title first');
      return;
    }
    if (n.aud === 'individual' && !n.memberId) {
      flash('Pick a member for an individual message');
      return;
    }
    void run(async () => {
      await api.post('/admin/notifications/send', {
        title: n.title,
        body: n.body,
        audience: n.aud,
        channel: n.channel,
        memberId: n.aud === 'individual' ? n.memberId : undefined,
      });
      patch({ notif: { ...n, title: '', body: '' } });
      await afterWrite([loadSent]);
    }, 'Notification sent');
  };

  const openTicketRow = (id: string) => {
    patch({ openTicket: id, ticketReply: '' });
    void (async () => {
      try {
        const { data } = await api.get(`/admin/tickets/${id}`);
        const t = mapTicket(asRecord(data));
        setState((prev) => ({
          ...prev,
          tickets: prev.tickets.map((x) => (x.id === t.id ? t : x)),
        }));
      } catch (err) {
        fail(err);
      }
    })();
  };
  const setTicketReply = (value: string) => patch({ ticketReply: value });

  const sendReply = () => {
    const t = stateRef.current.tickets.find((x) => x.id === stateRef.current.openTicket);
    const text = stateRef.current.ticketReply.trim();
    if (!t || !text) {
      flash('Type a reply first');
      return;
    }
    void run(async () => {
      await api.post(`/admin/tickets/${t.id}/reply`, { text });
      patch({ ticketReply: '' });
      await afterWrite([loadTickets]);
      openTicketRow(t.id);
    }, 'Reply sent');
  };

  const ticketAct = (id: string, kind: 'assign' | 'resolved' | 'closed') => {
    const path = kind === 'assign' ? 'assign' : kind === 'resolved' ? 'resolve' : 'close';
    void run(async () => {
      await api.post(`/admin/tickets/${id}/${path}`, kind === 'assign' ? { assigneeId: stateRef.current.me } : {});
      await afterWrite([loadTickets]);
      openTicketRow(id);
    }, kind === 'assign' ? 'Ticket assigned to you' : `Ticket ${kind === 'resolved' ? 'resolved' : 'closed'}`);
  };

  const setReportRange = (r: string) => {
    const apiRange = RANGE_API[r] || r;
    patch({ reportRange: apiRange });
    void loadReports(apiRange).catch((err) => fail(err));
  };

  const exportReport = () => {
    void run(async () => {
      await downloadCsv('/admin/reports/export', { range: RANGE_API[stateRef.current.reportRange] || 'this_month' });
    }, 'Report exported as CSV');
  };

  const setMemberFilter = (k: string) => {
    patch({ memberFilter: k });
    void loadMembers({ filter: k }).catch((err) => fail(err));
  };
  const setPayFilter = (k: string) => {
    patch({ payFilter: k });
    void loadPayments(k).catch((err) => fail(err));
  };
  const setSubFilter = (k: string) => {
    patch({ subFilter: k });
    void loadSubscriptions(k).catch((err) => fail(err));
  };
  const setPlotFilter = (k: string) => {
    patch({ plotFilter: k });
    void loadPlots(k).catch((err) => fail(err));
  };
  const setDeliveryFilter = (k: string) => {
    patch({ deliveryFilter: k });
    void loadDeliveries(k).catch((err) => fail(err));
  };
  const setDrawerTab = (t: AppState['drawerTab']) => patch({ drawerTab: t });

  const handlePending = (href: Record<string, string>) => {
    if (href.paymentId) return markPaid(href.paymentId);
    const tab = HREF_TAB[href.tab] || (href.tab as TabKey);
    if (tab) go(tab);
    if (href.ticketId) {
      patch({ openTicket: href.ticketId });
    }
    if (href.memberId && tab === 'members') openDrawer(href.memberId);
  };

  const helpers = { member, plot, plan, crop, farm, basket, actor, planName, plotName, paymentOf };

  const actions = {
    go,
    openDrawer,
    closeDrawer,
    closeModal,
    closeReceipt,
    setModal,
    selectRole: (_id: string) => undefined,
    doLogin,
    logout,
    onSearch,
    markPaid,
    doMarkPaid,
    payReminder,
    refundPay,
    doRefund,
    showReceipt,
    openCreatePay,
    doCreatePay,
    memberAction,
    doMemberAction,
    sendMemberNotif,
    onModalField,
    drawerAct,
    openAssignPlot,
    openChangePlan,
    doSubAction,
    runModal,
    plotDetail,
    assignPlot,
    doAssign,
    advanceStage,
    addSupplement,
    advanceBasket,
    dupBasket,
    deliveryStep,
    deliveryAct,
    resolveCancel,
    subAction,
    chooseTemplate,
    chooseAudience,
    chooseChannel,
    setNotifTitle,
    setNotifBody,
    setNotifMember,
    sendNotif2,
    openTicketRow,
    setTicketReply,
    sendReply,
    ticketAct,
    setReportRange,
    exportReport,
    setMemberFilter,
    setPayFilter,
    setSubFilter,
    setPlotFilter,
    setDeliveryFilter,
    setDrawerTab,
    flash,
    handlePending,
  };

  return { state, helpers, actions };
}

const PILL_LABELS: Record<string, string> = {
  active: 'Active',
  pending: 'Membership unpaid',
  suspended: 'Suspended',
  cancelled: 'Cancelled',
  paused: 'Paused',
  paid: 'Paid',
  overdue: 'Overdue',
  failed: 'Failed',
  refunded: 'Refunded',
  pending_activation: 'Pending activation',
  renewal_due: 'Renewal due',
  payment_pending: 'Payment pending',
  expired: 'Expired',
  none: 'No subscription',
  available: 'Available',
  reserved: 'Reserved',
  leased: 'Leased',
  cultivating: 'Cultivating',
  harvesting: 'Harvesting',
  maintenance: 'Maintenance',
  unavailable: 'Unavailable',
  planned: 'Planned',
  growing: 'Growing',
  flowering: 'Flowering',
  fruiting: 'Fruiting',
  ready: 'Ready',
  harvested: 'Harvested',
  scheduled: 'Scheduled',
  packed: 'Packed',
  ready_dispatch: 'Ready to dispatch',
  out: 'Out for delivery',
  delivered: 'Delivered',
  rescheduled: 'Rescheduled',
  draft: 'Draft',
  review: 'In review',
  locked: 'Locked',
  published: 'Published',
  open: 'Open',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
};
function pillLabel(kind: string): string {
  return PILL_LABELS[kind] || kind;
}

export type AppLogic = ReturnType<typeof useAppLogic>;
