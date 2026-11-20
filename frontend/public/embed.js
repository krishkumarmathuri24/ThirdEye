/**
 * Third Eye Universal Embed Script
 * ─────────────────────────────────────────────────────────────────
 * Drop this single script tag into ANY website (HTML, React, Next.js, WordPress, Vue):
 * 
 *   <script 
 *     src="https://YOUR-THIRDEYE.vercel.app/embed.js" 
 *     data-tenant="tenant_prod_us_east_1"
 *     data-theme="dark"
 *     data-position="bottom-right">
 *   </script>
 * 
 * Automatically injects a floating live health badge and expandable AIOps modal!
 * ─────────────────────────────────────────────────────────────────
 */
(function () {
  if (window.__THIRDEYE_EMBEDDED__) return;
  window.__THIRDEYE_EMBEDDED__ = true;

  // Read configuration from current script tag
  const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
  const baseUrl = currentScript ? new URL(currentScript.src).origin : window.location.origin;
  const tenant = currentScript?.getAttribute('data-tenant') || 'tenant_prod_us_east_1';
  const theme = currentScript?.getAttribute('data-theme') || 'dark';
  const position = currentScript?.getAttribute('data-position') || 'bottom-right';

  // Inject Styles
  const style = document.createElement('style');
  style.innerHTML = `
    .thirdeye-badge {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 24px;' : 'top: 24px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      background: ${theme === 'dark' ? '#0f1629' : '#ffffff'};
      color: ${theme === 'dark' ? '#e2e8f0' : '#1e293b'};
      border: 1px solid ${theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }
    .thirdeye-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 28px rgba(99, 102, 241, 0.35);
    }
    .thirdeye-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
      animation: thirdeye-pulse 2s infinite;
    }
    @keyframes thirdeye-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.9); }
    }
    .thirdeye-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 999998;
      display: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .thirdeye-modal-container {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
      ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
      z-index: 999999;
      width: 440px;
      max-width: calc(100vw - 32px);
      height: 480px;
      max-height: calc(100vh - 120px);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
      display: none;
      opacity: 0;
      transform: scale(0.95);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .thirdeye-modal-container.open,
    .thirdeye-modal-backdrop.open {
      display: block;
      opacity: 1;
      transform: scale(1);
    }
    .thirdeye-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;
  document.head.appendChild(style);

  // Create Badge
  const badge = document.createElement('div');
  badge.className = 'thirdeye-badge';
  badge.innerHTML = `
    <span class="thirdeye-dot"></span>
    <span>👁️ Third Eye AIOps</span>
  `;

  // Create Modal
  const backdrop = document.createElement('div');
  backdrop.className = 'thirdeye-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'thirdeye-modal-container';
  modal.innerHTML = `
    <iframe class="thirdeye-iframe" src="${baseUrl}/?mode=embed&tenant=${encodeURIComponent(tenant)}&theme=${encodeURIComponent(theme)}"></iframe>
  `;

  // Event Listeners
  let isOpen = false;
  function toggleModal() {
    isOpen = !isOpen;
    if (isOpen) {
      backdrop.classList.add('open');
      modal.classList.add('open');
    } else {
      backdrop.classList.remove('open');
      modal.classList.remove('open');
    }
  }

  badge.addEventListener('click', toggleModal);
  backdrop.addEventListener('click', toggleModal);

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
  document.body.appendChild(badge);
})();
