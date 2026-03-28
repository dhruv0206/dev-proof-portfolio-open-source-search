"""IP-based rate limiting for public endpoints."""

import time
from collections import defaultdict
from fastapi import Request, HTTPException


class RateLimiter:
    """In-memory IP-based rate limiter with sliding window."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def check(self, request: Request) -> None:
        ip = self._get_client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        # Clean old entries
        self._requests[ip] = [t for t in self._requests[ip] if t > cutoff]

        if len(self._requests[ip]) >= self.max_requests:
            retry_after = int(self._requests[ip][0] + self.window_seconds - now) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )

        self._requests[ip].append(now)


# Pre-configured limiters
scan_limiter = RateLimiter(max_requests=50, window_seconds=86400)   # 50/day
audit_limiter = RateLimiter(max_requests=20, window_seconds=86400)  # 20/day
