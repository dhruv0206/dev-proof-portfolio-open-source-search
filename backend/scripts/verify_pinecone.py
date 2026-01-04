"""Verify Pinecone data by fetching recent records."""

import logging
from app.services.pinecone_client import PineconeClient
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    client = PineconeClient()
    stats = client.get_index_stats()
    logger.info(f"Index Stats: {stats}")
    
    # We can't truly "sort" by metadata in pure search without vector, 
    # but we can query with a dummy vector and filter for recently ingested items.
    # However, standard query requires a vector.
    
    # Generate a real query embedding for "Python"
    from app.services.embedder import EmbeddingService
    embedder = EmbeddingService()
    query_vec = embedder.generate_query_embedding("Python")
    
    logger.info("Fetching recent issues (query: 'Python')...")
    results = client.search(
        query_embedding=query_vec,
        top_k=5,
        filter_dict={"ingested_at": {"$gt": 0}}
    )
    
    for match in results:
        meta = match["metadata"]
        ingested_ts = meta.get("ingested_at", 0)
        ingested_dt = datetime.fromtimestamp(ingested_ts).isoformat() if ingested_ts else "N/A"
        
        print(f"\nID: {match['id']}")
        print(f"Title: {meta.get('title')}")
        print(f"Ingested At: {ingested_dt} (TS: {ingested_ts})")
        print("-" * 50)

if __name__ == "__main__":
    main()
