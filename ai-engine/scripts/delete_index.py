
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pinecone_client import PineconeClient
import logging

logging.basicConfig(level=logging.INFO)

def main():
    load_dotenv()
    print("WARNING: This will delete ALL vectors in your Pinecone index.")
    agreement = input("Type 'DELETE' to confirm: ")
    
    if agreement != "DELETE":
        print("Aborted.")
        return

    client = PineconeClient()
    print(f"Deleting all vectors from index '{client.index_name}'...")
    client.delete_all()
    print("Done! You can now run ingest_graphql.py to re-index.")

if __name__ == "__main__":
    main()
