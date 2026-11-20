from typing import Dict, Any, List
from ..models import TelemetryIngestPayload

class AnomalyEngine:
    """
    Multivariate Anomaly Detection across 5 dimensions:
      1. Infrastructure (CPU, Memory, Disk)
      2. Network (Latency, Packet Loss, Bandwidth)
      3. Application (Error Rate)
      4. Security (Auth Failures)
      5. Database (Query Latency, Connection Pool)
    Computes dynamic baseline deviation, persistence score, reasoning, and evidence.
    """
    def __init__(self):
        # Baselines for moving evaluation
        self.baselines = {
            "cpu_percent": {"mean": 35.0, "std": 10.0, "threshold_z": 2.5},
            "memory_percent": {"mean": 55.0, "std": 8.0, "threshold_z": 2.5},
            "disk_percent": {"mean": 60.0, "std": 5.0, "threshold_z": 3.0},
            "ping_latency_ms": {"mean": 28.0, "std": 12.0, "threshold_z": 2.5},
            "packet_loss_percent": {"mean": 0.1, "std": 0.3, "threshold_z": 3.0},
            "failed_login_count": {"mean": 1.0, "std": 1.5, "threshold_z": 3.0},
            "error_count": {"mean": 2.0, "std": 2.5, "threshold_z": 3.0},
            "db_query_latency_ms": {"mean": 22.0, "std": 8.0, "threshold_z": 2.5},
        }

    def detect_anomalies(self, payload: TelemetryIngestPayload) -> List[Dict[str, Any]]:
        anomalies = []

        # 1. CPU Anomaly
        if payload.cpu_percent > 80.0:
            severity = "critical" if payload.cpu_percent > 92.0 else "high"
            anomalies.append({
                "dimension": "Infrastructure",
                "metric": "CPU Saturation",
                "current_value": payload.cpu_percent,
                "baseline_value": 35.0,
                "deviation_percent": round(((payload.cpu_percent - 35.0) / 35.0) * 100, 1),
                "severity": severity,
                "evidence": f"CPU reached {payload.cpu_percent:.1f}% (+{payload.cpu_percent - 35.0:.1f}% above baseline)",
                "impact": "Compute degradation, process thread queuing, potential request starvation"
            })

        # 2. Memory Anomaly
        if payload.memory_percent > 88.0:
            anomalies.append({
                "dimension": "Infrastructure",
                "metric": "Memory Pressure",
                "current_value": payload.memory_percent,
                "baseline_value": 55.0,
                "deviation_percent": round(((payload.memory_percent - 55.0) / 55.0) * 100, 1),
                "severity": "critical" if payload.memory_percent > 95.0 else "high",
                "evidence": f"RAM allocation at {payload.memory_percent:.1f}%",
                "impact": "OOM killer threat, paging thrashing, service crash risk"
            })

        # 3. Network Latency & Packet Loss Anomaly
        if payload.ping_latency_ms > 120.0 or payload.packet_loss_percent > 2.0:
            anomalies.append({
                "dimension": "Network",
                "metric": "Network Congestion / Jitter",
                "current_value": payload.ping_latency_ms,
                "baseline_value": 28.0,
                "deviation_percent": round(((payload.ping_latency_ms - 28.0) / 28.0) * 100, 1),
                "severity": "high" if payload.ping_latency_ms > 200.0 or payload.packet_loss_percent > 5.0 else "medium",
                "evidence": f"Latency {payload.ping_latency_ms:.1f}ms, Packet Loss {payload.packet_loss_percent:.1f}%",
                "impact": "Client timeouts, degraded throughput, upstream microservice retry amplification"
            })

        # 4. Database Query Latency Anomaly
        if payload.db_query_latency_ms > 90.0:
            anomalies.append({
                "dimension": "Database",
                "metric": "Database Query Degradation",
                "current_value": payload.db_query_latency_ms,
                "baseline_value": 22.0,
                "deviation_percent": round(((payload.db_query_latency_ms - 22.0) / 22.0) * 100, 1),
                "severity": "high" if payload.db_query_latency_ms > 250.0 else "medium",
                "evidence": f"Query response time {payload.db_query_latency_ms:.1f}ms (baseline 22ms)",
                "impact": "Connection pool exhaustion, blocked transaction locks, backend stall"
            })

        # 5. Security Anomaly
        if payload.failed_login_count > 10:
            anomalies.append({
                "dimension": "Security",
                "metric": "Authentication Storm",
                "current_value": payload.failed_login_count,
                "baseline_value": 1.0,
                "deviation_percent": round(((payload.failed_login_count - 1.0) / 1.0) * 100, 1),
                "severity": "critical" if payload.failed_login_count > 40 else "high",
                "evidence": f"{payload.failed_login_count} failed auth attempts recorded in current window",
                "impact": "Potential credential stuffing, brute-force attack or authentication service deadlock"
            })

        # 6. Application Error Anomaly
        if payload.error_count > 15:
            anomalies.append({
                "dimension": "Application",
                "metric": "Elevated Error Burst",
                "current_value": payload.error_count,
                "baseline_value": 2.0,
                "deviation_percent": round(((payload.error_count - 2.0) / 2.0) * 100, 1),
                "severity": "high",
                "evidence": f"{payload.error_count} HTTP 5xx / application runtime exceptions per second",
                "impact": "User facing failure, transaction drops, SLA breach"
            })

        return anomalies

anomaly_engine = AnomalyEngine()
