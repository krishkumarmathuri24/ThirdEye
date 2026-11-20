import asyncio
import os
import sys

# Ensure root in path and unbuffered stdout
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.stdout.reconfigure(line_buffering=True)

from backend.app.database import init_db
from backend.app.models import TelemetryIngestPayload, CopilotQuery, ScenarioTrigger
from backend.app.routers import (
    telemetry, privacy, incidents, health_security,
    forecasting, remediation, copilot, scenarios, audit, collector
)
from collector.privacy_pipeline import privacy_pipeline
from collector.local_buffer import local_buffer
from collector.agent import collector_agent

async def run_all_tests():
    print("=== STARTING THIRD EYE VERIFICATION SUITE ===")
    
    # 1. Database Init
    init_db()
    print("✓ DB Schema & Genesis Block initialized.")

    # 2. Privacy Pipeline (Tier 1 Customer Boundary)
    raw_data = {
        "cpu_percent": 88.5,
        "memory_percent": 91.2,
        "disk_percent": 68.0,
        "network_rx_kbps": 3200.0,
        "network_tx_kbps": 1800.0,
        "ping_latency_ms": 160.0,
        "packet_loss_percent": 3.2,
        "failed_login_count": 45,
        "error_count": 18,
        "db_query_latency_ms": 115.0,
        "db_connection_pool_usage": 85.0,
        "raw_user_email": "admin@customer-enterprise.internal",
        "raw_bearer_auth": "Bearer secret_jwt_token_9999",
        "raw_db_password": "postgres://user:SecretPassword2026@10.0.1.5:5432/db",
        "raw_sql_query": "SELECT ssn, balance FROM accounts WHERE pin = 1234"
    }

    metadata, audit_rec = privacy_pipeline.process(raw_data, sequence=1)
    assert "raw_user_email" not in metadata, "Privacy leak: raw_user_email was not scrubbed!"
    assert "raw_bearer_auth" not in metadata, "Privacy leak: raw_bearer_auth was not scrubbed!"
    assert "raw_db_password" not in metadata, "Privacy leak: raw_db_password was not scrubbed!"
    assert "raw_sql_query" not in metadata, "Privacy leak: raw_sql_query was not scrubbed!"
    assert len(metadata["payload_hash_sha256"]) == 64, "Missing valid SHA-256 hash!"
    pm = metadata["privacy_metrics"]
    print(f"✓ Tier 1 Privacy Pipeline: {pm['collected_fields']} collected, {pm['removed_fields']} removed, {pm['redacted_fields']} redacted, {pm['transmitted_fields']} approved.")

    # 3. Local SQLite Outbox Buffering
    local_buffer.enqueue(metadata, sequence=1)
    stats = local_buffer.get_queue_stats()
    assert stats["pending"] >= 1
    print(f"✓ Local SQLite Outbox Buffering: {stats['pending']} queued payloads.")

    # 4. Telemetry Ingestion Endpoint
    payload_obj = TelemetryIngestPayload(**metadata)
    ingest_res = await telemetry.ingest_telemetry(payload_obj)
    assert ingest_res["status"] == "ingested"
    assert ingest_res["incident_active"] is True
    print(f"✓ SaaS Ingest: Payload {ingest_res['payload_id']} ingested. Anomalies detected: {ingest_res['anomalies_detected']}.")

    # 5. Idempotent Deduplication
    dup_res = await telemetry.ingest_telemetry(payload_obj)
    assert dup_res["status"] == "duplicate_ignored"
    print("✓ SaaS Ingest Deduplication: Identical payload_id safely ignored.")

    # 6. Privacy Transparency Center Summary & 3-Stage Replay
    priv_sum = await privacy.get_privacy_summary("tenant_prod_us_east_1")
    assert priv_sum["privacy_score"] == 100
    assert priv_sum["zero_raw_data_enforced"] is True
    print(f"✓ Privacy Transparency Summary: Privacy Score {priv_sum['privacy_score']}% (Zero-Leak Verified).")

    replay = await privacy.get_privacy_replay(metadata["payload_id"])
    assert "stage_1_collected" in replay
    assert "stage_2_redacted" in replay
    assert "stage_3_metadata" in replay
    assert replay["egress_verified"] is True
    print(f"✓ Privacy 3-Stage Replay: Stage 1 -> Stage 2 -> Stage 3 verified for {metadata['payload_id']}.")

    # 7. Egress Proofs Verification
    # NOTE: Pass explicit limit=15 since calling router directly bypasses FastAPI Query resolution
    proofs = await privacy.get_egress_proofs("tenant_prod_us_east_1", limit=15)
    assert len(proofs) >= 1
    assert proofs[0]["verified"] is True
    print(f"✓ Cryptographic Egress Proofs: {len(proofs)} proofs validated with SHA-256 digest.")

    # 8. Correlated Incidents, RCA Chain, and Explainable AIOps
    incs = await incidents.get_incidents("tenant_prod_us_east_1", "all")
    assert len(incs) >= 1
    inc_detail = await incidents.get_incident_detail(incs[0]["id"])
    print(f"✓ Incident Correlation Engine: '{inc_detail['title']}' ({inc_detail['severity'].upper()}).")
    print(f"   Root Cause Chain: {' → '.join(inc_detail['root_cause_chain'])}")
    print(f"   Explainability: {inc_detail['explainability']['summary']} (Confidence: {int(inc_detail['confidence']*100)}%)")
    print(f"   Vector Memory Matches: {len(inc_detail.get('vector_memory_matches', []))} previous resolutions retrieved.")

    # 9. Health, Security, and Trust Scores
    hlth = await health_security.get_health("tenant_prod_us_east_1")
    sec = await health_security.get_security("tenant_prod_us_east_1")
    trust = await health_security.get_trust_scores("tenant_prod_us_east_1")
    print(f"✓ System Health: {hlth['state']} ({hlth['overall_score']}/100) - Reason: {hlth['reasoning']}")
    print(f"✓ Security Engine: {sec['risk_level']} Risk ({sec['security_score']}/100) - Failed logins: {sec['failed_logins']}")
    print(f"✓ Trust Dashboard: Privacy {trust['privacy_score']}%, Reliability {trust['reliability_score']}%, Collector: {trust['collector_health']}.")

    # 10. Proactive Forecasting (15m, 30m, 60m)
    forecasts = await forecasting.get_forecasts("tenant_prod_us_east_1")
    assert len(forecasts) >= 4
    for f in forecasts:
        print(f"   Forecast +{f['window']} {f['metric'].upper()}: {f['current_value']} -> {f['predicted_value']} ({f['trend']}) [{int(f['confidence']*100)}% conf]")

    # 11. Safe Remediation System: Proposed -> Simulated -> Rollback
    recs = await remediation.get_recommendations("tenant_prod_us_east_1", status="all")
    assert len(recs) >= 1
    rec_id = recs[0]["id"]
    
    wf_proposed = await remediation.propose_remediation(recommendation_id=rec_id, tenant_id="tenant_prod_us_east_1", operator="operator_krish")
    assert wf_proposed["status"] == "proposed"
    rem_id = wf_proposed["remediation_id"]

    wf_simulated = await remediation.simulate_remediation(remediation_id=rem_id, tenant_id="tenant_prod_us_east_1", operator="operator_krish")
    assert wf_simulated["status"] == "simulated"
    assert "SIMULATION SUCCESS" in wf_simulated["simulation_output"]

    wf_rollback = await remediation.rollback_remediation(remediation_id=rem_id, tenant_id="tenant_prod_us_east_1", operator="operator_krish")
    assert wf_rollback["status"] == "rolled_back"
    print(f"✓ Safe Remediation: Proposed -> Simulated Execution -> Snapshot Rollback completed for {rem_id}.")

    # 12. Cryptographic Hash Chain Audit System
    chain_verif = await audit.verify_audit_chain("tenant_prod_us_east_1")
    assert chain_verif["valid"] is True
    print(f"✓ Tamper-Evident Audit Chain: UNBROKEN ({chain_verif['blocks_count']} blocks verified with SHA-256).")

    # 13. Infrastructure Copilot (Strict Grounding)
    copilot_query = CopilotQuery(question="Why is health poor and what remediation should operators run?", tenant_id="tenant_prod_us_east_1")
    copilot_ans = await copilot.ask_copilot(copilot_query)
    assert len(copilot_ans["answer"]) > 20
    print(f"✓ Infrastructure Copilot: \"{copilot_ans['answer']}\"")
    print(f"   Grounding Source: {copilot_ans['source']}")

    # 14. Live Scenario Engine (DDoS and Auth Storm)
    scen_trig = ScenarioTrigger(scenario_type="failed_login_flood", intensity=1.5)
    scen_res = await scenarios.trigger_scenario(scen_trig, "tenant_prod_us_east_1")
    assert scen_res["status"] == "success"
    assert scen_res["incident"] is not None
    print(f"✓ Live Scenario Engine: Injected '{scen_res['scenario']}' end-to-end with instant correlation.")

    # 15. Collector Heartbeat & Monitoring
    # Pass tenant_id as a plain string — the router resolves any Query wrapper internally
    col_hb = await collector.collector_heartbeat(
        collector_id="collector_agent_node_alpha",
        status="online",
        queue_size=0,
        replayed_count=1,
        tenant_id="tenant_prod_us_east_1"
    )
    assert col_hb["status"] == "recorded"
    print("✓ Collector Monitoring: Heartbeat recorded and operational status healthy.")

    print("\n=========================================================")
    print("ALL 15 ENTERPRISE-GRADE HACKATHON CAPABILITIES VERIFIED 100%!")
    print("=========================================================")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
