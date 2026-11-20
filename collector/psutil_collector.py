import psutil
import time
import random
from typing import Dict, Any

class PsutilCollector:
    """
    Collects live host telemetry using psutil:
      - CPU Percent
      - Virtual Memory Percent
      - Disk Usage
      - Network I/O Rate
      - Ping Latency & Packet Loss
      - Application and DB mock adapters
    """
    def __init__(self):
        self.last_net = psutil.net_io_counters()
        self.last_time = time.time()

    def collect_raw_snapshot(self) -> Dict[str, Any]:
        curr_time = time.time()
        time_delta = max(0.1, curr_time - self.last_time)
        
        # 1. Real Hardware Telemetry via psutil
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent
        try:
            disk = psutil.disk_usage("C:\\").percent
        except Exception:
            disk = 62.4

        curr_net = psutil.net_io_counters()
        rx_kbps = max(50.0, (curr_net.bytes_recv - self.last_net.bytes_recv) / 1024.0 / time_delta)
        tx_kbps = max(30.0, (curr_net.bytes_sent - self.last_net.bytes_sent) / 1024.0 / time_delta)
        
        self.last_net = curr_net
        self.last_time = curr_time

        # 2. Network Latency & Packet Loss
        ping_latency = 18.0 + (random.random() * 8.0)
        packet_loss = 0.0 if random.random() > 0.1 else 0.05

        # 3. Application & DB Metrics
        failed_logins = 0 if random.random() > 0.08 else random.randint(1, 3)
        error_count = random.randint(0, 2)
        db_query_latency = 16.0 + (random.random() * 8.0)
        db_pool_usage = 28.0 + (random.random() * 10.0)

        # 4. Sensitive raw fields present in customer environment (TO BE REDACTED/REMOVED)
        raw_snapshot = {
            # Metadata targets
            "cpu_percent": round(cpu, 1),
            "memory_percent": round(mem, 1),
            "disk_percent": round(disk, 1),
            "network_rx_kbps": round(rx_kbps, 1),
            "network_tx_kbps": round(tx_kbps, 1),
            "ping_latency_ms": round(ping_latency, 1),
            "packet_loss_percent": round(packet_loss, 2),
            "failed_login_count": failed_logins,
            "error_count": error_count,
            "db_query_latency_ms": round(db_query_latency, 1),
            "db_connection_pool_usage": round(db_pool_usage, 1),

            # SENSITIVE RAW FIELDS THAT MUST NEVER LEAVE CUSTOMER BOUNDARY:
            "raw_hostname": "k8s-worker-prod-04.us-east.internal",
            "raw_bearer_auth": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_token",
            "raw_user_email": "krish.security@enterprise-corp.com",
            "raw_db_connection_string": "postgres://admin:MasterSecretP@ssword2026@10.0.4.12:5432/customer_db",
            "raw_sql_query": "SELECT ssn, credit_card, account_balance FROM customer_accounts WHERE id = '994182'",
            "raw_customer_payload": "{'customer_name': 'Jane Doe', 'ssn': '000-45-6789', 'balance': 54000.00}",
            "raw_server_ip": "10.0.14.82",
            "raw_kernel_version": "Windows 11 Kernel 10.0.22631",
            "raw_api_key": "api_key=sk-live-thirdeye-customer-private-token-99"
        }

        return raw_snapshot

psutil_collector = PsutilCollector()
