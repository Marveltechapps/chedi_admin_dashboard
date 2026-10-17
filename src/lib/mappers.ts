import { formatDay, capitalize } from './dates';
import type {
  AuditEntry,
  Basket,
  Cancellation,
  Crop,
  Cultivation,
  DashboardData,
  Delivery,
  Farm,
  Member,
  Payment,
  Plan,
  Plot,
  PlotImage,
  ReportData,
  SentNotif,
  TeamMember,
  Ticket,
} from '../types';

function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function mapStaff(dto: Record<string, unknown>): TeamMember {
  return {
    id: str(dto.id),
    name: str(dto.name),
    email: str(dto.email),
    role: str(dto.roleLabel || dto.role),
    roleKey: str(dto.role),
    roleLabel: str(dto.roleLabel || dto.role),
    initial: str(dto.initial || String(dto.name || 'A')[0]).toUpperCase(),
    scope: str(dto.scope),
    active: dto.active !== false,
  };
}

export function mapPlan(dto: Record<string, unknown>): Plan {
  const boxes = num(dto.boxesPerWeek, 1);
  const plots = num(dto.plotCount, 1);
  const features = Array.isArray(dto.features) ? dto.features.map(String) : [];
  return {
    key: str(dto.key),
    name: str(dto.name),
    price: num(dto.priceInr),
    boxes,
    plots,
    detail: features[0] || `${plots} plot · ${boxes} box/wk`,
  };
}

export function mapMember(dto: Record<string, unknown>): Member {
  return {
    id: str(dto.id),
    memberCode: str(dto.memberCode),
    name: str(dto.name),
    phone: str(dto.phoneDisplay || dto.phone),
    email: str(dto.email),
    city: str(dto.city),
    address: str(dto.addressDisplay || dto.addressLine),
    joined: str(dto.joinedLabel),
    status: (dto.accountStatus || 'pending') as Member['status'],
    subStatus: (dto.subStatus || 'none') as Member['subStatus'],
    planKey: dto.planKey ? str(dto.planKey) : null,
    plotKey: dto.plotKey ? str(dto.plotKey) : null,
    planName: dto.planName ? str(dto.planName) : null,
    plotName: dto.plotName ? str(dto.plotName) : null,
    cycleStart: str(dto.cycleStartLabel),
    cycleEnd: str(dto.cycleEndLabel),
    activeSubscriptionId: dto.activeSubscriptionId ? str(dto.activeSubscriptionId) : null,
    welcomeBasket: mapWelcome(dto.welcomeBasket),
  };
}

function mapWelcome(value: unknown): Member['welcomeBasket'] {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const status = str(row.status);
  if (!status) return null;
  return {
    status,
    etaLabel: str(row.etaLabel),
    description: str(row.description) === 'Seasonal vegetable sample box' || !str(row.description)
      ? 'Token of Love'
      : str(row.description),
  };
}

export function mapFarm(dto: Record<string, unknown>): Farm {
  return {
    id: str(dto.id),
    name: str(dto.name),
    region: str(dto.region),
    farmer: str(dto.farmer),
    plotCount: num(dto.plotCount),
    leasedCount: num(dto.leasedCount),
  };
}

function mapGallery(value: unknown): PlotImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asRecord(item);
      return { label: str(row.label), imageUrl: str(row.imageUrl || row.img) };
    })
    .filter((row) => row.imageUrl);
}

export function mapPlot(dto: Record<string, unknown>): Plot {
  return {
    key: str(dto.key),
    name: str(dto.name),
    farmId: str(dto.farmId),
    size: str(dto.size),
    status: (dto.opsStatus || dto.status || 'available') as Plot['status'],
    memberId: dto.memberId ? str(dto.memberId) : null,
    cropKey: dto.cropKey ? str(dto.cropKey) : null,
    plantDate: formatDay(dto.plantDate ? str(dto.plantDate) : '') || str(dto.plantDate),
    harvestDate: formatDay(dto.harvestDate ? str(dto.harvestDate) : '') || str(dto.harvestDate),
    stage: (dto.cropStage || 'planned') as Plot['stage'],
    cropName: dto.cropName ? str(dto.cropName) : null,
    cropLabel: str(dto.crop),
    memberName: dto.memberName ? str(dto.memberName) : null,
    farmerName: dto.farmerName ? str(dto.farmerName) : null,
    region: str(dto.region),
    city: str(dto.city),
    district: str(dto.district),
    stateName: str(dto.state),
    soil: str(dto.soil),
    imageUrl: str(dto.imageUrl),
    gallery: mapGallery(dto.gallery),
    totalUnits: num(dto.totalUnits),
    availableUnits: num(dto.availableUnits),
    targetYield: dto.targetYield == null ? null : num(dto.targetYield),
    actualYield: dto.actualYield == null ? null : num(dto.actualYield),
    unit: str(dto.unit, 'kg'),
  };
}

export function mapCrop(dto: Record<string, unknown>): Crop {
  return { key: str(dto.key), name: str(dto.name), season: str(dto.season), unit: str(dto.unit, 'kg') };
}

const CONTEXT_TYPE: Record<string, Payment['type']> = {
  membership: 'membership',
  lease: 'subscription',
  renewal: 'renewal',
  delivery: 'delivery',
};

export function mapPayment(dto: Record<string, unknown>): Payment {
  return {
    id: str(dto.id),
    ref: str(dto.ref),
    memberId: str(dto.memberId),
    memberName: str(dto.memberName),
    type: CONTEXT_TYPE[str(dto.context)] || 'membership',
    context: str(dto.context),
    desc: str(dto.label),
    amount: num(dto.amountInr),
    date: formatDay(str(dto.date)) || str(dto.date),
    due: formatDay(str(dto.dueDate)) || str(dto.dueDate),
    status: (dto.opsStatus || 'pending') as Payment['status'],
    method: str(dto.method),
    collected: formatDay(str(dto.collectedAt)) || str(dto.collectedAt),
    plotKey: str((dto.metadata as Record<string, unknown> | undefined)?.plotKey),
    planKey: str((dto.metadata as Record<string, unknown> | undefined)?.planKey),
  };
}

export function mapBasket(dto: Record<string, unknown>): Basket {
  const items = Array.isArray(dto.items) ? dto.items : [];
  return {
    id: str(dto.id),
    week: str(dto.weekLabel || dto.week),
    status: (dto.status || 'draft') as Basket['status'],
    items: items.map((it: Record<string, unknown>) => ({
      cropKey: str(it.cropKey),
      cropName: str(it.cropName),
      qty: num(it.qty),
      unit: str(it.unit),
      supp: Boolean(it.supp),
    })),
  };
}

export function mapDelivery(dto: Record<string, unknown>): Delivery {
  return {
    id: str(dto.id),
    memberId: str(dto.memberId),
    memberName: str(dto.memberName),
    addressDisplay: str(dto.addressDisplay),
    plotKey: str(dto.plotKey),
    plotName: str(dto.plotName),
    basketId: str(dto.basketId),
    date: str(dto.dateLabel || dto.date),
    boxes: str(dto.boxesLabel || dto.boxes),
    status: (dto.opsStatus || dto.status || 'scheduled') as Delivery['status'],
  };
}

export function mapCancellation(dto: Record<string, unknown>): Cancellation {
  return {
    id: str(dto.id),
    deliveryId: str(dto.deliveryId),
    memberId: str(dto.memberId),
    memberName: str(dto.memberName),
    date: str(dto.dateLabel || dto.date),
    reason: str(dto.reason),
    locked: Boolean(dto.locked),
    status: (dto.status || 'pending') as Cancellation['status'],
    plotName: str(dto.plotName),
  };
}

export function mapTicket(dto: Record<string, unknown>): Ticket {
  const messages = Array.isArray(dto.messages) ? dto.messages : Array.isArray(dto.msgs) ? dto.msgs : [];
  return {
    id: str(dto.id),
    memberId: str(dto.memberId),
    memberName: str(dto.memberName),
    category: str(dto.category),
    subject: str(dto.subject),
    status: (dto.status || 'open') as Ticket['status'],
    assignee: str(dto.assigneeId || dto.assignee),
    assigneeName: str(dto.assigneeName),
    msgs: messages.map((m: Record<string, unknown>) => ({
      who: str(m.who),
      text: str(m.text),
      time: str(m.timeLabel || m.time),
    })),
  };
}

export function mapSent(dto: Record<string, unknown>): SentNotif {
  return {
    icon: str(dto.icon, 'bell'),
    title: str(dto.title),
    body: str(dto.body),
    aud: str(dto.audienceLabel || dto.audience),
    channel: capitalize(str(dto.channel)),
    time: str(dto.timeLabel),
  };
}

export function mapAudit(dto: Record<string, unknown>): AuditEntry {
  return {
    time: str(dto.timeLabel),
    actor: str(dto.actorName || dto.actor),
    action: str(dto.action),
    entity: str(dto.entity),
    detail: str(dto.detail),
  };
}

export function mapCultivation(dto: Record<string, unknown>): Cultivation {
  return {
    plotKey: str(dto.plotKey),
    plotName: str(dto.plotName),
    cropKey: str(dto.cropKey),
    cropName: str(dto.cropName),
    unit: str(dto.unit, 'kg'),
    plantDate: str(dto.plantDate).slice(0, 10),
    harvestDate: str(dto.harvestDate).slice(0, 10),
    cropStage: (dto.cropStage || 'planned') as Cultivation['cropStage'],
    targetYield: num(dto.targetYield),
    actualYield: dto.actualYield == null ? null : num(dto.actualYield),
    shortfall: Boolean(dto.shortfall),
    canAdvance: Boolean(dto.canAdvance),
    nextStage: dto.nextStage ? (str(dto.nextStage) as Cultivation['cropStage']) : null,
  };
}

export function mapDashboard(dto: Record<string, unknown>): DashboardData {
  const kpis = (dto.kpis || {}) as Record<string, unknown>;
  const pending = Array.isArray(dto.pendingActions) ? dto.pendingActions : [];
  const activity = Array.isArray(dto.recentActivity) ? dto.recentActivity : [];
  return {
    kpis: {
      totalMembers: num(kpis.totalMembers),
      activeMembers: num(kpis.activeMembers),
      pendingPayments: num(kpis.pendingPayments),
      pendingPaymentsAmountFormatted: str(kpis.pendingPaymentsAmountFormatted, '₹0'),
      activeSubscriptions: num(kpis.activeSubscriptions),
      renewalsDue: num(kpis.renewalsDue),
      plotsLeased: num(kpis.plotsLeased),
      plotsTotal: num(kpis.plotsTotal),
      plotsAvailable: num(kpis.plotsAvailable),
      upcomingDeliveries: num(kpis.upcomingDeliveries),
      revenueCollectedFormatted: str(kpis.revenueCollectedFormatted, '₹0'),
      pendingActionCount: num(kpis.pendingActionCount),
    },
    pendingActions: pending.map((a: Record<string, unknown>) => ({
      kind: str(a.kind),
      severity: str(a.severity),
      title: str(a.title),
      description: str(a.description),
      cta: str(a.cta),
      href: (a.href || {}) as Record<string, string>,
    })),
    recentActivity: activity.map(mapAudit),
  };
}

export function mapReports(dto: Record<string, unknown>): ReportData {
  const revenue = (dto.revenue || {}) as Record<string, unknown>;
  const newMembers = (dto.newMembers || {}) as Record<string, unknown>;
  const active = (dto.activeSubscriptions || {}) as Record<string, unknown>;
  const collected = (dto.paymentsCollected || {}) as Record<string, unknown>;
  const deliveries = (dto.deliveries || {}) as Record<string, unknown>;
  const util = (dto.plotUtilization || {}) as Record<string, unknown>;
  const series = (v: unknown) => (Array.isArray(v) ? v.map((n) => num(n)) : []);
  return {
    range: str(dto.range, 'this_month'),
    rangeLabel: str(dto.rangeLabel, 'This month'),
    revenue: { amountFormatted: str(revenue.amountFormatted, '₹0'), series: series(revenue.series) },
    newMembers: { count: num(newMembers.count), series: series(newMembers.series) },
    activeSubscriptions: { count: num(active.count), renewalsDue: num(active.renewalsDue), series: series(active.series) },
    paymentsCollected: { count: num(collected.count), outstanding: num(collected.outstanding), series: series(collected.series) },
    deliveries: { delivered: num(deliveries.delivered), failed: num(deliveries.failed), series: series(deliveries.series) },
    plotUtilization: { percent: num(util.percent), available: num(util.available), series: series(util.series) },
  };
}

export function asRecords(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  return [];
}

export function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
}
