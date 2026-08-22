import type { TabKey } from '../types';

export const TAB_MODULE: Record<TabKey, string> = {
  dashboard: 'dashboard',
  members: 'members',
  payments: 'payments',
  subs: 'subscriptions',
  plots: 'plots',
  crops: 'crops',
  basket: 'baskets',
  deliveries: 'deliveries',
  cancellations: 'cancellations',
  notifs: 'notifications',
  support: 'support',
  reports: 'reports',
  audit: 'audit',
};

const ROLE_MODULES: Record<string, string[]> = {
  super_admin: Object.values(TAB_MODULE),
  farm_manager: ['dashboard', 'plots', 'crops', 'baskets', 'members', 'audit'],
  billing_manager: ['dashboard', 'members', 'payments', 'subscriptions', 'reports', 'audit'],
  delivery_manager: ['dashboard', 'deliveries', 'cancellations', 'members', 'baskets', 'audit'],
  support_agent: ['dashboard', 'members', 'notifications', 'support', 'audit'],
};

export function canAccessTab(role: string | undefined, tab: TabKey): boolean {
  if (!role || role === 'super_admin') return true;
  const modules = ROLE_MODULES[role] || ROLE_MODULES.super_admin;
  return modules.includes(TAB_MODULE[tab]);
}

export const HREF_TAB: Record<string, TabKey> = {
  dashboard: 'dashboard',
  members: 'members',
  payments: 'payments',
  subscriptions: 'subs',
  plots: 'plots',
  crops: 'crops',
  baskets: 'basket',
  deliveries: 'deliveries',
  cancellations: 'cancellations',
  notifications: 'notifs',
  support: 'support',
  reports: 'reports',
  audit: 'audit',
};
