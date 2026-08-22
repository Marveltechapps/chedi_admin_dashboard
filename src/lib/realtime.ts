import { io, type Socket } from 'socket.io-client';

export const REALTIME_EVENTS = [
  'customer:created',
  'customer:updated',
  'customer:deleted',
  'customer:profile_updated',
  'customer:address:created',
  'customer:address:updated',
  'customer:address:deleted',
  'payment:created',
  'payment:updated',
  'subscription:created',
  'subscription:updated',
  'delivery:updated',
  'notification:created',
  'plot:updated',
  'crop:updated',
  'basket:updated',
  'ticket:updated',
  'cancellation:updated',
  'payment_method:updated',
] as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[number];

export type RealtimePayload = Record<string, unknown> & {
  memberId?: string | null;
  occurredAt?: string;
};

function socketBaseUrl(): string | undefined {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return String(explicit).replace(/\/$/, '');
  const api = String(import.meta.env.VITE_API_URL || '/api');
  if (/^https?:\/\//i.test(api)) {
    return api.replace(/\/api\/v1\/?$/i, '').replace(/\/api\/?$/i, '');
  }
  return undefined;
}

let socket: Socket | null = null;
let connectingKind: 'admin' | 'member' | null = null;

export function getRealtimeSocket() {
  return socket;
}

export function connectRealtime(opts: {
  kind: 'admin' | 'member';
  getToken: () => string | null;
  onReconnect?: () => void;
  onAuthError?: () => void;
  onConnectError?: (message: string) => void;
}) {
  if (socket && connectingKind === opts.kind) {
    if (!socket.connected) socket.connect();
    return socket;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  connectingKind = opts.kind;
  let everConnected = false;

  socket = io(socketBaseUrl(), {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 8000,
    timeout: 12000,
    auth: (cb) => cb({ token: opts.getToken() || '' }),
  });

  socket.on('connect', () => {
    if (everConnected) opts.onReconnect?.();
    everConnected = true;
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      socket?.connect();
    }
  });

  socket.on('connect_error', (err) => {
    const code = (err as { data?: { code?: string } }).data?.code || '';
    const message = err?.message || 'Socket connection failed';
    if (code === 'UNAUTHORIZED' || /unauthorized|expired|invalid/i.test(message)) {
      opts.onAuthError?.();
    }
    opts.onConnectError?.(message);
  });

  return socket;
}

export function subscribeRealtime(
  events: readonly string[],
  handler: (event: string, payload: RealtimePayload) => void
) {
  if (!socket) return () => undefined;
  const wrapped: Array<[string, (payload: RealtimePayload) => void]> = [];
  for (const event of events) {
    const fn = (payload: RealtimePayload) => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;
      handler(event, payload);
    };
    socket.on(event, fn);
    wrapped.push([event, fn]);
  }
  return () => {
    for (const [event, fn] of wrapped) socket?.off(event, fn);
  };
}

export function disconnectRealtime() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  connectingKind = null;
}
