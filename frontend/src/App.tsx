import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { NavigationSidebar } from './components/NavigationSidebar';
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
import { twilioService, TwilioAlertRecord } from './services/twilio';
import { supabase } from './services/supabase';

interface AuthUser {
  name: string;
  email: string;
  avatar?: string;
  method: string;
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Check existing Supabase session or cached demo login
  useEffect(() => {
    // 1. Check local demo session
    const savedDemo = localStorage.getItem('thirdeye_demo_user');
    if (savedDemo) {
      try {
        setAuthUser(JSON.parse(savedDemo));
      } catch {
        localStorage.removeItem('thirdeye_demo_user');
      }
    }

    // 2. Check active Supabase session (Google OAuth or Phone OTP)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser({
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            session.user.phone ||
            'User',
          email: session.user.email || session.user.phone || '',
          avatar: session.user.user_metadata?.avatar_url,
          method: session.user.app_metadata?.provider || 'google',
        });
      }
    });

    // 3. Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser({
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            session.user.phone ||
            'User',
          email: session.user.email || session.user.phone || '',
          avatar: session.user.user_metadata?.avatar_url,
          method: session.user.app_metadata?.provider || 'google',
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    if (user.method === 'demo') {
      localStorage.setItem('thirdeye_demo_user', JSON.stringify(user));
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('thirdeye_demo_user');
    await supabase.auth.signOut().catch(() => {});
    setAuthUser(null);
  };

  const queryParams = new URLSearchParams(window.location.search);
  const urlTenant = queryParams.get('tenant') || 'tenant_prod_us_east_1';
  const embedMode =
    queryParams.get('mode') === 'embed' ||
    queryParams.get('mode') === 'widget' ||
    window.location.pathname.startsWith('/embed');
  const embedTheme = (queryParams.get('theme') as 'dark' | 'light') || 'dark';

  // Open SaaS overview landing page first by default
  const [activeTab, setActiveTab] = useState('landing');
  const [tenantId, setTenantId] = useState(urlTenant);
  const [isConnected, setIsConnected] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<TwilioAlertRecord | null>(null);

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
        api.getIncidents(tenantId, 'active').catch(() => []),
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

    // Subscribe to real-time channels
    const unsubTelemetry = realtimeService.subscribe('telemetry_updates', (data: TelemetryData) => {
      setTelemetry(data);
      // Automatic Watchdog: if CPU, Memory, or Disk touches or exceeds 90%, automatically dispatch Twilio alerts!
      twilioService.checkThresholdBreach(data);
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

    // Subscribe to Twilio notification broadcasts
    const unsubAlerts = twilioService.subscribe((alert) => {
      setActiveAlert(alert);
      setTimeout(() => {
        setActiveAlert((curr) => (curr?.id === alert.id ? null : curr));
      }, 10000);
    });

    return () => {
      unsubTelemetry();
      unsubTrust();
      unsubHealth();
      unsubSecurity();
      unsubIncidents();
      unsubAlerts();
      realtimeService.disconnect();
      setIsConnected(false);
    };
  }, [tenantId]);

  // Show login page until authenticated
  if (!authUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // If embedded in external company website
  if (embedMode) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-2">
        <ThirdEyeEmbedWidget tenantId={tenantId} theme={embedTheme} />
      </div>
    );
  }

  // If active tab is SaaS landing overview, render the SaaS landing overview first
  if (activeTab === 'landing') {
    return (
      <div className="relative">
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('trust')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-white/20"
          >
            <span>Launch Live Console</span>
            <span>→</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold shadow-xl transition-all cursor-pointer"
            title="Sign out"
          >
            Sign Out
          </button>
        </div>
        <Demo onLaunchApp={() => setActiveTab('trust')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Vertical Navigation Sidebar */}
      <NavigationSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenantId={tenantId}
        setTenantId={setTenantId}
        isConnected={isConnected}
        activeIncidentsCount={activeIncidentsCount}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Navbar Header */}
        <NavigationHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tenantId={tenantId}
          setTenantId={setTenantId}
          isConnected={isConnected}
          activeIncidentsCount={activeIncidentsCount}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          authUser={authUser}
          onLogout={handleLogout}
        />

        {/* Real-time Twilio Notification Alert Toast Banner */}
        {activeAlert && (
          <div className="mx-4 md:mx-6 mt-4 p-4 rounded-xl border border-rose-500/60 bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs uppercase font-mono border border-rose-500/30">
                📱 Twilio {activeAlert.channel.toUpperCase()} Alert
              </span>
              <div>
                <strong className="text-white text-xs block">{activeAlert.title}</strong>
                <span className="text-[11px] text-rose-200">
                  {activeAlert.metric ? `${activeAlert.metric}: ${activeAlert.value} • ` : ''}
                  {activeAlert.triggerCause.slice(0, 90)}...
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('scenarios')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow transition-all"
              >
                Inspect Alert & Prevention →
              </button>
              <button
                onClick={() => setActiveAlert(null)}
                className="text-xs text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
    </div>
  );
}
