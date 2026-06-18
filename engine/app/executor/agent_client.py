import httpx


PRIVATE_IP_PATTERN = [
    "localhost",
    "127.",
    "10.",
    "192.168.",
    "172.16.",
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",
    "0.0.0.0",
]


def is_private_url(url: str) -> bool:
    lower = url.lower()
    return any(pat in lower for pat in PRIVATE_IP_PATTERN)


async def call_agent(
    endpoint_url: str,
    auth_header: str,
    message: str,
    session_id: str,
    timeout: float = 15.0,
) -> str:
    if is_private_url(endpoint_url):
        raise ValueError(f"Private endpoint not allowed: {endpoint_url}")

    headers = {"Content-Type": "application/json"}
    if auth_header:
        # Support "Authorization: Bearer xxx" or just "Bearer xxx"
        if ":" in auth_header:
            key, value = auth_header.split(":", 1)
            headers[key.strip()] = value.strip()
        else:
            headers["Authorization"] = auth_header.strip()

    payload = {"message": message, "session_id": session_id}

    async with httpx.AsyncClient(timeout=timeout) as client:
        for attempt in range(3):
            try:
                resp = await client.post(endpoint_url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                # Try common response field names
                for field in ("message", "response", "content", "text", "reply", "output"):
                    if field in data and isinstance(data[field], str):
                        return data[field]
                # Fallback: return the full JSON as string
                return str(data)
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                if attempt == 2:
                    raise RuntimeError(f"Agent unreachable after 3 attempts: {e}") from e
            except httpx.HTTPStatusError as e:
                raise RuntimeError(f"Agent returned HTTP {e.response.status_code}") from e
    return ""
