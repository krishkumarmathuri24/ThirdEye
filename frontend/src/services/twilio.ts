export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Twilio phone number or Sandbox number
  recipientNumber: string; // User's mobile number
  channel: 'whatsapp' | 'sms' | 'both';
  enabled: boolean;
}

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

const STORAGE_KEY = 'thirdeye_twilio_config';
const HISTORY_KEY = 'thirdeye_twilio_history';

class TwilioNotificationService {
  private config: TwilioConfig = {
    accountSid: '',
    authToken: '',
    phoneNumber: '+14155238886', // Twilio WhatsApp Sandbox default
    recipientNumber: '',
    channel: 'both',
    enabled: true,
  };

  private history: TwilioAlertRecord[] = [];
  private listeners: Set<AlertListener> = new Set();

  // Cooldown timers for automatic >=90% thresholds (60s cooldown per metric)
  private lastAlertTimes: Record<string, number> = {
    cpu: 0,
    memory: 0,
    disk: 0,
    scenario: 0,
  };

  constructor() {
    this.loadConfig();
    this.loadHistory();
  }

  public loadConfig(): TwilioConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore
    }
    return this.config;
  }

  public saveConfig(newConfig: Partial<TwilioConfig>): TwilioConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore
    }
    return this.config;
  }

  public getConfig(): TwilioConfig {
    return { ...this.config };
  }

  public loadHistory(): TwilioAlertRecord[] {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return this.history;
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
        console.error('Error in Twilio alert listener:', err);
      }
    });
  }

  /**
   * Dispatches a structured alert message via WhatsApp, SMS, or Both
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

    // Format professional WhatsApp/SMS alert
    const message = [
      `🚨 [THIRDEYE AIOPS ${severity.toUpperCase()}]`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `Event: ${params.title}`,
      params.metric && params.value ? `Metric: ${params.metric} = ${params.value} (Threshold >= 90%)` : null,
      `Tenant: ${tenant} | Time: ${timeFormatted}`,
      ``,
      `⚠️ Trigger & Root Cause:`,
      `${params.triggerCause}`,
      ``,
      `🛡️ How to Prevent & Remediate:`,
      ...params.preventionSteps.map((step, idx) => `${idx + 1}. ${step}`),
      ``,
      `Console: https://third-eye-eta.vercel.app/`
    ]
      .filter((line) => line !== null)
      .join('\n');

    let status: 'sent' | 'simulated' | 'error' = 'simulated';
    let responseData: any = null;

    // Send via Vercel serverless function or direct backend
    try {
      const endpoint = '/api/notify';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSid: this.config.accountSid,
          authToken: this.config.authToken,
          from: this.config.phoneNumber || '+14155238886',
          to: this.config.recipientNumber,
          channel: this.config.channel,
          message: message,
        }),
      });

      if (res.ok) {
        responseData = await res.json();
        if (responseData.success) {
          status = 'sent';
        } else if (responseData.simulated) {
          status = 'simulated';
        }
      }
    } catch (err) {
      console.warn('[Twilio] Notification dispatch network notice:', err);
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
      channel: this.config.channel,
      status,
      recipient: this.config.recipientNumber || 'Not Configured (Preview Mode)',
      messagePreview: message,
      details: responseData,
    };

    // Prepend to history (keep last 30)
    this.history = [record, ...this.history.slice(0, 29)];
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch {
      // Ignore
    }

    this.notifyListeners(record);
    return record;
  }

  /**
   * Real-time Threshold Watchdog:
   * Called every time telemetry updates. If CPU, Memory, or Disk >= 90%, automatically triggers alerts!
   */
  public checkThresholdBreach(telemetry: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent?: number;
    tenant_id?: string;
  }) {
    if (!this.config.enabled) return;

    const now = Date.now();
    const COOLDOWN_MS = 60000; // 60 seconds debounce per metric

    // 1. Check CPU >= 90%
    if (telemetry.cpu_percent >= 90.0 && now - this.lastAlertTimes.cpu > COOLDOWN_MS) {
      this.lastAlertTimes.cpu = now;
      this.dispatchAlert({
        title: 'CPU Core Load Critical Breach',
        severity: 'critical',
        metric: 'CPU Load',
        value: `${telemetry.cpu_percent.toFixed(1)}%`,
        triggerCause:
          'Compute core starvation caused by runaway worker thread loops or cryptographic hashing contention.',
        preventionSteps: [
          'Apply gateway ingress rate-limiting on /api/v1/auth (100 req/s ceiling)',
          'Auto-scale worker replica pool from current tier to +4 pods',
          'Evict long-running unbuffered worker thread PIDs'
        ],
        tenantId: telemetry.tenant_id,
      });
    }

    // 2. Check Memory >= 90%
    if (telemetry.memory_percent >= 90.0 && now - this.lastAlertTimes.memory > COOLDOWN_MS) {
      this.lastAlertTimes.memory = now;
      this.dispatchAlert({
        title: 'Memory Utilization Critical Breach',
        severity: 'critical',
        metric: 'Memory (RAM)',
        value: `${telemetry.memory_percent.toFixed(1)}%`,
        triggerCause:
          'Heap saturation and linear memory leak from uncollected session metadata buffers triggering garbage collection thrashing.',
        preventionSteps: [
          'Force garbage collection flush and evict stale in-memory cache rows',
          'Gracefully restart leaking worker pod instances to release heap',
          'Increase container cgroup memory limit ceiling by 2GB'
        ],
        tenantId: telemetry.tenant_id,
      });
    }

    // 3. Check Disk >= 90%
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
        triggerCause:
          'Persistent storage volume near capacity due to uncompressed archival transaction logs and unrotated SQLite buffer outbox.',
        preventionSteps: [
          'Trigger automatic log rotation and compress archives older than 72 hours',
          'Flush delivered outbox rows from local SQLite buffer',
          'Expand persistent cloud NVMe volume by 50GB'
        ],
        tenantId: telemetry.tenant_id,
      });
    }
  }
}

export const twilioService = new TwilioNotificationService();
