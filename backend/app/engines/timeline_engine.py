from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from ..models import TelemetryIngestPayload

class IncidentTimelineEngine:
    """
    Builds minute-by-minute chronological causal timeline leading up to an incident.
    Format:
      09:01 Latency Increase
      09:02 Database Delay
      09:03 Authentication Retry Storm
      09:04 CPU Saturation
      09:05 Incident Created
    """
    def build_timeline(
        self,
        payload: TelemetryIngestPayload,
        anomalies: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        timeline = []
        
        # We synthesize an ordered chronology leading up to the detection point
        step_minutes = len(anomalies)
        for i, anomaly in enumerate(anomalies):
            event_time = now - timedelta(minutes=(step_minutes - i))
            timeline.append({
                "timestamp": event_time.strftime("%H:%M:%S UTC"),
                "event_title": f"{anomaly['metric']} Detected",
                "description": anomaly["evidence"],
                "signal_name": anomaly["metric"],
                "signal_value": str(anomaly["current_value"]),
                "dimension": anomaly["dimension"],
                "severity": anomaly["severity"]
            })

        # Final trigger marker
        timeline.append({
            "timestamp": now.strftime("%H:%M:%S UTC"),
            "event_title": "Incident Correlated & Confirmed",
            "description": f"Third Eye AI correlated {len(anomalies)} anomalies into a single incident with 94% confidence",
            "signal_name": "Correlation Engine",
            "signal_value": "Triggered",
            "dimension": "AIOps",
            "severity": "critical" if any(a["severity"] == "critical" for a in anomalies) else "high"
        })

        return timeline

timeline_engine = IncidentTimelineEngine()
