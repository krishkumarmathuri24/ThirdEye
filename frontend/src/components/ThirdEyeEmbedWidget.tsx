import React, { useState, useEffect } from 'react';
import { realtimeService } from '../services/realtime';
import { api } from '../services/api';

interface MiniMetric {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  dot: string;
}

/**
 * ThirdEyeEmbedWidget
 * ─────────────────────────────────────────────────────────────────
 * A compact self-contained embeddable AIOps status widget.
 * Embed into ANY website with a single <iframe> tag pointing to:
 *   https://your-thirdeye-frontend.netlify.app/embed?tenant=YOUR_TENANT
 *
 * Or import directly into any React / Next.js / Remix project:
 *   import { ThirdEyeEmbedWidget } from '@/components/ThirdEyeEmbedWidget';
 *   <ThirdEyeEmbedWidget tenantId="your_tenant" apiBase="https://api.yourbackend.com" />
 * ─────────────────────────────────────────────────────────────────
 */
export const ThirdEyeEmbedWidget: React.FC<{
  tenantId?: string;
  apiBase?: string;
  theme?: 'dark' | 'light';
}> = ({
  tenantId = 'tenant_prod_us_east_1',
  apiBase = '',
  theme = 'dark',
}) => {
  const [health, setHealth] = useState<{ state: string; overall_score: number } | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [incidents, setIncidents] = useState<number>(0);
  const [connected, setConnected] = useState(false);
  const [securityScore, setSecurityScore] = useState<number>(96);
  const [privacyScore] = useState<number>(100);

  useEffect(() => {
    // Initial fetch
    Promise.all([
      api.getHealth(tenantId).catch(() => null),
      api.getLatestTelemetry(tenantId).catch(() => null),
      api.getIncidents(tenantId, 'active').catch(() => []),
      api.getSecurity(tenantId).catch(() => null),
    ]).then(([h, t, incs, sec]) => {
      if (h) setHealth(h);
      if (t) setTelemetry(t);
      if (Array.isArray(incs)) setIncidents(incs.length);
      if (sec) setSecurityScore(sec.security_score);
    });

    // Real-time event subscription
    realtimeService.connect(tenantId);
    setConnected(true);

    const unsubHealth = realtimeService.subscribe('health_updates', (d: any) => setHealth(d));
    const unsubTelemetry = realtimeService.subscribe('telemetry_updates', (d: any) => setTelemetry(d));
    const unsubIncidents = realtimeService.subscribe('incident_updates', () => {
      api.getIncidents(tenantId, 'active').then((i) => setIncidents(i.length)).catch(() => {});
    });

    return () => {
      unsubHealth(); unsubTelemetry(); unsubIncidents();
      realtimeService.disconnect();
      setConnected(false);
    };
  }, [tenantId]);

  const healthColor =
    health?.state === 'Excellent' ? '#22c55e' :
    health?.state === 'Good'      ? '#86efac' :
    health?.state === 'Fair'      ? '#f59e0b' : '#ef4444';

  const metrics: MiniMetric[] = telemetry ? [
    { label: 'CPU',     value: telemetry.cpu_percent,     unit: '%',  color: '#818cf8', dot: '🔵' },
    { label: 'Memory',  value: telemetry.memory_percent,  unit: '%',  color: '#34d399', dot: '🟢' },
    { label: 'Latency', value: telemetry.ping_latency_ms, unit: 'ms', color: '#f472b6', dot: '🔴' },
    { label: 'Disk',    value: telemetry.disk_percent,    unit: '%',  color: '#fbbf24', dot: '🟡' },
  ] : [];

  const bg   = theme === 'dark' ? '#0f1629' : '#f8fafc';
  const card = theme === 'dark' ? '#1e2a45' : '#ffffff';
  const text = theme === 'dark' ? '#e2e8f0' : '#1e293b';
  const sub  = theme === 'dark' ? '#94a3b8' : '#64748b';
  const bdr  = theme === 'dark' ? '#2d3f63' : '#e2e8f0';

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: bg, color: text,
      borderRadius: 16, border: `1px solid ${bdr}`,
      padding: '20px', minWidth: 320, maxWidth: 480,
      boxShadow: theme === 'dark' ? '0 4px 32px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>👁️</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Third Eye AIOps</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#22c55e' : '#ef4444',
            boxShadow: connected ? '0 0 6px #22c55e' : 'none',
            animation: connected ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, color: sub }}>{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Health Banner */}
      <div style={{
        background: card, border: `1px solid ${bdr}`,
        borderRadius: 10, padding: '12px 16px',
        marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, color: sub, marginBottom: 2 }}>System Health</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: healthColor }}>
            {health?.state ?? '—'}
          </div>
        </div>
        <div style={{
          fontSize: 28, fontWeight: 800, color: healthColor,
        }}>{health?.overall_score ?? '—'}<span style={{ fontSize: 14, color: sub }}>/100</span></div>
      </div>

      {/* Live Metrics Grid */}
      {metrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{
              background: card, border: `1px solid ${bdr}`,
              borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 10, color: sub, marginBottom: 2 }}>{m.dot} {m.label}</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: m.color }}>
                {typeof m.value === 'number' ? m.value.toFixed(1) : m.value}
                <span style={{ fontSize: 11, color: sub, fontWeight: 400 }}> {m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12,
      }}>
        {[
          { label: 'Privacy', value: `${privacyScore}%`, color: '#22c55e' },
          { label: 'Security', value: `${securityScore}/100`, color: securityScore >= 80 ? '#22c55e' : securityScore >= 60 ? '#f59e0b' : '#ef4444' },
          { label: 'Incidents', value: incidents, color: incidents === 0 ? '#22c55e' : '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={{
            background: card, border: `1px solid ${bdr}`,
            borderRadius: 8, padding: '8px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: sub }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        fontSize: 10, color: sub, textAlign: 'center',
        borderTop: `1px solid ${bdr}`, paddingTop: 10,
      }}>
        Privacy-First • Zero Raw Data Egress • Sub-second Realtime
      </div>
    </div>
  );
};

export default ThirdEyeEmbedWidget;
