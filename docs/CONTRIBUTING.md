# Contributing Guide

**Inventory Intelligence Platform — Contribution Guidelines**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Setup Instructions](#1-setup-instructions)
2. [Coding Standards](#2-coding-standards)
3. [PR Flow](#3-pr-flow)
4. [Branch Naming](#4-branch-naming)
5. [Commit Conventions](#5-commit-conventions)
6. [Testing Expectations](#6-testing-expectations)

---

## 1. Setup Instructions

### Prerequisites

- **Node.js** v18.0.0 or higher
- **Python** 3.11 or higher
- **Git**
- **npm** or **pnpm** (recommended)

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/Sarthak156/Inventory-Intelligence-Platform.git
cd inventory-intelligence-platform

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Start development servers
# Terminal 1: Backend
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Verify Setup

```bash
# Backend
curl http://localhost:8000/
# → {"message":"Backend running"}

# Frontend
# Open http://localhost:5173 → Dashboard loads
```

---

## 2. Coding Standards

### 2.1 Python (Backend)

**Style Guide:** [PEP 8](https://www.python.org/dev/peps/pep-0008/)

```python
# ✅ Good
def calculate_forecast(monthly_demand):
    """Compute forecast using 3-month rolling average."""
    result = monthly_demand.rolling(window=3).mean()
    return result

# ❌ Bad
def calc(m):
    return m.rolling(3).mean()
```

**Rules:**
- Use 4 spaces for indentation (no tabs)
- Maximum line length: 88 characters (Black formatter)
- Use type hints for function parameters and return values
- Write docstrings for all public functions
- Use snake_case for variables and functions
- Use PascalCase for classes

**Imports Order:**
```python
# Standard library
import os
import uuid

# Third-party
import pandas as pd
from fastapi import APIRouter

# Local
from app.utils.data_transformer import transform_dataset
```

### 2.2 JavaScript/React (Frontend)

**Style Guide:** [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

```jsx
// ✅ Good
function KPICard({ title, value, trend, icon: Icon }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="kpi-card">
      <Icon size={16} />
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

// ❌ Bad
function kpi(props) {
  return <div>{props.title}</div>;
}
```

**Rules:**
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for components
- Use destructuring for props
- Use functional components with hooks (no class components)

### 2.3 CSS/TailwindCSS

```jsx
// ✅ Good: Use TailwindCSS utility classes
<div className="theme-bg-card border theme-border rounded-2xl p-6">
  <h2 className="text-sm uppercase tracking-widest theme-text font-semibold">
    Title
  </h2>
</div>

// ❌ Bad: Custom CSS when Tailwind utility exists
<div className="custom-card-style">
```

---

## 3. PR Flow

### 3.1 Pull Request Process

```
1. Create a feature branch from `main`
2. Make your changes
3. Run tests
4. Push your branch
5. Create Pull Request to `main`
6. Request review from maintainers
7. Address review feedback
8. Squash merge
```

### 3.2 PR Requirements

| Requirement | Mandatory | Description |
|-------------|-----------|-------------|
| Descriptive title | ✅ | Summarize the change |
| Description | ✅ | What and why |
| Linked issue | ✅ | Reference related issue |
| Tests passing | ✅ | All tests pass |
| No conflicts | ✅ | Rebase on main |
| Code review | ✅ | At least 1 approval |

### 3.3 PR Template

```markdown
## Description
[Describe the changes in this PR]

## Related Issue
Fixes #[issue_number]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Tested locally
- [ ] Tested in staging

## Screenshots
[If UI changes]

## Additional Notes
[Any deployment notes, migration steps, etc.]
```

---

## 4. Branch Naming

### 4.1 Convention

```
<type>/<brief-description>
```

### 4.2 Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat/` | New feature | `feat/export-xlsx-support` |
| `fix/` | Bug fix | `fix/forecast-cache-clearing` |
| `docs/` | Documentation | `docs/api-reference-update` |
| `refactor/` | Code refactoring | `refactor/risk-engine` |
| `perf/` | Performance | `perf/dataframe-optimization` |
| `test/` | Testing | `test/risk-engine-coverage` |
| `chore/` | Maintenance | `chore/update-dependencies` |

### 4.3 Examples

```bash
# Good
git checkout -b feat/export-multiple-formats
git checkout -b fix/upload-memory-leak
git checkout -b docs/api-reference-v2

# Bad
git checkout -b my-changes
git checkout -b fix-bug
git checkout -b update
```

---

## 5. Commit Conventions

### 5.1 Format

```
<type>(<scope>): <description>

[optional body]
```

### 5.2 Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, etc. |

### 5.3 Examples

```bash
# Good commits
feat(export): add XLSX format support
fix(upload): resolve memory leak on large files
docs(api): update monthly-demand endpoint docs
perf(forecast): optimize rolling average calculation
test(risk): add unit tests for risk engine
chore(deps): update FastAPI to 0.115

# Bad commits
"fixed stuff"
"update"
"WIP"
"asdf"
```

### 5.4 Commit Body

```bash
# When needed, add body to explain why
feat(forecast): add sparse demand handling

Implement specialized forecasting for SKUs with intermittent demand
patterns. Uses non-zero moving average and category-level fallback.

Closes #42
```

---

## 6. Testing Expectations

### 6.1 Testing Philosophy

- **Unit tests** for business logic (risk engine, data transformer)
- **Integration tests** for API endpoints
- **Manual testing** for UI components (currently)
- **Aim for 80%+ coverage** on backend business logic

### 6.2 Running Tests

```bash
# Backend tests (when implemented)
cd backend
pytest

# With coverage
pytest --cov=app tests/

# Frontend tests (when implemented)
cd frontend
npm test
```

### 6.3 Test Locations

| Component | Test File Location | Testing Framework |
|-----------|-------------------|-------------------|
| Risk Engine | `backend/tests/test_risk_engine.py` | pytest |
| Data Transformer | `backend/tests/test_data_transformer.py` | pytest |
| API Endpoints | `backend/tests/test_api.py` | pytest + httpx |
| React Components | `frontend/src/**/*.test.jsx` | Vitest + React Testing Library |

### 6.4 What to Test

```python
# ✅ Test these
def test_risk_score_calculation():
    """Verify risk score formula produces correct results."""
    ...

def test_sparse_sku_classification():
    """Check SKU is correctly classified as SPARSE."""
    ...

def test_forecast_for_inactive_sku():
    """Ensure inactive SKU returns zero forecast."""
    ...

# ❌ Don't test these
# - Framework internals (FastAPI, React)
# - Third-party library behavior (Pandas, Recharts)
# - Simple getters/setters
```

### 6.5 Before Submitting

```bash
# Checklist before creating PR
□ Code follows style guidelines
□ All tests pass
□ New tests added for new features
□ Documentation updated
□ PR description filled out
□ Branch is up to date with main
□ No merge conflicts
```

---

*End of Contributing Guide*