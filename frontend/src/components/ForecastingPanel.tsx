import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Cpu,
  Activity,
  AlertCircle,
  Clock,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { ForecastPrediction, TelemetryData } from '../types';
import { api } from '../services/api';

interface ForecastingProps {
  tenantId: string;
  telemetry: TelemetryData | null;
}

export const ForecastingPanel: React.FC<ForecastingProps> = ({ tenantId, telemetry }) => {
  const [forecasts, setForecasts] = useState<ForecastPrediction[]>([]);

  useEffect(() => {
    api.getForecasts(tenantId)
      .then((data) => setForecasts(data))
      .catch((err) => console.error(err));
  }, [tenantId, telemetry?.timestamp]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Proactive Time-Series Forecasting
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl">
          Continuous regression and predictive queue models project system state across 15m, 30m, and 60m horizons, enabling operators to preempt outages before threshold breaches occur.
        </p>
      </div>

      {/* Forecast Horizons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {forecasts.map((fc, idx) => {
          const isIncreasing = fc.trend === 'increasing';
          const isDecreasing = fc.trend === 'decreasing';
          return (
            <div
              key={idx}
              className={`p-5 rounded-xl border bg-slate-900/70 transition-all ${
                isIncreasing && fc.metric === 'incident_risk' && fc.predicted_value > 50
                  ? 'border-rose-500/50 bg-rose-950/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                  +{fc.window} Horizon
                </span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold">
                  {Math.round(fc.confidence * 100)}% Conf
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-300 uppercase font-mono block">
                {fc.metric.replace('_', ' ')}
              </span>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {fc.predicted_value}
                  {fc.metric === 'cpu' || fc.metric === 'memory' || fc.metric === 'incident_risk' ? '%' : 'ms'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (now: {fc.current_value})
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                {isIncreasing ? (
                  <span className="inline-flex items-center text-xs text-rose-400 font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Upward Trend
                  </span>
                ) : isDecreasing ? (
                  <span className="inline-flex items-center text-xs text-emerald-400 font-medium">
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> Decreasing
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs text-slate-400 font-medium">
                    <Minus className="w-3.5 h-3.5 mr-0.5" /> Stable
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/60 leading-relaxed font-sans">
                {fc.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Real-time Hardware Ribbon */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
        <h3 className="text-xs font-semibold text-slate-300 uppercase font-mono mb-4">
          Current Host Capacity & Ingress Rates
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Network RX Rate</span>
            <span className="text-white text-base font-bold">{telemetry?.network_rx_kbps?.toFixed(1) || '1250.0'} KB/s</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Network TX Rate</span>
            <span className="text-white text-base font-bold">{telemetry?.network_tx_kbps?.toFixed(1) || '890.0'} KB/s</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Disk Storage Usage</span>
            <span className="text-white text-base font-bold">{telemetry?.disk_percent?.toFixed(1) || '61.2'}%</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">Packet Loss</span>
            <span className="text-white text-base font-bold">{telemetry?.packet_loss_percent?.toFixed(2) || '0.00'}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
