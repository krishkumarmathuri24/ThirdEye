import React, { useEffect, useState } from 'react';
import ThirdEyeEmbedWidget from '../components/ThirdEyeEmbedWidget';

/**
 * /embed route — Full-page embed-ready version of Third Eye.
 * Loaded inside an <iframe> on any website.
 *
 * URL Parameters:
 *   ?tenant=YOUR_TENANT_ID   — which tenant to show (default: tenant_prod_us_east_1)
 *   ?theme=dark|light        — color scheme (default: dark)
 *   ?mode=widget|full        — compact widget or full dashboard (default: full)
 */
const EmbedPage: React.FC = () => {
  const [params, setParams] = useState({
    tenant: 'tenant_prod_us_east_1',
    theme: 'dark' as 'dark' | 'light',
    mode: 'full' as 'widget' | 'full',
  });

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    setParams({
      tenant: url.get('tenant') ?? 'tenant_prod_us_east_1',
      theme: (url.get('theme') as 'dark' | 'light') ?? 'dark',
      mode: (url.get('mode') as 'widget' | 'full') ?? 'full',
    });
  }, []);

  const bg = params.theme === 'dark' ? '#070b14' : '#f1f5f9';

  if (params.mode === 'widget') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'transparent', padding: 16,
      }}>
        <ThirdEyeEmbedWidget tenantId={params.tenant} theme={params.theme} />
      </div>
    );
  }

  // Full mode — redirect to main app with tenant pre-selected
  window.location.href = `/?tenant=${params.tenant}&theme=${params.theme}`;
  return null;
};

export default EmbedPage;
