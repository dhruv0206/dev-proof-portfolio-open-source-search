---
name: gemini-integration
description: Integrate Google Gemini 2.0 AI for embeddings, query parsing, and text generation
---

# Gemini AI Integration Skill

## When to Use
Use this skill when working with Google Gemini 3.0 for:
- Generating text embeddings for semantic search
- Parsing natural language queries
- Text generation and summarization
- AI-powered features in DevProof

## Setup

### Environment Variables
```bash
# .env
GOOGLE_API_KEY=your_gemini_api_key
```

### Installation
```bash
pip install google-generativeai
```

## Text Embeddings

### Generate Embeddings for Search
```python
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

async def generate_embedding(text: str) -> list[float]:
    """Generate embedding for semantic search."""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="RETRIEVAL_DOCUMENT"  # or "RETRIEVAL_QUERY" for queries
    )
    return result['embedding']

# For queries (use RETRIEVAL_QUERY)
async def generate_query_embedding(query: str) -> list[float]:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=query,
        task_type="RETRIEVAL_QUERY"
    )
    return result['embedding']
```

### Batch Embedding
```python
async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts efficiently."""
    results = []
    for text in texts:
        embedding = await generate_embedding(text)
        results.append(embedding)
    return results
```

## Query Parsing

### Parse Natural Language Queries
```python
import json
from pydantic import BaseModel
from typing import Optional, List

class ParsedQuery(BaseModel):
    keywords: List[str]
    programming_language: Optional[str]
    difficulty: Optional[str]  # beginner, intermediate, advanced
    labels: List[str]
    freshness: Optional[str]  # today, this_week, this_month
    assigned: Optional[bool]

async def parse_search_query(query: str) -> ParsedQuery:
    """Use Gemini to parse natural language search query."""
    model = genai.GenerativeModel("gemini-3-pro-preview")
    
    prompt = f"""Parse this GitHub issue search query and extract structured information.
    
Query: "{query}"

Return ONLY valid JSON with these fields:
- keywords: list of main search terms
- programming_language: detected language (null if none)
- difficulty: "beginner", "intermediate", or "advanced" (null if none)
- labels: list of GitHub labels like "good first issue", "help wanted", "bug"
- freshness: "today", "this_week", "this_month" (null if none)
- assigned: true if looking for assigned, false if unassigned, null if not specified

Examples:
- "beginner Python issues" -> {{"keywords": ["issues"], "programming_language": "Python", "difficulty": "beginner", "labels": ["good first issue"], "freshness": null, "assigned": null}}
- "unassigned TypeScript bugs" -> {{"keywords": ["bugs"], "programming_language": "TypeScript", "difficulty": null, "labels": ["bug"], "freshness": null, "assigned": false}}

Return JSON only, no markdown:"""

    response = await model.generate_content_async(prompt)
    
    try:
        parsed = json.loads(response.text.strip())
        return ParsedQuery(**parsed)
    except (json.JSONDecodeError, ValueError) as e:
        # Fallback: return basic parsed query
        return ParsedQuery(
            keywords=query.split(),
            programming_language=None,
            difficulty=None,
            labels=[],
            freshness=None,
            assigned=None
        )
```

## Text Generation

### Summarize Content
```python
async def summarize_issue(title: str, body: str, max_length: int = 200) -> str:
    """Generate a concise summary of a GitHub issue."""
    model = genai.GenerativeModel("gemini-3-pro-preview")
    
    prompt = f"""Summarize this GitHub issue in {max_length} characters or less.
    
Title: {title}
Body: {body[:2000]}  # Truncate for token limits

Provide a clear, actionable summary that helps developers understand what needs to be done."""

    response = await model.generate_content_async(prompt)
    return response.text.strip()
```

### Generate Tags/Labels
```python
async def suggest_labels(title: str, body: str) -> list[str]:
    """Suggest appropriate GitHub labels for an issue."""
    model = genai.GenerativeModel("gemini-3-pro-preview")
    
    prompt = f"""Suggest appropriate GitHub issue labels for this issue.
    
Title: {title}
Body: {body[:1000]}

Choose from: bug, feature, documentation, good first issue, help wanted, enhancement, question, duplicate, invalid, wontfix

Return as JSON array of strings:"""

    response = await model.generate_content_async(prompt)
    try:
        return json.loads(response.text.strip())
    except json.JSONDecodeError:
        return []
```

## Configuration Options

### Model Selection
```python
# For fast responses
model = genai.GenerativeModel("gemini-3-pro-preview")

# For complex reasoning
model = genai.GenerativeModel("gemini-3-pro-preview")
```

### Generation Config
```python
generation_config = {
    "temperature": 0.2,      # Lower = more deterministic
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 1000,
}

model = genai.GenerativeModel(
    "gemini-3-pro-preview",
    generation_config=generation_config
)
```

### Safety Settings
```python
from google.generativeai.types import HarmCategory, HarmBlockThreshold

safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
}

model = genai.GenerativeModel(
    "gemini-3-pro-preview",
    safety_settings=safety_settings
)
```

## Error Handling

```python
from google.api_core import exceptions

async def safe_generate(prompt: str) -> Optional[str]:
    """Generate with proper error handling."""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = await model.generate_content_async(prompt)
        return response.text
    except exceptions.ResourceExhausted:
        # Rate limited
        await asyncio.sleep(60)
        return await safe_generate(prompt)
    except exceptions.InvalidArgument as e:
        logger.error(f"Invalid prompt: {e}")
        return None
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return None
```

## Integration with Pinecone

```python
async def search_similar_issues(query: str, top_k: int = 20):
    """Full semantic search pipeline."""
    # 1. Parse query
    parsed = await parse_search_query(query)
    
    # 2. Generate query embedding
    query_embedding = await generate_query_embedding(query)
    
    # 3. Search Pinecone
    from app.services.pinecone_client import pinecone_index
    
    results = pinecone_index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter=build_filter(parsed)  # Apply parsed filters
    )
    
    return results.matches
```

## Checklist

- [ ] API key configured in environment
- [ ] Using async methods for non-blocking calls
- [ ] Proper error handling for API failures
- [ ] Token limits respected (truncate long inputs)
- [ ] Temperature set appropriately for use case
- [ ] JSON responses validated with Pydantic
