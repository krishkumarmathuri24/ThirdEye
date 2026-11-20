# 👁️ Third Eye — Privacy-First Real-Time AIOps Observability Platform

> **Hackathon-ready enterprise-grade platform built for sub-second telemetry observation with zero raw data leaving the customer boundary.**

🌐 **Live Production Deployment**: [https://third-eye-eta.vercel.app/](https://third-eye-eta.vercel.app/)  
📦 **Live Embed Preview**: [https://third-eye-eta.vercel.app/?mode=embed](https://third-eye-eta.vercel.app/?mode=embed)  
📜 **Universal Script**: `https://third-eye-eta.vercel.app/embed.js`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 1 — Customer Environment (All Raw Data Stays Here)    │
│                                                             │
│  ┌──────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  psutil  │ → │ Privacy Pipeline │ → │ SQLite Outbox  │  │
│  │Collector │   │  6 Stages        │   │ Local Buffer   │  │
│  └──────────┘   └──────────────────┘   └────────┬───────┘  │
│                 ↑ Raw data stays here            │          │
│                 ↑ Only metadata leaves            │          │
└──────────────────────────────────────────────────│──────────┘
                                                   │ Metadata Only
                                                   ▼
┌─────────────────────────────────────────────────────────────┐
│  TIER 2 — Third Eye SaaS Platform                           │
│                                                             │
│  FastAPI Backend ──→ AI Engines ──→ Supabase Realtime       │
│       │                                      │              │
│       └──→ SQLite (PostgreSQL-ready)         │              │
│                                              ▼              │
│                                    React Dashboard          │
│                                   (11 live channels)        │
└─────────────────────────────────────────────────────────────┘
```

## ✅ All 15 Hackathon Capabilities Verified

| # | Capability | Status |
|---|-----------|--------|
| 1 | 6-Stage Privacy Pipeline (Collection→Detection→Redaction→Pseudonymization→Approval→Export) | ✅ |
| 2 | Local SQLite Outbox Buffering (Zero Data Loss) | ✅ |
| 3 | SaaS Telemetry Ingestion with Idempotent Deduplication | ✅ |
| 4 | Privacy Transparency Center (100% Score, Zero-Leak Enforced) | ✅ |
| 5 | 3-Stage Privacy Replay (Collected→Redacted→Approved) | ✅ |
| 6 | Cryptographic Egress Proofs (SHA-256 signed records) | ✅ |
| 7 | Incident Correlation Engine (Multi-alert→Single Incident) | ✅ |
| 8 | Root Cause Analysis Chain | ✅ |
| 9 | Explainable AIOps (Signal breakdown, confidence scoring) | ✅ |
| 10 | Health, Security & Trust Score Engines | ✅ |
| 11 | Proactive Forecasting (15m / 30m / 60m horizons) | ✅ |
| 12 | Safe Remediation System (Proposed→Simulated→Rollback) | ✅ |
| 13 | Tamper-Evident SHA-256 Hash Chain Audit Log | ✅ |
| 14 | Infrastructure AI Copilot (Zero-hallucination, grounded) | ✅ |
| 15 | Live Scenario Engine (13 scenarios, end-to-end) | ✅ |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Backend

```bash
cd backend
python run_backend.py
# API running at http://127.0.0.1:8000
# Docs at http://127.0.0.1:8000/docs
```

### 3. Start the Collector Agent

In a new terminal from the project root:

```bash
python -m collector.agent
# Collector starts collecting every 1.5s
# Privacy pipeline active — raw data stays local
```

### 4. Start the Frontend Dashboard

In a new terminal:

```bash
cd frontend
npm install   # first time only
npm run dev
# Dashboard at http://localhost:5173
```

### 5. Run the Verification Suite

```bash
python -u tests/test_direct_endpoints.py
# ALL 15 ENTERPRISE-GRADE HACKATHON CAPABILITIES VERIFIED 100%
```

---

## 📁 Project Structure

```
ThirdEye/
├── backend/
│   ├── app/
│   │   ├── config.py          # Settings & env vars
│   │   ├── database.py        # SQLite schema (10 tables, genesis audit block)
│   │   ├── main.py            # FastAPI app + SSE + WebSocket realtime
│   │   ├── models.py          # All Pydantic models
│   │   ├── realtime.py        # SupabaseRealtimeHub (11 channels, SSE)
│   │   ├── engines/
│   │   │   ├── anomaly_engine.py        # 6-dimension anomaly detection
│   │   │   ├── audit_engine.py          # SHA-256 hash chain
│   │   │   ├── collector_monitor.py     # Heartbeat & reliability tracking
│   │   │   ├── copilot_engine.py        # Grounded Q&A, zero hallucination
│   │   │   ├── correlation_engine.py    # Multi-alert → single incident
│   │   │   ├── explainable_aiops.py     # Signal breakdown & reasoning
│   │   │   ├── forecasting_engine.py    # 15m/30m/60m forecasts
│   │   │   ├── health_engine.py         # Excellent/Good/Fair/Poor scoring
│   │   │   ├── incident_memory.py       # Lightweight vector store (cosine sim)
│   │   │   ├── remediation_engine.py    # Safe propose/simulate/rollback
│   │   │   ├── root_cause_engine.py     # 4 causal chain patterns
│   │   │   ├── scenario_engine.py       # 13 live scenario types
│   │   │   ├── security_engine.py       # Brute force & risk detection
│   │   │   ├── timeline_engine.py       # Chronological incident timeline
│   │   │   └── trust_engine.py          # 7 trust metrics
│   │   └── routers/
│   │       ├── audit.py                 # GET /audit/logs, /audit/verify
│   │       ├── collector.py             # POST /collector/heartbeat
│   │       ├── copilot.py               # POST /copilot/chat
│   │       ├── forecasting.py           # GET /forecasting
│   │       ├── health_security.py       # GET /health, /security, /trust
│   │       ├── incidents.py             # GET /incidents, POST /{id}/resolve
│   │       ├── privacy.py               # GET /privacy/summary, /replay, /egress-proofs
│   │       ├── remediation.py           # POST /remediation/propose, /simulate, /rollback
│   │       ├── scenarios.py             # POST /scenarios/trigger
│   │       └── telemetry.py             # POST /telemetry/ingest
│   └── run_backend.py         # Uvicorn entrypoint
│
├── collector/
│   ├── agent.py               # ThirdEyeCollectorAgent (run_forever)
│   ├── config.py              # Collector config (env vars)
│   ├── egress_proof.py        # Local JSONL egress proof logger
│   ├── local_buffer.py        # SQLite outbox (enqueue/deliver/retry)
│   ├── privacy_pipeline.py    # 6-Stage privacy processing
│   └── psutil_collector.py    # Live psutil + synthetic telemetry
│
├── frontend/
│   └── src/
│       ├── App.tsx                        # Root app, 10 tabs, realtime
│       ├── components/
│       │   ├── AuditLogViewer.tsx         # Hash chain verification
│       │   ├── EgressProofPanel.tsx       # Cryptographic egress records
│       │   ├── ForecastingPanel.tsx       # Forecast horizon cards
│       │   ├── IncidentCenter.tsx         # RCA + explainable + vector memory
│       │   ├── InfrastructureCopilot.tsx  # AI chat interface
│       │   ├── LiveScenarioController.tsx # 13 live scenarios
│       │   ├── NavigationHeader.tsx       # Tab nav + tenant switcher
│       │   ├── PrivacyTransparencyCenter.tsx  # 3-stage replay viewer
│       │   ├── SafeRemediationHub.tsx     # Workflow lifecycle
│       │   └── TrustDashboard.tsx         # 5 trust metrics + live gauges
│       ├── services/
│       │   ├── api.ts                     # Full API client
│       │   └── realtime.ts                # SSE + Supabase 11-channel subscriptions
│       └── types/index.ts                 # All TypeScript interfaces
│
├── tests/
│   └── test_direct_endpoints.py   # 15-capability verification suite
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🔒 Privacy Architecture

### What NEVER leaves the customer boundary

- Raw logs and payloads
- Credentials, secrets, API keys, bearer tokens
- Personally identifiable information (emails, SSNs)
- Database records and SQL queries
- Internal hostnames and IP addresses
- Application stack traces

### What IS transmitted (metadata only)

- Numeric telemetry (CPU %, Memory %, Latency ms)
- HMAC-pseudonymized source IDs (not real hostnames)
- Field count statistics
- SHA-256 payload hash
- Anomaly scores and health indicators

### Privacy Proof

Every payload generates a cryptographic egress proof:
```json
{
  "proof_id": "prf_abc12345",
  "payload_hash": "sha256:...",
  "field_counts": { "collected": 15, "removed": 4, "redacted": 2, "transmitted": 9 },
  "redaction_manifest": { "bearer_token": "REGEX_REDACTED", "email": "REMOVED" },
  "verified": true
}
```

---

## 📡 Real-Time Architecture

Zero polling. All updates are event-driven via Server-Sent Events (SSE).

**11 Supabase Realtime Channels:**

| Channel | Purpose |
|---------|---------|
| `telemetry_updates` | Live metrics |
| `health_updates` | Health state changes |
| `security_updates` | Security score + risk events |
| `incident_updates` | New/resolved incidents |
| `recommendation_updates` | AI recommendations |
| `audit_updates` | Audit chain appends |
| `remediation_updates` | Workflow state transitions |
| `collector_updates` | Heartbeat + buffer stats |
| `trust_updates` | Trust metric changes |
| `privacy_updates` | Privacy record appended |
| `forecast_updates` | Forecast refreshes |

**SSE Endpoint:** `GET /api/v1/realtime/stream?tenant_id=...`  
**WebSocket:** `WS /api/v1/realtime/ws/{tenant_id}`

Target latency: **< 1 second** (collect → process → store → broadcast)

---

## 🤖 AI Engines

| Engine | Description |
|--------|-------------|
| **Anomaly Engine** | 6-dimension detection with baseline deviation scoring |
| **Correlation Engine** | Collapses N alerts into 1 incident with confidence |
| **Root Cause Engine** | 4 causal chain patterns (Auth Storm, DB Contention, etc.) |
| **Explainable AIOps** | Per-signal breakdown with narrative reasoning |
| **Timeline Engine** | Minute-by-minute chronological incident timeline |
| **Forecasting Engine** | 15m/30m/60m CPU/Memory/Latency/Risk predictions |
| **Health Engine** | Excellent/Good/Fair/Poor with penalty-based scoring |
| **Security Engine** | Brute force detection, risk levels, event tracking |
| **Trust Engine** | 7 trust metrics: privacy, reliability, collector, etc. |
| **Incident Memory** | Lightweight 32-dim vector store with cosine similarity |
| **Copilot Engine** | Grounded Q&A — never invents numbers, all facts from live DB |
| **Remediation Engine** | Safe propose → simulate → rollback workflow |
| **Scenario Engine** | 13 real-world failure scenarios, end-to-end pipeline |

---

## ⚙️ Configuration

All settings via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `THIRDEYE_API_KEY` | `thirdeye_live_secret_key_prod_99` | Collector auth key |
| `THIRDEYE_HMAC_SECRET` | `thirdeye_cryptographic_audit_secret_2026` | HMAC signing secret |
| `THIRDEYE_TENANT_ID` | `tenant_prod_us_east_1` | Default tenant |
| `THIRDEYE_DB_PATH` | `backend/thirdeye.db` | SQLite DB path |
| `SUPABASE_URL` | _(optional)_ | Supabase project URL |
| `SUPABASE_KEY` | _(optional)_ | Supabase anon key |
| `ENABLE_SUPABASE_SYNC` | `false` | Enable Supabase broadcast sync |
| `GEMINI_API_KEY` | _(optional)_ | Gemini AI for enhanced copilot |
| `THIRDEYE_SAAS_URL` | `http://127.0.0.1:8000/api/v1/telemetry/ingest` | Collector target |
| `THIRDEYE_COLLECTOR_ID` | `collector_agent_node_alpha` | Collector identity |

---

## 📊 API Reference

Interactive docs available at **http://127.0.0.1:8000/docs** when backend is running.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/telemetry/ingest` | Ingest metadata payload |
| GET | `/api/v1/telemetry/latest` | Latest telemetry |
| GET | `/api/v1/privacy/summary` | Privacy score + field stats |
| GET | `/api/v1/privacy/replay/{id}` | 3-stage privacy replay |
| GET | `/api/v1/privacy/egress-proofs` | Cryptographic proof records |
| GET | `/api/v1/incidents` | List incidents |
| GET | `/api/v1/incidents/{id}` | Incident detail + RCA + vector memory |
| GET | `/api/v1/health` | Health score + history |
| GET | `/api/v1/security` | Security score + risk events |
| GET | `/api/v1/trust` | 7 trust metrics |
| GET | `/api/v1/forecasting` | 15m/30m/60m forecasts |
| GET | `/api/v1/remediation/recommendations` | AI recommendations |
| POST | `/api/v1/remediation/propose` | Propose remediation workflow |
| POST | `/api/v1/remediation/simulate` | Simulate remediation (safe) |
| POST | `/api/v1/remediation/rollback` | Rollback to snapshot |
| POST | `/api/v1/copilot/chat` | Infrastructure copilot Q&A |
| POST | `/api/v1/scenarios/trigger` | Trigger live scenario |
| GET | `/api/v1/audit/logs` | Audit chain logs |
| GET | `/api/v1/audit/verify` | Verify SHA-256 chain integrity |
| POST | `/api/v1/collector/heartbeat` | Record collector heartbeat |
| GET | `/api/v1/realtime/stream` | SSE event stream |

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| Storage | SQLite (migration-ready for PostgreSQL) |
| Realtime | Server-Sent Events (SSE) + Supabase Realtime channels |
| Collector | psutil, httpx, SQLite outbox |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 3 |
| AI | Gemini API (optional), lightweight vector store |
| Auth | HMAC-SHA256 source IDs, API key headers |

---

*Third Eye — DO NOT TRUST. VERIFY. Every byte of your data, accounted for.*
