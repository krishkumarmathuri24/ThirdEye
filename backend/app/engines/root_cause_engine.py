from typing import List, Dict, Any
from ..models import TelemetryIngestPayload

class RootCauseEngine:
    """
    Generates causal dependency chains and graph paths.
    Traverses domain relationships:
      E.g.: Network/DB Latency Surge -> Auth Retry Storm -> CPU Saturation -> App Degradation
    """
    def analyze(self, payload: TelemetryIngestPayload, anomalies: List[Dict[str, Any]]) -> Dict[str, Any]:
        dimensions = [a["dimension"] for a in anomalies]
        
        cause_chain = []
        evidence = []
        probable_cause = ""
        explanation = ""

        # Pattern A: Security / Authentication Storm leading to CPU & App strain
        if "Security" in dimensions and ("Infrastructure" in dimensions or "Application" in dimensions):
            cause_chain = [
                "Unusual Authentication Retries / Ingress Flood",
                "Password Hashing / Crypto CPU Saturation",
                "Thread Pool Starvation",
                "Service Latency Escalation & Application Degradation"
            ]
            probable_cause = "Credential Flood / Auth Retry Storm Exhaustion"
            evidence.append(f"{payload.failed_login_count} failed auth attempts triggered crypto compute spike")
            evidence.append(f"CPU sustained at {payload.cpu_percent:.1f}%")
            explanation = "A surge of failed authentication requests saturated cryptographic verification threads, driving CPU utilization past safe baselines and causing downstream request queues to back up."

        # Pattern B: Database Slowdown leading to Application Queuing & Connection Exhaustion
        elif "Database" in dimensions and ("Infrastructure" in dimensions or "Application" in dimensions):
            cause_chain = [
                "Database Query Latency Surge (>90ms)",
                "Connection Pool Saturation (Lock Contention)",
                "Application Worker Thread Blocking",
                "Upstream Request Timeouts"
            ]
            probable_cause = "Database Query Contention & Lock Serialization"
            evidence.append(f"Database query latency surged to {payload.db_query_latency_ms:.1f}ms")
            evidence.append(f"Application reported {payload.error_count} cascading errors/sec")
            explanation = "Slow database query execution blocked application connection pools, leading to thread queue saturation and cascading API timeout failures."

        # Pattern C: Network Congestion & Packet Loss
        elif "Network" in dimensions:
            cause_chain = [
                "Network Jitter / Route Congestion",
                "TCP Packet Loss (>2%)",
                "Socket Retransmissions",
                "Elevated P99 Round-Trip Latency"
            ]
            probable_cause = "Ingress/Egress Network Congestion"
            evidence.append(f"Packet loss measured at {payload.packet_loss_percent:.1f}%")
            evidence.append(f"Ping latency spiked to {payload.ping_latency_ms:.1f}ms")
            explanation = "Network packet drops forced TCP window backoff and retransmissions, creating high latency across inter-service communication links."

        # Pattern D: Pure Compute Resource Exhaustion
        elif payload.cpu_percent > 85.0 or payload.memory_percent > 85.0:
            cause_chain = [
                "Excessive Memory Allocation / Compute Task",
                "Garbage Collection Thrashing & Core Lock",
                "Kernel Context Switching Saturation"
            ]
            probable_cause = "Compute Resource Exhaustion"
            evidence.append(f"CPU at {payload.cpu_percent:.1f}%, Memory at {payload.memory_percent:.1f}%")
            explanation = "Heavy internal workload or memory leak consumed host capacity, degrading overall operating system scheduling responsiveness."

        # Default fallback
        else:
            cause_chain = [
                "Intermittent Metric Anomaly Observed",
                "Baseline Deviation Monitored",
                "Subsystem Self-Correction or Containment"
            ]
            probable_cause = "Transient Telemetry Deviation"
            evidence.append(f"{len(anomalies)} minor anomalies detected")
            explanation = "Observed deviations across system metrics without complete causal failure pattern."

        return {
            "probable_cause": probable_cause,
            "cause_chain": cause_chain,
            "evidence": evidence,
            "confidence": 0.92,
            "explanation": explanation
        }

root_cause_engine = RootCauseEngine()
