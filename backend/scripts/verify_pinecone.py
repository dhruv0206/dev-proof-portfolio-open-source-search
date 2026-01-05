
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pinecone_client import PineconeClient
from app.services.embedder import EmbeddingService
from app.config import get_settings
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    load_dotenv()
    
    client = PineconeClient()
    embedder = EmbeddingService()
    
    # Specific query for the kitkat issue
    search_text = "visual Activity Diagram for merge Command"
    print(f"Searching for: '{search_text}'...")
    
    query_vec = embedder.generate_query_embedding(search_text)
    
    results = client.index.query(
        vector=query_vec,
        top_k=5,
        include_metadata=True
    )
    
    print("\nResults:")
    for match in results["matches"]:
        meta = match["metadata"]
        print(f"\nID: {match['id']}")
        print(f"Title: {meta.get('title')}")
        print(f"Repo: {meta.get('repo_full_name')}")
        print("-" * 50)
