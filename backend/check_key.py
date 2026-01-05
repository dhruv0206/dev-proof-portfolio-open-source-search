from app.config import get_settings
from app.services.graphql_fetcher import GraphQLFetcher
import time

s = get_settings()
print(f"App ID: {s.gh_app_id}")
print(f"System time (UTC): {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")

try:
    fetcher = GraphQLFetcher()
    jwt = fetcher._generate_jwt()
    print(f"JWT generated: {jwt[:50]}...")
    token = fetcher._get_installation_token()
    print(f"Installation token: {token[:20]}...")
except Exception as e:
    print(f"Error: {e}")
