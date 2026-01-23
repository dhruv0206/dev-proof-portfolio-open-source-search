---
name: testing
description: Testing strategies for Next.js frontend and FastAPI backend
---

# Testing Skill

## When to Use
Use this skill when writing or running tests for DevProof.

## Backend Testing (FastAPI/Python)

### Setup
```bash
cd ai-engine
pip install pytest pytest-asyncio httpx
```

### Test Structure
```
ai-engine/
├── tests/
│   ├── __init__.py
│   ├── conftest.py         # Shared fixtures
│   ├── test_search.py      # Search endpoint tests
│   ├── test_issues.py      # Issues endpoint tests
│   └── test_services/
│       ├── test_search_engine.py
│       └── test_query_parser.py
```

### Configuration (conftest.py)
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_pinecone(mocker):
    """Mock Pinecone client for tests."""
    mock = mocker.patch("app.services.pinecone_client.index")
    mock.query.return_value = mocker.Mock(
        matches=[
            mocker.Mock(id="1", score=0.9, metadata={"title": "Test Issue"})
        ]
    )
    return mock

@pytest.fixture
def mock_gemini(mocker):
    """Mock Gemini API for tests."""
    mock = mocker.patch("google.generativeai.GenerativeModel")
    mock.return_value.generate_content_async.return_value = mocker.Mock(
        text='{"keywords": ["test"], "programming_language": "Python"}'
    )
    return mock
```

### API Tests
```python
# tests/test_search.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_search_endpoint(client: AsyncClient, mock_pinecone, mock_gemini):
    response = await client.post(
        "/api/search",
        json={"query": "beginner Python issues", "limit": 10}
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) <= 10

@pytest.mark.asyncio
async def test_search_empty_query(client: AsyncClient):
    response = await client.post(
        "/api/search",
        json={"query": "", "limit": 10}
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_search_pagination(client: AsyncClient, mock_pinecone, mock_gemini):
    response = await client.post(
        "/api/search",
        json={"query": "issues", "limit": 20, "page": 2}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2
```

### Service Tests
```python
# tests/test_services/test_query_parser.py
import pytest
from app.services.query_parser import parse_search_query

@pytest.mark.asyncio
async def test_parse_beginner_query(mock_gemini):
    result = await parse_search_query("beginner Python issues")
    assert result.programming_language == "Python"
    assert result.difficulty == "beginner"

@pytest.mark.asyncio
async def test_parse_unassigned_query(mock_gemini):
    result = await parse_search_query("unassigned help wanted")
    assert result.assigned == False
    assert "help wanted" in result.labels
```

### Running Backend Tests
```bash
cd ai-engine

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_search.py

# Run tests matching pattern
pytest -k "test_search"

# Verbose output
pytest -v
```

## Frontend Testing (Next.js/React)

### Setup
```bash
cd web-platform
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### Configuration (jest.config.js)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Setup File (jest.setup.js)
```javascript
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))
```

### Component Tests
```tsx
// __tests__/components/SearchBar.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchBar } from '@/components/finder/SearchBar'

describe('SearchBar', () => {
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    mockOnSearch.mockClear()
  })

  it('renders search input', () => {
    render(<SearchBar onSearch={mockOnSearch} />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('calls onSearch when form is submitted', async () => {
    render(<SearchBar onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText(/search/i)
    fireEvent.change(input, { target: { value: 'Python beginner issues' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('Python beginner issues')
    })
  })

  it('disables button when input is empty', () => {
    render(<SearchBar onSearch={mockOnSearch} />)
    const button = screen.getByRole('button', { name: /search/i })
    expect(button).toBeDisabled()
  })
})
```

### API Mocking
```tsx
// __tests__/components/IssueList.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { IssueList } from '@/components/finder/IssueList'

// Mock fetch
global.fetch = jest.fn()

describe('IssueList', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  it('displays loading state', () => {
    render(<IssueList query="test" />)
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('displays issues after fetch', async () => {
    const mockIssues = [
      { id: '1', title: 'Fix bug', repo: 'org/repo', labels: ['bug'] },
      { id: '2', title: 'Add feature', repo: 'org/repo', labels: ['enhancement'] }
    ]

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockIssues })
    })

    render(<IssueList query="test" />)

    await waitFor(() => {
      expect(screen.getByText('Fix bug')).toBeInTheDocument()
      expect(screen.getByText('Add feature')).toBeInTheDocument()
    })
  })

  it('displays error state on fetch failure', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<IssueList query="test" />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### Running Frontend Tests
```bash
cd web-platform

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- SearchBar.test.tsx
```

## E2E Testing (Playwright)

### Setup
```bash
cd web-platform
npm install --save-dev @playwright/test
npx playwright install
```

### Configuration (playwright.config.ts)
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Tests
```typescript
// e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Search Flow', () => {
  test('can search for issues', async ({ page }) => {
    await page.goto('/finder')
    
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('beginner Python issues')
    await searchInput.press('Enter')
    
    // Wait for results
    await expect(page.getByTestId('issue-card')).toHaveCount.greaterThan(0)
  })

  test('shows empty state for no results', async ({ page }) => {
    await page.goto('/finder')
    
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('xyzxyzxyz123nonexistent')
    await searchInput.press('Enter')
    
    await expect(page.getByText(/no results/i)).toBeVisible()
  })
})
```

### Running E2E Tests
```bash
cd web-platform

# Run all E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test search.spec.ts
```

## Checklist

- [ ] Unit tests cover critical paths
- [ ] API endpoints have request/response tests
- [ ] Components test user interactions
- [ ] Mocks are properly configured
- [ ] Tests are isolated (no shared state)
- [ ] Error states are tested
- [ ] Loading states are tested
