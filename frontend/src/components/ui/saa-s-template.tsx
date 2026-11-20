import React from "react";
import { ArrowRight, Menu, X, ShieldCheck, Activity, Cpu, Eye, Lock } from "lucide-react";

// Inline Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
    
    const variants = {
      default: "bg-white text-black hover:bg-gray-100 shadow-sm",
      secondary: "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700",
      ghost: "hover:bg-gray-800/50 text-white",
      gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-indigo-500/20"
    };
    
    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 px-4 text-xs font-semibold",
      lg: "h-12 px-8 text-base font-semibold"
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Navigation Component
export const Navigation = React.memo(({ onLaunchApp }: { onLaunchApp?: () => void }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Eye className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Third</span>
              <span className="text-indigo-400 font-extrabold">Eye</span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AIOps</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
              Privacy Architecture
            </a>
            <a href="#pipeline" className="text-sm text-white/70 hover:text-white transition-colors">
              6-Stage Pipeline
            </a>
            <a href="#egress" className="text-sm text-white/70 hover:text-white transition-colors">
              Egress Proof
            </a>
            <a href="#aiops" className="text-sm text-white/70 hover:text-white transition-colors">
              Root Cause & Forecasting
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button type="button" variant="ghost" size="sm" onClick={onLaunchApp}>
              Docs & API
            </Button>
            <Button type="button" variant="gradient" size="sm" onClick={onLaunchApp}>
              Launch Live Console
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden text-white p-2 rounded-lg hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50">
          <div className="px-6 py-4 flex flex-col gap-4">
            <a
              href="#features"
              className="text-sm text-white/70 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Privacy Architecture
            </a>
            <a
              href="#pipeline"
              className="text-sm text-white/70 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              6-Stage Pipeline
            </a>
            <a
              href="#egress"
              className="text-sm text-white/70 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Egress Proof
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
              <Button type="button" variant="gradient" size="sm" onClick={onLaunchApp}>
                Open Live Platform
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Navigation.displayName = "Navigation";

// Hero Component
export const Hero = React.memo(({ onLaunchApp }: { onLaunchApp?: () => void }) => {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-28 pb-20 md:pt-36 md:pb-24 overflow-hidden"
      style={{
        animation: "fadeIn 0.6s ease-out"
      }}
    >
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-400/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-700/80 bg-gray-900/60 backdrop-blur-md max-w-full shadow-inner">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-center whitespace-nowrap text-gray-300 font-medium">
          Zero Raw Data SaaS • 100% Metadata Observability
        </span>
        <button
          onClick={onLaunchApp}
          className="flex items-center gap-1 text-xs hover:text-cyan-300 transition-all active:scale-95 whitespace-nowrap text-indigo-400 font-semibold"
          aria-label="Read more about Third Eye"
        >
          Verify Cryptographic Proof
          <ArrowRight className="w-3 h-3" />
        </button>
      </aside>

      <h1
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-center max-w-4xl px-4 leading-[1.12] mb-6 tracking-tight"
        style={{
          background: "linear-gradient(to bottom, #ffffff 40%, rgba(255, 255, 255, 0.7) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Privacy-First Real-Time <br />
        <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
          AIOps Observability
        </span>
      </h1>

      <p className="text-base md:text-lg text-center max-w-2xl px-6 mb-10 text-gray-400 leading-relaxed font-normal">
        Third Eye monitors full-stack infrastructure, networks, databases, and collector health in sub-second real-time. Raw logs and credentials never leave your boundary—only approved, HMAC-verified metadata reaches the SaaS.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 relative z-10 mb-14">
        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/25 font-semibold text-sm md:text-base px-8 py-3"
          aria-label="Open Third Eye Platform"
          onClick={onLaunchApp}
        >
          Open Live AIOps Console
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <button
          type="button"
          onClick={onLaunchApp}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-700/70 bg-gray-800/40 hover:bg-gray-800 text-sm font-medium text-gray-200 transition-all hover:border-gray-500"
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          Inspect Privacy Pipeline
        </button>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl w-full mb-16 px-4">
        <div className="p-4 rounded-xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400">Do Not Trust. Verify.</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">Cryptographic hash-chaining of egress proofs and 3-stage privacy diffs.</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400">Sub-Second Realtime</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">Zero-polling event architecture powered by Supabase Realtime & broadcast streams.</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400">Explainable AIOps</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">Root cause causal graph, anomaly persistence scoring, and multi-alert correlation.</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400">Safe Remediation</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">Proposed → Approved → Simulated Execution → Rollback workflow with full audit.</p>
        </div>
      </div>

      {/* Main Visual Preview */}
      <div className="w-full max-w-6xl relative pb-10">
        <div
          className="absolute left-1/2 w-[95%] pointer-events-none z-0"
          style={{
            top: "-15%",
            transform: "translateX(-50%)"
          }}
          aria-hidden="true"
        >
          <img
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80"
            alt="Server Infrastructure"
            className="w-full h-auto opacity-15 rounded-3xl blur-md"
            loading="eager"
          />
        </div>
        
        <div className="relative z-10 rounded-2xl border border-gray-800/90 bg-gray-950/80 backdrop-blur-xl shadow-2xl overflow-hidden p-2 ring-1 ring-white/10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/80 bg-gray-900/40 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-gray-300 font-semibold">ThirdEye Live Console • Node-Cluster-Alpha</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                REALTIME BROADCAST ACTIVE
              </span>
              <button 
                onClick={onLaunchApp}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
              >
                Enter Dashboard →
              </button>
            </div>
          </div>

          <div className="relative group cursor-pointer" onClick={onLaunchApp}>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1800&q=85"
              alt="Third Eye AIOps Executive Analytics Dashboard Preview"
              className="w-full h-[460px] object-cover object-top rounded-xl opacity-90 transition-transform duration-300 group-hover:scale-[1.01]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent flex flex-col items-center justify-end pb-8">
              <div className="text-center px-4">
                <p className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-semibold mb-1">Interactive Telemetry & AIOps Platform</p>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Live Streaming Metrics • AI Root Cause • Privacy Replay</h3>
                <Button variant="gradient" size="default" onClick={onLaunchApp}>
                  Open Full Interactive Workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

// Main Component
export default function Component({ onLaunchApp }: { onLaunchApp?: () => void }) {
  return (
    <main className="min-h-screen bg-[#070b14] text-white selection:bg-indigo-500/30">
      <Navigation onLaunchApp={onLaunchApp} />
      <Hero onLaunchApp={onLaunchApp} />
    </main>
  );
}
