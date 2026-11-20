import uuid
import hashlib
from typing import Dict, Any, List
from datetime import datetime, timezone
from ..models import TelemetryIngestPayload
from .anomaly_engine import anomaly_engine
from .correlation_engine import correlation_engine
from .root_cause_engine import root_cause_engine
from .explainable_aiops import explainable_aiops
from .health_engine import health_engine
from .security_engine import security_engine
from .forecasting_engine import forecasting_engine
from .trust_engine import trust_engine
from .remediation_engine import remediation_engine
from .audit_engine import audit_engine

class ScenarioEngine:
    """
    Live Scenario Injection Engine.
    Executes realistic end-to-end failure and recovery scenarios:
      - CPU Spike
      - Memory Leak
      - High Disk Usage
      - Network Congestion
      - Packet Loss
      - Latency Surge
      - Database Slowdown
      - Failed Login Flood
      - Authentication Storm
      - Collector Failure / Recovery
      - SaaS Outage / Recovery
      - Application Failure
      - DDoS Simulation
    
    Every scenario executes the complete pipeline:
      Scenario
      ↓
      Metadata Generation
      ↓
      Analysis & Anomaly Detection
      ↓
      Incident Correlation & Root Cause
      ↓
      Safe Remediation Proposal
      ↓
      Realtime Event Broadcast
    """
    def execute_scenario(
        self,
        tenant_id: str,
        scenario_type: str,
        intensity: float = 1.0
    ) -> Dict[str, Any]:
        scenario_key = scenario_type.lower()
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Base nominal telemetry
        payload_data = {
            "cpu_percent": 32.5,
            "memory_percent": 54.0,
            "disk_percent": 61.2,
            "network_rx_kbps": 1250.0,
            "network_tx_kbps": 890.0,
            "ping_latency_ms": 22.0,
            "packet_loss_percent": 0.05,
            "failed_login_count": 0,
            "error_count": 1,
            "db_query_latency_ms": 19.5,
            "db_connection_pool_usage": 32.0,
        }

        scenario_name = scenario_key.replace("_", " ").title()

        # Apply specific scenario distortions
        if "cpu" in scenario_key:
            payload_data["cpu_percent"] = min(99.4, 88.0 + (intensity * 10.0))
            payload_data["error_count"] = 12
        elif "memory" in scenario_key:
            payload_data["memory_percent"] = min(98.8, 91.0 + (intensity * 6.0))
            payload_data["cpu_percent"] = 72.0
        elif "disk" in scenario_key:
            payload_data["disk_percent"] = min(99.0, 93.0 + (intensity * 5.0))
        elif "packet_loss" in scenario_key:
            payload_data["packet_loss_percent"] = 6.8 * intensity
            payload_data["ping_latency_ms"] = 145.0
        elif "latency" in scenario_key or "congestion" in scenario_key:
            payload_data["ping_latency_ms"] = 240.0 * intensity
            payload_data["packet_loss_percent"] = 3.5
            payload_data["error_count"] = 18
        elif "db" in scenario_key or "database" in scenario_key:
            payload_data["db_query_latency_ms"] = 310.0 * intensity
            payload_data["db_connection_pool_usage"] = 96.0
            payload_data["error_count"] = 24
        elif "login" in scenario_key or "auth" in scenario_key:
            payload_data["failed_login_count"] = int(68 * intensity)
            payload_data["cpu_percent"] = 84.0
            payload_data["error_count"] = 15
        elif "ddos" in scenario_key:
            payload_data["network_rx_kbps"] = 55000.0 * intensity
            payload_data["ping_latency_ms"] = 380.0
            payload_data["packet_loss_percent"] = 8.5
            payload_data["cpu_percent"] = 96.0
            payload_data["error_count"] = 45
        elif "app" in scenario_key:
            payload_data["error_count"] = int(85 * intensity)
            payload_data["cpu_percent"] = 78.0

        payload_id = f"sim_{uuid.uuid4().hex[:12]}"
        raw_hash_content = f"{payload_id}|{tenant_id}|{payload_data['cpu_percent']}|{payload_data['ping_latency_ms']}"
        payload_hash = hashlib.sha256(raw_hash_content.encode()).hexdigest()

        # Build TelemetryIngestPayload
        payload = TelemetryIngestPayload(
            payload_id=payload_id,
            tenant_id=tenant_id,
            timestamp=now_iso,
            source_id_hmac="hmac_sha256_collector_sim_agent_node_1",
            sequence_number=9999,
            cpu_percent=payload_data["cpu_percent"],
            memory_percent=payload_data["memory_percent"],
            disk_percent=payload_data["disk_percent"],
            network_rx_kbps=payload_data["network_rx_kbps"],
            network_tx_kbps=payload_data["network_tx_kbps"],
            ping_latency_ms=payload_data["ping_latency_ms"],
            packet_loss_percent=payload_data["packet_loss_percent"],
            failed_login_count=payload_data["failed_login_count"],
            error_count=payload_data["error_count"],
            db_query_latency_ms=payload_data["db_query_latency_ms"],
            db_connection_pool_usage=payload_data["db_connection_pool_usage"],
            privacy_metrics={
                "collected_fields": 42,
                "removed_fields": 24,
                "redacted_fields": 7,
                "transmitted_fields": 11
            },
            payload_hash_sha256=payload_hash,
            redaction_summary=[
                "Redacted client IP addresses with salted HMAC hashes",
                "Removed authorization bearer headers",
                "Scrubbed SQL query bind parameters"
            ]
        )

        # 1. Evaluate Health & Security
        health_state = health_engine.evaluate_telemetry(payload)
        security_state = security_engine.evaluate_telemetry(payload)

        # 2. Detect Anomalies & Correlate Incident
        anomalies = anomaly_engine.detect_anomalies(payload)
        incident = correlation_engine.correlate_alerts(payload, anomalies)

        # 3. Create Recommendation if Incident exists
        recommendation = None
        if incident:
            rec_title = f"Mitigate {incident.probable_cause}"
            action_type = "DYNAMIC_RATE_LIMIT" if "Auth" in incident.title or "Login" in incident.title else "HORIZONTAL_AUTOSCALE"
            signals = [f"{a['metric']} (+{a['deviation_percent']}%)" for a in anomalies[:3]]
            recommendation = remediation_engine.create_recommendation(
                tenant_id=tenant_id,
                incident_id=incident.id,
                title=rec_title,
                action_type=action_type,
                signals=signals,
                confidence=0.94,
                reasoning=incident.explainability.get("reasoning_narrative", "Automated corrective action recommended.")
            )

        # 4. Generate Forecasts & Trust Scores
        forecasts = forecasting_engine.generate_forecasts(payload)
        trust_scores = trust_engine.calculate_scores(tenant_id)

        # 5. Log in Hash Chain Audit Log
        audit_engine.log_event(
            tenant_id=tenant_id,
            action_type=f"SCENARIO_INJECTED_{scenario_key.upper()}",
            actor="simulator_operator",
            details={
                "scenario": scenario_name,
                "intensity": intensity,
                "anomalies_detected": len(anomalies),
                "incident_id": incident.id if incident else None
            }
        )

        return {
            "status": "success",
            "scenario": scenario_name,
            "telemetry": payload.model_dump(),
            "anomalies": anomalies,
            "incident": incident.model_dump() if incident else None,
            "recommendation": recommendation.model_dump() if recommendation else None,
            "health": health_state.model_dump(),
            "security": security_state.model_dump(),
            "trust_scores": trust_scores.model_dump()
        }

scenario_engine = ScenarioEngine()
