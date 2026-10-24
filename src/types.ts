export type Route = 'login' | 'app';

export type MemberStatus = 'active' | 'pending' | 'suspended' | 'cancelled';
export type SubStatus =
  | 'active'
  | 'renewal_due'
  | 'payment_pending'
  | 'pending_activation'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'none';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleKey?: string;
  roleLabel?: string;
  initial: string;
  scope?: string;
  active?: boolean;
}

export interface Plan {
  key: string;
  name: string;
  price: number;
  boxes: number;
  plots: number;
  detail: string;
}

export interface Member {
  id: string;
  memberCode?: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  addressLine: string;
  pin: string;
  joined: string;
  status: MemberStatus;
  subStatus: SubStatus;
  planKey: string | null;
  plotKey: string | null;
  planName?: string | null;
  plotName?: string | null;
  cycleStart: string;
  cycleEnd: string;
  activeSubscriptionId?: string | null;
  welcomeBasket?: {
    status: string;
    etaLabel: string;
    description: string;
  } | null;
}

export interface Farm {
  id: string;
  name: string;
  region: string;
  farmer: string;
  plotCount?: number;
  leasedCount?: number;
}

export type PlotStatus =
  | 'available'
  | 'reserved'
  | 'leased'
  | 'cultivating'
  | 'harvesting'
  | 'maintenance'
  | 'unavailable';

export type CropStage = 'planned' | 'growing' | 'flowering' | 'fruiting' | 'ready' | 'harvested';

export interface PlotImage {
  label: string;
  imageUrl: string;
}

export interface Plot {
  key: string;
  name: string;
  farmId: string;
  size: string;
  status: PlotStatus;
  memberId: string | null;
  cropKey: string | null;
  plantDate: string;
  harvestDate: string;
  stage: CropStage;
  cropName?: string | null;
  cropLabel?: string;
  memberName?: string | null;
  farmerName?: string | null;
  region?: string;
  city?: string;
  district?: string;
  stateName?: string;
  soil?: string;
  imageUrl?: string;
  gallery?: PlotImage[];
  totalUnits?: number;
  availableUnits?: number;
  targetYield?: number | null;
  actualYield?: number | null;
  unit?: string;
}

export interface Crop {
  key: string;
  name: string;
  season: string;
  unit: string;
}

export interface Cultivation {
  plotKey: string;
  plotName: string;
  cropKey: string;
  cropName: string;
  unit: string;
  plantDate: string;
  harvestDate: string;
  cropStage: CropStage;
  targetYield: number;
  actualYield: number | null;
  shortfall: boolean;
  canAdvance: boolean;
  nextStage: CropStage | null;
}

export type PaymentType = 'membership' | 'subscription' | 'renewal' | 'delivery';
export type PaymentStatus = 'pending' | 'overdue' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export interface Payment {
  id: string;
  ref: string;
  memberId: string;
  memberName?: string;
  type: PaymentType;
  context?: string;
  desc: string;
  amount: number;
  date: string;
  due: string;
  status: PaymentStatus;
  method: string;
  collected: string;
  collectionRef?: string;
  plotKey?: string;
  planKey?: string;
}

export interface BasketItem {
  cropKey: string;
  cropName?: string;
  qty: number;
  unit?: string;
  supp: boolean;
}

export type BasketStatus = 'draft' | 'review' | 'locked' | 'published' | 'packed';

export interface Basket {
  id: string;
  week: string;
  status: BasketStatus;
  items: BasketItem[];
}

export type DeliveryStatus =
  | 'scheduled'
  | 'packed'
  | 'ready_dispatch'
  | 'out'
  | 'delivered'
  | 'received'
  | 'dispatched'
  | 'failed'
  | 'cancelled'
  | 'rescheduled';

export interface Delivery {
  id: string;
  memberId: string;
  memberName?: string;
  addressDisplay?: string;
  plotKey: string;
  plotName?: string;
  basketId: string;
  date: string;
  boxes: string;
  status: DeliveryStatus;
}

export interface Cancellation {
  id: string;
  deliveryId: string;
  memberId: string;
  memberName?: string;
  date: string;
  reason: string;
  locked: boolean;
  status: 'pending' | 'approved' | 'rejected';
  plotName?: string;
}

export interface TicketMsg {
  who: string;
  text: string;
  time: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  memberId: string;
  memberName?: string;
  category: string;
  subject: string;
  status: TicketStatus;
  assignee: string;
  assigneeName?: string;
  msgs: TicketMsg[];
}

export interface NotifTemplate {
  key: string;
  title: string;
  body: string;
}

export interface ComposedNotif {
  aud: string;
  channel: string;
  title: string;
  body: string;
  memberId: string | null;
}

export interface SentNotif {
  icon: string;
  title: string;
  body: string;
  aud: string;
  channel: string;
  time: string;
}

export interface AuditEntry {
  time: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
}

export interface ModalRow {
  k: string;
  v: string;
  w?: number;
}

export interface ModalState {
  kind: 'markPaid' | 'createPay' | 'member' | 'sub' | 'delivery' | 'assign' | 'info' | 'supplement';
  ref?: string;
  memberId?: string;
  plotKey?: string;
  sub?: string;
  ns?: MemberStatus;
  iconBg: string;
  icon: string;
  title: string;
  body: string;
  rows?: ModalRow[];
  fieldLabel?: string;
  fieldPh?: string;
  fieldVal?: string;
  fieldError?: string;
  selectLabel?: string;
  selectVal?: string | null;
  selectVal2?: string;
  assignOpts?: Member[];
  confirmLabel: string;
  confirmBg: string;
  confirmColor: string;
}

export interface ReceiptState {
  rows: ModalRow[];
  total: string;
}

export interface DashboardKpis {
  totalMembers: number;
  activeMembers: number;
  pendingPayments: number;
  pendingPaymentsAmountFormatted: string;
  activeSubscriptions: number;
  renewalsDue: number;
  plotsLeased: number;
  plotsTotal: number;
  plotsAvailable: number;
  upcomingDeliveries: number;
  revenueCollectedFormatted: string;
  pendingActionCount: number;
}

export interface PendingAction {
  kind: string;
  severity: string;
  title: string;
  description: string;
  cta: string;
  href: Record<string, string>;
}

export interface DashboardData {
  kpis: DashboardKpis;
  pendingActions: PendingAction[];
  recentActivity: AuditEntry[];
}

export interface ReportSeries {
  amountFormatted?: string;
  count?: number;
  series: number[];
}

export interface ReportData {
  range: string;
  rangeLabel: string;
  revenue: { amountFormatted: string; series: number[] };
  newMembers: { count: number; series: number[] };
  activeSubscriptions: { count: number; renewalsDue: number; series: number[] };
  paymentsCollected: { count: number; outstanding: number; series: number[] };
  deliveries: { delivered: number; failed: number; series: number[] };
  plotUtilization: { percent: number; available: number; series: number[] };
}

export interface TimelineItem {
  text: string;
  time: string;
  isLeaf: boolean;
}

export type TabKey =
  | 'dashboard'
  | 'members'
  | 'payments'
  | 'subs'
  | 'plots'
  | 'crops'
  | 'basket'
  | 'deliveries'
  | 'cancellations'
  | 'notifs'
  | 'support'
  | 'reports'
  | 'audit';

export interface AppState {
  route: Route;
  me: string;
  tab: TabKey;
  search: string;
  drawerId: string | null;
  drawerTab: 'profile' | 'payments' | 'deliveries' | 'timeline';
  modal: ModalState | null;
  receipt: ReceiptState | null;
  toast: string;
  bootstrapping: boolean;
  busy: boolean;
  payFilter: string;
  memberFilter: string;
  subFilter: string;
  plotFilter: string;
  deliveryFilter: string;
  openTicket: string;
  ticketReply: string;
  today: string;
  team: TeamMember[];
  plans: Plan[];
  members: Member[];
  subscribers: Member[];
  farms: Farm[];
  plots: Plot[];
  crops: Crop[];
  cultivations: Cultivation[];
  payments: Payment[];
  baskets: Basket[];
  deliveries: Delivery[];
  cancellations: Cancellation[];
  tickets: Ticket[];
  notifTemplates: NotifTemplate[];
  notif: ComposedNotif;
  sent: SentNotif[];
  audit: AuditEntry[];
  reportRange: string;
  dashboard: DashboardData | null;
  reports: ReportData | null;
  drawerPayments: Payment[];
  drawerDeliveries: Delivery[];
  drawerTimeline: TimelineItem[];
  memberCounts: Record<string, number>;
  payCounts: Record<string, number>;
  subCounts: Record<string, number>;
  plotCounts: Record<string, number>;
  deliveryCounts: Record<string, number>;
}
