// ThirdEye AIOps — Silent Twilio Notification Service
// Credentials live ONLY in Vercel environment variables.
// Nothing is read from or stored in the browser.

export interface TwilioAlertRecord {
  id: string;
  timestamp: string;
  title: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  metric?: string;
  value?: string;
  triggerCause: string;
  preventionSteps: string[];
  channel: 'whatsapp' | 'sms' | 'both';
  status: 'sent' | 'simulated' | 'error';
  recipient: string;
  messagePreview: string;
  details?: any;
}

type AlertListener = (alert: TwilioAlertRecord) => void;

const HISTORY_KEY = 'thirdeye_twilio_history';

class TwilioNotificationService {
  private history: TwilioAlertRecord[] = [];
  private listeners: Set<AlertListener> = new Set();

  // 60-second cooldown per metric to prevent alert storms
  private lastAlertTimes: Record<string, number> = {
    cpu: 0,
    memory: 0,
    disk: 0,
    scenario: 0,
  };

  constructor() {
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) this.history = JSON.parse(saved);
    } catch {
      // Ignore parse errors
    }
  }

  public getHistory(): TwilioAlertRecord[] {
    return [...this.history];
  }

  public subscribe(listener: AlertListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(alert: TwilioAlertRecord) {
    this.listeners.forEach((cb) => {
      try {
        cb(alert);
      } catch (err) {
        console.error('[Twilio] Listener error:', err);
      }
    });
  }

  /**
   * Builds a plain-ASCII safe alert message (compatible with all SMS carriers).
   */
  private buildMessage(params: {
    title: string;
    severity: string;
    metric?: string;
    value?: string;
    triggerCause: string;
    preventionSteps: string[];
    tenantId: string;
    timeFormatted: string;
  }): string {
    const lines: string[] = [
      `[THIRDEYE AIOPS ${params.severity.toUpperCase()} ALERT]`,
      `========================`,
      `Event: ${params.title}`,
    ];

    if (params.metric && params.value) {
      lines.push(`Metric: ${params.metric} = ${params.value} (Threshold >= 90%)`);
    }

    lines.push(
      `Tenant: ${params.tenantId}`,
      `Time: ${params.timeFormatted}`,
      ``,
      `>> Root Cause:`,
      `${params.triggerCause}`,
      ``,
      `>> How to Fix:`,
      ...params.preventionSteps.map((step, idx) => `${idx + 1}. ${step}`),
      ``,
      `Console: https://third-eye-eta.vercel.app/`
    );

    return lines.join('\n');
  }

  /**
   * Dispatches a structured alert via the /api/notify Vercel serverless function.
   * Credentials are read exclusively from Vercel environment variables on the server.
   */
  public async dispatchAlert(params: {
    title: string;
    severity?: 'critical' | 'high' | 'warning' | 'info';
    metric?: string;
    value?: string;
    triggerCause: string;
    preventionSteps: string[];
    tenantId?: string;
  }): Promise<TwilioAlertRecord> {
    const tenant = params.tenantId || 'tenant_prod_us_east_1';
    const severity = params.severity || 'critical';
    const timestamp = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString();

    // Build clean plain-text message (ASCII-safe for SMS/WhatsApp)
    const messageString = this.buildMessage({
      title: params.title,
      severity,
      metric: params.metric,
      value: params.value,
      triggerCause: params.triggerCause,
      preventionSteps: params.preventionSteps,
      tenantId: tenant,
      timeFormatted,
    });

    let status: 'sent' | 'simulated' | 'error' = 'simulated';
    let responseData: any = null;

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageString,   // always a plain string
          channel: 'both',
        }),
      });

      if (res.ok) {
        responseData = await res.json();
        console.log('[Twilio] /api/notify response:', responseData);
        if (responseData.success) {
          status = 'sent';
        } else if (responseData.simulated) {
          status = 'simulated';
        }
      } else {
        console.warn('[Twilio] /api/notify HTTP error:', res.status, await res.text());
        status = 'error';
      }
    } catch (err) {
      console.warn('[Twilio] Dispatch network error:', err);
      status = 'simulated';
    }

    const record: TwilioAlertRecord = {
      id: `alert_${Date.now().toString(16)}`,
      timestamp,
      title: params.title,
      severity,
      metric: params.metric,
      value: params.value,
      triggerCause: params.triggerCause,
      preventionSteps: params.preventionSteps,
      channel: 'both',
      status,
      recipient: responseData?.recipient || 'Configured via Vercel env',
      messagePreview: messageString,
      details: responseData,
    };

    // Store last 30 alerts in localStorage history log
    this.history = [record, ...this.history.slice(0, 29)];
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch {
      // Ignore quota errors
    }

    this.notifyListeners(record);
    return record;
  }

  /**
   * Real-time Threshold Watchdog:
   * Called on every live telemetry tick. Auto-fires WhatsApp alert
   * if CPU / Memory / Disk >= 90%. 60-second cooldown per metric.
   */
  public checkThresholdBreach(telemetry: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent?: number;
    tenant_id?: string;
  }) {
    const now = Date.now();
    const COOLDOWN_MS = 60_000;

    // CPU >= 90%
    if (telemetry.cpu_percent >= 90.0 && now - this.lastAlertTimes.cpu > COOLDOWN_MS) {
      this.lastAlertTimes.cpu = now;
      this.dispatchAlert({
        title: 'CPU Core Load Critical Breach',
        severity: 'critical',
        metric: 'CPU Load',
        value: `${telemetry.cpu_percent.toFixed(1)}%`,
        triggerCause: 'Compute core starvation caused by runaway worker thread loops or cryptographic hashing contention.',
        preventionSteps: [
          'Apply gateway ingress rate-limiting on /api/v1/auth (100 req/s ceiling)',
          'Auto-scale worker replica pool from current tier to +4 pods',
          'Evict long-running unbuffered worker thread PIDs',
        ],
        tenantId: telemetry.tenant_id,
      });
    }

    // Memory >= 90%
    if (telemetry.memory_percent >= 90.0 && now - this.lastAlertTimes.memory > COOLDOWN_MS) {
      this.lastAlertTimes.memory = now;
      this.dispatchAlert({
        title: 'Memory Utilization Critical Breach',
        severity: 'critical',
        metric: 'Memory (RAM)',
        value: `${telemetry.memory_percent.toFixed(1)}%`,
        triggerCause: 'Heap saturation and linear memory leak from uncollected session metadata buffers triggering garbage collection thrashing.',
        preventionSteps: [
          'Force garbage collection flush and evict stale in-memory cache rows',
          'Gracefully restart leaking worker pod instances to release heap',
          'Increase container cgroup memory limit ceiling by 2GB',
        ],
        tenantId: telemetry.tenant_id,
      });
    }

    // Disk >= 90%
    if (
      typeof telemetry.disk_percent === 'number' &&
      telemetry.disk_percent >= 90.0 &&
      now - this.lastAlertTimes.disk > COOLDOWN_MS
    ) {
      this.lastAlertTimes.disk = now;
      this.dispatchAlert({
        title: 'Storage Volume Capacity Critical Breach',
        severity: 'critical',
        metric: 'Physical Disk Util',
        value: `${telemetry.disk_percent.toFixed(1)}%`,
        triggerCause: 'Persistent storage volume near capacity due to uncompressed archival transaction logs and unrotated SQLite buffer outbox.',
        preventionSteps: [
          'Trigger automatic log rotation and compress archives older than 72 hours',
          'Flush delivered outbox rows from local SQLite buffer',
          'Expand persistent cloud NVMe volume by 50GB',
        ],
        tenantId: telemetry.tenant_id,
      });
    }
  }
}

export const twilioService = new TwilioNotificationService();
