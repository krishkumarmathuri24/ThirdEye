import React, { useState, useEffect } from 'react';
import { NavigationHeader } from './components/NavigationHeader';
import { TrustDashboard } from './components/TrustDashboard';
import { PrivacyTransparencyCenter } from './components/PrivacyTransparencyCenter';
import { EgressProofPanel } from './components/EgressProofPanel';
import { IncidentCenter } from './components/IncidentCenter';
import { ForecastingPanel } from './components/ForecastingPanel';
import { SafeRemediationHub } from './components/SafeRemediationHub';
import { LiveScenarioController } from './components/LiveScenarioController';
import { InfrastructureCopilot } from './components/InfrastructureCopilot';
import { AuditLogViewer } from './components/AuditLogViewer';
import Demo from './components/ui/demo';
import { ThirdEyeEmbedWidget } from './components/ThirdEyeEmbedWidget';
import { WebsiteIntegrationHub } from './components/WebsiteIntegrationHub';

import { TelemetryData, TrustScores, HealthState, SecurityState } from './types';
import { api } from './services/api';
import { realtimeService } from './services/realtime';

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const urlTenant = queryParams.get('tenant') || 'tenant_prod_us_east_1';
  const embedMode = queryParams.get('mode') === 'embed' || queryParams.get('mode') === 'widget' || window.location.pathname.startsWith('/embed');
  const embedTheme = (queryParams.get('theme') as 'dark' | 'light') || 'dark';

  const [activeTab, setActiveTab] = useState('trust');
  const [tenantId, setTenantId] = useState(urlTenant);
  const [isConnected, setIsConnected] = useState(false);

  // Live state
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [trustScores, setTrustScores] = useState<TrustScores | null>(null);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [security, setSecurity] = useState<SecurityState | null>(null);
  const [activeIncidentsCount, setActiveIncidentsCount] = useState(0);

  // Initial fetch on mount / tenant change
  const fetchAllData = async () => {
    try {
      const [t, ts, h, s, incs] = await Promise.all([
        api.getLatestTelemetry(tenantId).catch(() => null),
        api.getTrustScores(tenantId).catch(() => null),
        api.getHealth(tenantId).catch(() => null),
        api.getSecurity(tenantId).catch(() => null),
        api.getIncidents(tenantId, 'active').catch(() => [])
      ]);

      if (t) setTelemetry(t);
      if (ts) setTrustScores(ts);
      if (h) setHealth(h);
      if (s) setSecurity(s);
      if (incs) setActiveIncidentsCount(incs.length);
    } catch (err) {
      console.error('Error fetching initial platform state:', err);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Connect Realtime Event Feed (Zero polling, sub-second latency)
    realtimeService.connect(tenantId);
    setIsConnected(true);

    // Subscribe to all 11 real-time channels
    const unsubTelemetry = realtimeService.subscribe('telemetry_updates', (data: TelemetryData) => {
      setTelemetry(data);
    });

    const unsubTrust = realtimeService.subscribe('trust_updates', (data: TrustScores) => {
      setTrustScores(data);
    });

    const unsubHealth = realtimeService.subscribe('health_updates', (data: HealthState) => {
      setHealth(data);
    });

    const unsubSecurity = realtimeService.subscribe('security_updates', (data: SecurityState) => {
      setSecurity(data);
    });

    const unsubIncidents = realtimeService.subscribe('incident_updates', () => {
      api.getIncidents(tenantId, 'active')
        .then((incs) => setActiveIncidentsCount(incs.length))
        .catch(() => {});
    });

    return () => {
      unsubTelemetry();
      unsubTrust();
      unsubHealth();
      unsubSecurity();
      unsubIncidents();
      realtimeService.disconnect();
      setIsConnected(false);
    };
  }, [tenantId]);

  // If embedded in external company website
  if (embedMode) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-2">
        <ThirdEyeEmbedWidget tenantId={tenantId} theme={embedTheme} />
      </div>
    );
  }

  // If active tab is SaaS landing overview, render the requested UI component
  if (activeTab === 'landing') {
    return (
      <div className="relative">
        <div className="fixed top-20 right-6 z-50">
          <button
            onClick={() => setActiveTab('trust')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            ← Back to Live AIOps Console
          </button>
        </div>
        <Demo onLaunchApp={() => setActiveTab('trust')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <NavigationHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenantId={tenantId}
        setTenantId={setTenantId}
        isConnected={isConnected}
        activeIncidentsCount={activeIncidentsCount}
      />

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'trust' && (
          <TrustDashboard
            scores={trustScores}
            telemetry={telemetry}
            health={health}
            security={security}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacyTransparencyCenter tenantId={tenantId} />
        )}

        {activeTab === 'egress' && (
          <EgressProofPanel tenantId={tenantId} />
        )}

        {activeTab === 'incidents' && (
          <IncidentCenter tenantId={tenantId} />
        )}

        {activeTab === 'telemetry' && (
          <ForecastingPanel tenantId={tenantId} telemetry={telemetry} />
        )}

        {activeTab === 'remediation' && (
          <SafeRemediationHub tenantId={tenantId} />
        )}

        {activeTab === 'scenarios' && (
          <LiveScenarioController
            tenantId={tenantId}
            onScenarioTriggered={() => {
              fetchAllData();
            }}
          />
        )}

        {activeTab === 'copilot' && (
          <InfrastructureCopilot tenantId={tenantId} />
        )}

        {activeTab === 'audit' && (
          <AuditLogViewer tenantId={tenantId} />
        )}

        {activeTab === 'integrate' && (
          <WebsiteIntegrationHub tenantId={tenantId} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        Third Eye • Privacy-First Real-Time AIOps Observability Platform • Zero Raw Data SaaS Architecture
      </footer>
    </div>
  );
}
