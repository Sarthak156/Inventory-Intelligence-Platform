# Changelog

**Inventory Intelligence Platform — Release History**

**Version:** 1.0.0  
**Last Updated:** July 2026

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-01

### Added
- **Initial Production Release**
- Full-featured operational dashboard with 8 KPI cards, sparklines, and real-time metrics
- AI Operations Command Center with critical alert banner and animated indicators
- Multi-strategy forecasting engine with SKU state classification (ACTIVE, SPARSE, DORMANT, INACTIVE)
- Inventory risk assessment engine with composite scoring (volatility, sparsity, forecast growth)
- AI-driven recommendation engine with severity classification (CRITICAL, WARNING, OPTIMIZATION, INFO)
- Multi-format export system (CSV, XLSX) with streaming and 50,000 row limit
- File upload pipeline with multi-sheet Excel and CSV support
- Wide-to-long data transformation with intelligent column normalization
- Per-SKU forecast with confidence scoring and HALB fallback logic
- Intermittent demand spike modeling for sparse SKUs
- In-memory DataFrame cache with mtime-based invalidation
- Paginated inventory browser with search and month/year filters
- Gemini API integration for enhanced AI insights
- Fallback insight templates for offline resilience
- React 19 with Vite 8, TailwindCSS 4, and Recharts 3
- FastAPI backend with modular router architecture
- Docker support with Dockerfile and docker-compose
- HuggingFace Spaces deployment configuration
- Vercel deployment configuration with SPA rewrites
- Comprehensive logging with structured format
- JSON compliance cleanup (NaN/Inf → null) for Axios compatibility

### Fixed
- JSON serialization errors with numpy float types
- CORS configuration for cross-origin requests
- Empty state handling for missing data files
- Sparse demand forecast amplitude explosion with capping logic
- Seed-based RNG for reproducible intermittent demand curves
- Excel file cleanup on upload failure
- File descriptor cleanup in upload endpoint

### Performance
- Generator-based CSV export streaming (O(1) memory per row)
- mtime-based DataFrame caching (avoids redundant CSV reads)
- Vectorized NumPy operations in risk engine
- Pre-cleanup of Inf/NaN values before JSON serialization
- `low_memory=False` for efficient CSV reading

---

## [0.9.0] - 2026-06-15

### Added
- Export system with CSV and XLSX format support
- Streaming response for large dataset exports
- Confidence interval calculation (Lower/Upper bounds)
- Risk metadata embedding in export files
- Export row limit safeguard (50,000 rows)

### Changed
- Refactored export to use async generator pattern
- Improved export error handling with graceful degradation

### Fixed
- XLSX export memory leak with temp file cleanup
- CSV header encoding for special characters

---

## [0.8.0] - 2026-06-01

### Added
- Inventory risk assessment engine
- Composite risk scoring with weighted dimensions
- SKU state classification (Stable, Volatile, Sparse, Dormant, Surging)
- Explainable risk tagging with root cause identification
- Demand trend analysis (UP, DOWN, STABLE)
- Risk score sorting (highest risk first)

### Changed
- Moved risk logic from API route to dedicated service module
- Improved risk score normalization with capping

---

## [0.7.0] - 2026-05-15

### Added
- Dashboard redesign with AI Operations Command Center theme
- 8 KPI cards with sparkline charts
- Critical alert banner with animated ping indicator
- Risk distribution pie chart with donut style
- High-risk SKU table with actionable recommendations
- Inventory health bar chart
- AI Insight Engine panel with severity-coded cards
- Risk trend area chart
- Forecast summary with model confidence bar
- Horizon selector (1M, 3M, 6M, 12M)

### Changed
- Complete visual overhaul with dark theme
- Improved chart responsiveness and tooltips
- Enhanced loading skeleton animation

---

## [0.6.0] - 2026-05-01

### Added
- AI insights generation engine
- Severity-classified insights (CRITICAL, WARNING, OPTIMIZATION, INFO)
- Confidence-scored recommendations
- Gemini API integration for enhanced intelligence
- Local fallback insight generation
- Cached insight delivery for performance
- Insight templates for common scenarios

### Changed
- Refactored insight generation into dedicated service
- Improved error handling for API failures

---

## [0.5.0] - 2026-04-15

### Added
- Advanced forecasting with sparse demand handling
- SKU state classification (ACTIVE, SPARSE, DORMANT, INACTIVE)
- HALB (category-level) fallback for low-confidence SKUs
- Global fallback for uncategorized SKUs
- 12-month iterative forward projection
- Intermittent demand spike modeling
- Amplitude safeguarding for forecast stability
- Confidence scoring with volatility adjustment
- Seed-based RNG for reproducible forecasts

### Changed
- Replaced simple moving average with multi-strategy approach
- Improved forecast accuracy for intermittent demand patterns

---

## [0.4.0] - 2026-04-01

### Added
- Per-SKU demand forecasting
- Part number selection dropdown
- Monthly demand visualization with Recharts
- Forecast vs actual comparison chart
- Future month projection display

### Fixed
- Date parsing for various month formats
- Empty state handling for SKUs with no data

---

## [0.3.0] - 2026-03-15

### Added
- File upload pipeline with multi-sheet support
- Wide-to-long data transformation
- Intelligent column normalization (Part Number, SKU, Item → Part No)
- Data validation with descriptive error messages
- Streaming file upload to disk
- UUID-based file identification
- Sheet name extraction for Excel files

### Changed
- Refactored upload logic into dedicated router
- Improved error messages for invalid files

---

## [0.2.0] - 2026-03-01

### Added
- FastAPI backend with CORS configuration
- Basic analytics endpoints (monthly-demand, inventory-risk)
- In-memory DataFrame cache with mtime invalidation
- Legacy forecast endpoint with 3-month rolling average
- Parts list endpoint
- Paginated inventory endpoint with search and filters
- Month/year filter options endpoint

### Changed
- Migrated from Flask to FastAPI for async support

---

## [0.1.0] - 2026-02-15

### Added
- Initial project scaffold
- React frontend with Vite
- TailwindCSS configuration
- Basic page routing (Dashboard, Forecast, Inventory, Risks, Upload)
- Sidebar navigation component
- Axios API service setup
- Project structure and documentation

---

*End of Changelog*