import { createClient, RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeChannelName =
  | 'telemetry_updates'
  | 'health_updates'
  | 'security_updates'
  | 'incident_updates'
  | 'recommendation_updates'
  | 'audit_updates'
  | 'remediation_updates'
  | 'collector_updates'
  | 'trust_updates'
  | 'privacy_updates'
  | 'forecast_updates';

type EventCallback = (data: any) => void;

class RealtimeService {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private eventSource: EventSource | null = null;
  private supabaseClient: any = null;
  private supabaseChannels: Map<string, RealtimeChannel> = new Map();
  private isConnected = false;
  private tenantId = 'tenant_prod_us_east_1';

  constructor() {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
      try {
        this.supabaseClient = createClient(supabaseUrl, supabaseKey);
        console.log('[Realtime] Supabase Realtime Client initialized.');
      } catch (err) {
        console.warn('[Realtime] Supabase init skipped, using primary Server-Sent stream.', err);
      }
    }
  }

  public subscribe(channel: RealtimeChannelName, callback: EventCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // If using Supabase Realtime client
    if (this.supabaseClient && !this.supabaseChannels.has(channel)) {
      const topic = `realtime:${this.tenantId}:${channel}`;
      const sub = this.supabaseClient.channel(topic)
        .on('broadcast', { event: 'update' }, (payload: any) => {
          this.emit(channel, payload.payload?.data || payload.payload);
        })
        .subscribe();
      this.supabaseChannels.set(channel, sub);
    }

    return () => {
      const set = this.listeners.get(channel);
      if (set) {
        set.delete(callback);
      }
    };
  }

  private emit(channel: string, data: any) {
    const callbacks = this.listeners.get(channel);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in listener for ${channel}:`, e);
        }
      });
    }
  }

  public connect(tenantId: string = 'tenant_prod_us_east_1') {
    this.tenantId = tenantId;
    if (this.eventSource) {
      this.eventSource.close();
    }

    // Connect to zero-polling sub-second stream
    // In production VITE_API_BASE_URL points to deployed backend; empty string in dev (Vite proxy)
    const backendBase = (import.meta as any).env?.VITE_API_BASE_URL || '';
    const url = `${backendBase}/api/v1/realtime/stream?tenant_id=${encodeURIComponent(tenantId)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.isConnected = true;
      console.log('[Realtime] Connected to live event-driven broadcast stream.');
    };

    const channels: RealtimeChannelName[] = [
      'telemetry_updates',
      'health_updates',
      'security_updates',
      'incident_updates',
      'recommendation_updates',
      'audit_updates',
      'remediation_updates',
      'collector_updates',
      'trust_updates',
      'privacy_updates',
      'forecast_updates'
    ];

    channels.forEach((ch) => {
      this.eventSource?.addEventListener(ch, (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          this.emit(ch, parsed.data);
        } catch (err) {
          console.error(`Failed to parse realtime event on ${ch}:`, err);
        }
      });
    });

    this.eventSource.onerror = (err) => {
      console.warn('[Realtime] Stream reconnecting...', err);
      this.isConnected = false;
    };
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.supabaseClient) {
      this.supabaseChannels.forEach((sub) => sub.unsubscribe());
      this.supabaseChannels.clear();
    }
    this.isConnected = false;
  }

  public getConnectedStatus(): boolean {
    return this.isConnected;
  }
}

export const realtimeService = new RealtimeService();
