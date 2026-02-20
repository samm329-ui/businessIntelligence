"""
Production Infrastructure Module v10.0
- Schema Validation
- Circuit Breaker
- Rate Limiting (Token Bucket)
- Provenance Tracking
- Reconciliation Engine
"""
import time
import json
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from collections import defaultdict
import threading

logger = logging.getLogger(__name__)


# ============================================================
# SCHEMA VALIDATION
# ============================================================

class SchemaValidator:
    """JSON Schema validator for API responses"""
    
    ADAPTER_RESPONSE_SCHEMA = {
        "type": "object",
        "required": ["company_id", "metric", "source_id", "fetched_at"],
        "properties": {
            "company_id": {"type": "string"},
            "metric": {"type": "string"},
            "raw_value": {"type": ["number", "null"]},
            "raw_units": {"type": "string"},
            "raw_currency": {"type": "string"},
            "source_id": {"type": "string"},
            "reported_at": {"type": "string"},
            "fetched_at": {"type": "string"},
            "meta": {"type": "object"}
        }
    }
    
    @staticmethod
    def validate(data: Dict, schema: Dict) -> tuple[bool, str]:
        """Validate data against schema. Returns (is_valid, error_message)"""
        try:
            # Basic validation - check required fields
            required = schema.get("required", [])
            for field in required:
                if field not in data:
                    return False, f"Missing required field: {field}"
            
            # Type checking for properties
            properties = schema.get("properties", {})
            for key, spec in properties.items():
                if key in data:
                    expected_type = spec.get("type")
                    value = data[key]
                    
                    if expected_type == "object" and not isinstance(value, dict):
                        return False, f"Field {key} must be object"
                    if expected_type == "string" and not isinstance(value, str):
                        return False, f"Field {key} must be string"
                    if expected_type == "number" and not isinstance(value, (int, float)):
                        if value is not None:
                            return False, f"Field {key} must be number"
                    if expected_type == "array" and not isinstance(value, list):
                        return False, f"Field {key} must be array"
            
            return True, ""
        except Exception as e:
            return False, f"Validation error: {str(e)}"


# ============================================================
# CIRCUIT BREAKER
# ============================================================

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"         # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreaker:
    """Circuit breaker pattern for API sources"""
    name: str
    failure_threshold: int = 5          # Failures before opening
    recovery_timeout: int = 60          # Seconds to wait before half-open
    half_open_success_threshold: int = 2  # Successes needed to close
    
    state: CircuitState = field(default=CircuitState.CLOSED)
    failures: int = field(default=0)
    successes: int = field(default=0)
    last_failure_time: float = field(default=0)
    lock: threading.Lock = field(default_factory=threading.Lock)
    
    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        with self.lock:
            if self.state == CircuitState.OPEN:
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    logger.info(f"[CircuitBreaker] {self.name} transitioning to HALF_OPEN")
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise CircuitBreakerOpenError(f"Circuit {self.name} is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        with self.lock:
            if self.state == CircuitState.HALF_OPEN:
                self.successes += 1
                if self.successes >= self.half_open_success_threshold:
                    logger.info(f"[CircuitBreaker] {self.name} transitioning to CLOSED")
                    self.state = CircuitState.CLOSED
                    self.failures = 0
                    self.successes = 0
            else:
                self.failures = 0
    
    def _on_failure(self):
        with self.lock:
            self.failures += 1
            self.last_failure_time = time.time()
            
            if self.state == CircuitState.HALF_OPEN:
                logger.warning(f"[CircuitBreaker] {self.name} transitioning back to OPEN (half-open failed)")
                self.state = CircuitState.OPEN
                self.successes = 0
            elif self.failures >= self.failure_threshold:
                logger.warning(f"[CircuitBreaker] {self.name} transitioning to OPEN")
                self.state = CircuitState.OPEN


class CircuitBreakerOpenError(Exception):
    pass


# ============================================================
# RATE LIMITING (Token Bucket)
# ============================================================

class TokenBucket:
    """Token bucket rate limiter"""
    
    def __init__(self, rate: int, capacity: int, name: str = "default"):
        self.rate = rate        # tokens per second
        self.capacity = capacity
        self.tokens = capacity
        self.name = name
        self.last_update = time.time()
        self.lock = threading.Lock()
    
    def acquire(self, tokens: int = 1) -> bool:
        """Try to acquire tokens. Returns True if successful."""
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_update = now
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
    
    def wait_and_acquire(self, tokens: int = 1, timeout: float = 30.0) -> bool:
        """Wait for tokens to become available"""
        start = time.time()
        while time.time() - start < timeout:
            if self.acquire(tokens):
                return True
            time.sleep(0.1)
        return False
    
    def get_available(self) -> int:
        with self.lock:
            return int(self.tokens)


class RateLimiter:
    """Multi-source rate limiter with token buckets"""
    
    def __init__(self):
        # Rate limits per source (requests per minute)
        self.limits = {
            "alpha_vantage": TokenBucket(rate=25/86400, capacity=25, name="alpha_vantage"),  # 25/day
            "fmp": TokenBucket(rate=100/60, capacity=100, name="fmp"),  # 100/min
            "gnews": TokenBucket(rate=100/86400, capacity=100, name="gnews"),  # 100/day
            "newsapi": TokenBucket(rate=100/86400, capacity=100, name="newsapi"),  # 100/day
            "tavily": TokenBucket(rate=1000/60, capacity=1000, name="tavily"),  # 1000/min
            "groq": TokenBucket(rate=30/60, capacity=30, name="groq"),  # 30/min
        }
        self.circuit_breakers = {
            name: CircuitBreaker(name=name, failure_threshold=5, recovery_timeout=60)
            for name in self.limits.keys()
        }
    
    def acquire(self, source: str, tokens: int = 1) -> bool:
        """Acquire rate limit tokens for a source"""
        if source not in self.limits:
            return True  # Unknown source, allow
        
        bucket = self.limits[source]
        return bucket.acquire(tokens)
    
    def wait_for(self, source: str, tokens: int = 1, timeout: float = 30.0) -> bool:
        """Wait for rate limit tokens"""
        if source not in self.limits:
            return True
        
        bucket = self.limits[source]
        return bucket.wait_and_acquire(tokens, timeout)
    
    def get_status(self) -> Dict:
        """Get rate limiter status"""
        return {
            source: {
                "available": bucket.get_available(),
                "circuit_state": self.circuit_breakers[source].state.value
            }
            for source, bucket in self.limits.items()
        }


# ============================================================
# PROVENANCE TRACKING
# ============================================================

@dataclass
class ProvenanceRecord:
    """Tracks the origin of each data point"""
    source: str
    raw_value: Any
    raw_units: str
    raw_currency: str
    fetched_at: str
    reported_at: Optional[str]
    raw_blob_id: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


class ProvenanceTracker:
    """Tracks data provenance throughout the pipeline"""
    
    def __init__(self):
        self.records: Dict[str, List[ProvenanceRecord]] = defaultdict(list)
    
    def add(self, metric_key: str, record: ProvenanceRecord):
        """Add provenance record for a metric"""
        self.records[metric_key].append(record)
    
    def get(self, metric_key: str) -> List[ProvenanceRecord]:
        """Get all provenance records for a metric"""
        return self.records.get(metric_key, [])
    
    def clear(self):
        """Clear all records"""
        self.records.clear()


# ============================================================
# RECONCILIATION ENGINE
# ============================================================

class ConfidenceLevel(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    VERY_LOW = "very_low"


@dataclass
class ReconciliationCandidate:
    """A single data point candidate for reconciliation"""
    value: float
    source: str
    fetched_at: str
    reported_at: Optional[str]
    raw_blob_id: Optional[str] = None
    units: str = ""
    currency: str = ""


class ReconciliationEngine:
    """
    Deterministic reconciliation algorithm
    Implements the algorithm from the architecture doc
    """
    
    # Max age for each metric type (seconds)
    MAX_AGE = {
        "market_cap": 48 * 3600,      # 48 hours
        "price": 5 * 60,               # 5 minutes
        "revenue": 24 * 3600,         # 24 hours
        "ebitda": 24 * 3600,
        "pe_ratio": 24 * 3600,
        "roe": 24 * 3600,
        "default": 24 * 3600,
    }
    
    # Tolerance thresholds
    PRIMARY_TOLERANCE = 0.15      # 15% variance = high confidence
    SECONDARY_TOLERANCE = 0.30   # 30% variance = medium confidence
    
    # Source trust scores (rolling based on success rate)
    SOURCE_TRUST = {
        "nse_india": 0.95,
        "bse_india": 0.90,
        "fmp": 0.80,
        "yfinance": 0.78,
        "alpha_vantage": 0.75,
        "gnews": 0.70,
        "newsapi": 0.70,
        "tavily": 0.65,
    }
    
    def reconcile(self, metric_key: str, candidates: List[ReconciliationCandidate]) -> Dict:
        """
        Main reconciliation function
        Returns: {value, confidence, provenance, diagnostics}
        """
        if not candidates:
            return {
                "value": None,
                "confidence": ConfidenceLevel.VERY_LOW.value,
                "provenance": [],
                "issue": "missing_data",
                "diagnostics": {}
            }
        
        # Step 1: Remove stale candidates
        max_age = self.MAX_AGE.get(metric_key, self.MAX_AGE["default"])
        now = datetime.now()
        valid_candidates = []
        
        for c in candidates:
            try:
                fetched = datetime.fromisoformat(c.fetched_at.replace('Z', '+00:00'))
                age = (now - fetched).total_seconds()
                if age <= max_age:
                    valid_candidates.append(c)
            except:
                valid_candidates.append(c)  # Keep if can't parse
        
        if not valid_candidates:
            return {
                "value": None,
                "confidence": ConfidenceLevel.VERY_LOW.value,
                "provenance": [],
                "issue": "stale_data",
                "diagnostics": {}
            }
        
        # Step 2: Compute statistics
        values = [c.value for c in valid_candidates if c.value is not None]
        
        if not values:
            return {
                "value": None,
                "confidence": ConfidenceLevel.LOW.value,
                "provenance": [],
                "issue": "no_numeric_values",
                "diagnostics": {}
            }
        
        values_sorted = sorted(values)
        n = len(values_sorted)
        median = values_sorted[n // 2] if n % 2 else (values_sorted[n//2 - 1] + values_sorted[n//2]) / 2
        mean = sum(values) / n
        std_dev = (sum((x - mean) ** 2 for x in values) / n) ** 0.5 if n > 1 else 0
        min_val = min(values)
        max_val = max(values)
        
        # Step 3: Check primary tolerance (variance check)
        if median != 0:
            variance = (max_val - min_val) / abs(median)
        else:
            variance = float('inf')
        
        if variance <= self.PRIMARY_TOLERANCE:
            # High confidence - sources agree
            return {
                "value": median,
                "confidence": ConfidenceLevel.HIGH.value,
                "provenance": self._get_top_provenance(valid_candidates, 3),
                "diagnostics": {
                    "median": median,
                    "mean": mean,
                    "std_dev": std_dev,
                    "variance": variance,
                    "candidate_count": len(valid_candidates)
                }
            }
        
        # Step 4: Sources disagree - use trust scores
        scored_candidates = []
        for c in valid_candidates:
            if c.value is not None:
                trust = self.SOURCE_TRUST.get(c.source, 0.5)
                # Recency weight
                try:
                    fetched = datetime.fromisoformat(c.fetched_at.replace('Z', '+00:00'))
                    age_hours = (now - fetched).total_seconds() / 3600
                    recency_weight = max(0, 1 - (age_hours / 48))  # Decay over 48h
                except:
                    recency_weight = 0.5
                
                score = trust + (recency_weight * 0.3)
                scored_candidates.append((score, c))
        
        scored_candidates.sort(reverse=True)
        
        # Check secondary tolerance between top 2
        if len(scored_candidates) >= 2:
            top_value = scored_candidates[0][1].value
            second_value = scored_candidates[1][1].value
            
            if top_value and second_value and top_value != 0:
                secondary_variance = abs(top_value - second_value) / abs(top_value)
                
                if secondary_variance <= self.SECONDARY_TOLERANCE:
                    return {
                        "value": median,
                        "confidence": ConfidenceLevel.MEDIUM.value,
                        "provenance": self._get_top_provenance(valid_candidates, 3),
                        "diagnostics": {
                            "median": median,
                            "variance": variance,
                            "top_source": scored_candidates[0][1].source,
                            "candidate_count": len(valid_candidates)
                        }
                    }
        
        # Step 5: Conflict - return lowest confidence
        return {
            "value": scored_candidates[0][1].value if scored_candidates else None,
            "confidence": ConfidenceLevel.LOW.value,
            "provenance": self._get_top_provenance(valid_candidates, 1),
            "issue": "conflicting_sources",
            "diagnostics": {
                "variance": variance,
                "top_source": scored_candidates[0][1].source if scored_candidates else None,
                "candidate_count": len(valid_candidates)
            }
        }
    
    def _get_top_provenance(self, candidates: List[ReconciliationCandidate], k: int) -> List[Dict]:
        """Get provenance for top k candidates"""
        prov = []
        for c in sorted(candidates, key=lambda x: x.fetched_at, reverse=True)[:k]:
            prov.append({
                "source": c.source,
                "value": c.value,
                "fetched_at": c.fetched_at,
                "raw_blob_id": c.raw_blob_id
            })
        return prov


# ============================================================
# OBSERVABILITY
# ============================================================

class MetricsCollector:
    """Simple metrics collector for observability"""
    
    def __init__(self):
        self.metrics = defaultdict(lambda: {
            "count": 0,
            "errors": 0,
            "total_latency": 0.0,
            "last_error": None
        })
        self.lock = threading.Lock()
    
    def record(self, name: str, latency: float = 0, error: bool = False):
        with self.lock:
            m = self.metrics[name]
            m["count"] += 1
            if error:
                m["errors"] += 1
                m["last_error"] = datetime.now().isoformat()
            m["total_latency"] += latency
    
    def get_stats(self, name: str) -> Dict:
        with self.lock:
            m = self.metrics.get(name, {})
            count = m.get("count", 0)
            return {
                "count": count,
                "errors": m.get("errors", 0),
                "error_rate": m.get("errors", 0) / count if count > 0 else 0,
                "avg_latency": m.get("total_latency", 0) / count if count > 0 else 0,
                "last_error": m.get("last_error")
            }
    
    def get_all(self) -> Dict:
        return {name: self.get_stats(name) for name in self.metrics.keys()}


# ============================================================
# GLOBAL INSTANCES
# ============================================================

# Global rate limiter
rate_limiter = RateLimiter()

# Global provenance tracker
provenance_tracker = ProvenanceTracker()

# Global reconciliation engine
reconciliation_engine = ReconciliationEngine()

# Global metrics collector
metrics_collector = MetricsCollector()
