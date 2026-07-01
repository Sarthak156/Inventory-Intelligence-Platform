# Data Schema

**Inventory Intelligence Platform — Data Structure & Validation**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Dataset Structure](#1-dataset-structure)
2. [Columns & Data Types](#2-columns--data-types)
3. [Required Fields](#3-required-fields)
4. [Nullable Fields](#4-nullable-fields)
5. [Preprocessing Rules](#5-preprocessing-rules)
6. [Validation Logic](#6-validation-logic)
7. [Upload Expectations](#7-upload-expectations)

---

## 1. Dataset Structure

### 1.1 Supported Formats

The platform accepts two data formats:

**Wide Format (Recommended for Excel):**
```
| Part No | Part Description | Category | Jan-2024 | Feb-2024 | Mar-2024 | ... |
|---------|-----------------|----------|----------|----------|----------|-----|
| SKU-001 | Widget A        | A        | 1200     | 1150     | 1300     | ... |
| SKU-002 | Widget B        | B        | 800      | 950      | 900      | ... |
```

**Long Format (Recommended for CSV):**
```
| Part No | Month    | Demand | Category |
|---------|----------|--------|----------|
| SKU-001 | Jan-2024 | 1200   | A        |
| SKU-001 | Feb-2024 | 1150   | A        |
| SKU-002 | Jan-2024 | 800    | B        |
```

### 1.2 Transformed Output

After processing, all data is converted to long format:

```
| Part No | Month    | Demand | [Additional Columns] |
|---------|----------|--------|---------------------|
| SKU-001 | Jan-2024 | 1200   | ...                 |
| SKU-001 | Feb-2024 | 1150   | ...                 |
```

---

## 2. Columns & Data Types

### 2.1 Core Columns

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `Part No` | String | Unique part/SKU identifier | Required in input |
| `Month` | String | Month in "MMM-YYYY" format | Generated during transform |
| `Demand` | Float | Demand quantity for the period | Required in input |

### 2.2 Optional Columns

| Column | Type | Description | Used By |
|--------|------|-------------|---------|
| `Part Description` | String | Part name or description | Export, UI display |
| `Category` | String | Product category/HALB group | HALB fallback forecasting |
| `HALB` | String | Alternative category column | HALB fallback forecasting |
| `Part Number` | String | Alternative to Part No | Normalized to Part No |
| `SKU` | String | Alternative to Part No | Normalized to Part No |
| `Item` | String | Alternative to Part No | Normalized to Part No |
| `Part_No` | String | Alternative to Part No | Normalized to Part No |
| `Material` | String | Alternative to Part No | Normalized to Part No |

### 2.3 Data Type Mapping

```python
# After transformation:
dtypes = {
    "Part No": "object",      # String
    "Month": "object",        # String (MMM-YYYY)
    "Demand": "float64",      # Float
    "Category": "object",     # String (optional)
    "Part Description": "object",  # String (optional)
}
```

---

## 3. Required Fields

### 3.1 Mandatory Columns

The dataset **must** contain at least one of these columns:

| Column Name | Detection Priority |
|-------------|-------------------|
| `Part No` | 1 (Primary) |
| `Part Number` | 2 (Normalized) |
| `SKU` | 3 (Normalized) |
| `Item` | 4 (Normalized) |
| `Part_No` | 5 (Normalized) |
| `Material` | 6 (Normalized) |

### 3.2 Demand Data Requirements

The dataset must contain demand values in one of these forms:

**Wide Format:** Columns named as months (e.g., `Jan-2024`, `Feb-2024`)
- At least 3 months of data recommended for meaningful forecasts
- Values should be numeric (integers or floats)

**Long Format:** A `Demand` column with numeric values
- At least 3 rows per SKU recommended
- Month column must be parseable as dates

### 3.3 Validation Rules

```python
VALIDATION_RULES = {
    "part_no_exists": {
        "condition": "'Part No' in df.columns",
        "error": "Missing required 'Part No' column",
        "http_status": 400
    },
    "data_not_empty": {
        "condition": "not df.empty",
        "error": "Sheet is empty or invalid",
        "http_status": 400
    },
    "demand_numeric": {
        "condition": "Demand column is numeric after coercion",
        "error": "Demand values must be numeric",
        "http_status": 400
    },
    "month_parseable": {
        "condition": "At least some months parse as dates",
        "error": "Month format not recognized",
        "http_status": 400
    }
}
```

---

## 4. Nullable Fields

### 4.1 Allowed Nulls

| Field | Nullable | Default | Behavior |
|-------|----------|---------|----------|
| `Demand` | Yes | 0 | Nulls are filled with 0 |
| `Category` | Yes | None | HALB fallback disabled |
| `Part Description` | Yes | "N/A" | Displayed as "N/A" |
| Month columns (wide) | Yes | 0 | Treated as zero demand |

### 4.2 Null Handling

```python
# Demand null handling
df["Demand"] = pd.to_numeric(df["Demand"], errors="coerce")
df["Demand"] = df["Demand"].replace([np.inf, -np.inf], np.nan).fillna(0)

# Month null handling
parsed_months = pd.to_datetime(df["Month"], format="mixed", errors="coerce")
df["Month"] = parsed_months.dt.strftime("%b-%Y").fillna(df["Month"])

# JSON serialization
df = df.replace([np.inf, -np.inf], np.nan)
df = df.astype(object).where(pd.notna(df), None)
```

---

## 5. Preprocessing Rules

### 5.1 Column Normalization

```python
COLUMN_MAPPINGS = {
    "Part Number": "Part No",
    "SKU": "Part No",
    "Item": "Part No",
    "Part_No": "Part No",
    "Material": "Part No"
}

# Applied during process-sheet
df.rename(columns=COLUMN_MAPPINGS, inplace=True)
```

### 5.2 Wide-to-Long Transformation

```python
def transform_dataset(df):
    # 1. Check if already long format
    if "Month" in df.columns and "Demand" in df.columns:
        return df.copy()
    
    # 2. Identify month columns (exclude metadata columns)
    exclude_cols = [
        "part no", "total_demand", "total demand", "total",
        "part description", "description", "desc", "item description",
        "category", "name", "sku", "material description",
        "material descripton"
    ]
    
    month_columns = [
        col for col in df.columns
        if str(col).lower().strip() not in exclude_cols
        and not str(col).lower().startswith("unnamed")
    ]
    
    # 3. Melt wide to long
    df_long = df.melt(
        id_vars=["Part No"],
        value_vars=month_columns,
        var_name="Month",
        value_name="Demand"
    )
    
    return df_long
```

### 5.3 Date Normalization

```python
# Input formats accepted:
# - "Jan-2024", "Feb-2024", ... (MMM-YYYY)
# - "2024-01", "2024-02", ... (YYYY-MM)
# - "01/2024", "02/2024", ... (MM/YYYY)
# - "January 2024", "February 2024", ... (Month YYYY)

# Output format:
# - "Jan-2024", "Feb-2024", ... (MMM-YYYY)
```

### 5.4 Demand Cleaning

```python
# Steps applied in order:
1. pd.to_numeric(errors="coerce")  # Convert to numeric, NaN for non-numeric
2. .replace([np.inf, -np.inf], np.nan)  # Remove infinities
3. .fillna(0)  # Fill remaining nulls with 0
```

---

## 6. Validation Logic

### 6.1 Upload Validation

| Check | Method | Error Message |
|-------|--------|---------------|
| File extension | Check .csv or .xlsx | N/A (enforced by UUID extension) |
| File not empty | Check file size > 0 | "Error uploading file" |
| Sheet exists | Check sheet name in Excel | "Sheet not found" |

### 6.2 Processing Validation

```python
def validate_sheet(df, sheet_name):
    # 1. Empty check
    if df.empty:
        return False, f"Sheet '{sheet_name}' is empty or invalid."
    
    # 2. Part No column check
    if "Part No" not in df.columns:
        return False, f"Sheet '{sheet_name}' is missing required 'Part No' column."
    
    # 3. Data transformable check
    try:
        transform_dataset(df)
    except Exception as e:
        return False, f"Data transformation failed: {e}"
    
    return True, None
```

### 6.3 Export Validation

| Check | Rule |
|-------|------|
| Parts list | Must be non-empty array |
| Horizon | Must be 1-12 (integer) |
| Format | Must be "csv" or "xlsx" |
| Data exists | `transformed_data.csv` must exist |

---

## 7. Upload Expectations

### 7.1 File Size Limits

| Environment | Recommended Max | Hard Limit |
|-------------|-----------------|------------|
| Local development | 50MB | System memory |
| HuggingFace Spaces (Free) | 10MB | 8GB RAM |
| HuggingFace Spaces (Pro) | 50MB | 16GB RAM |

### 7.2 Data Volume Guidelines

| Metric | Recommended | Maximum |
|--------|-------------|---------|
| Rows per dataset | < 100,000 | ~500,000 |
| Unique SKUs | < 5,000 | ~10,000 |
| Months of history | 12-36 | 60 |
| Columns (wide format) | < 50 | 100 |

### 7.3 Example Valid Datasets

**Example 1: Simple Wide Format**
```csv
Part No,Jan-2024,Feb-2024,Mar-2024,Apr-2024,May-2024,Jun-2024
SKU-001,100,150,120,180,200,160
SKU-002,50,45,55,60,48,52
SKU-003,200,220,190,210,230,240
```

**Example 2: Long Format with Categories**
```csv
Part No,Month,Demand,Category,Description
SKU-001,Jan-2024,100,Electronics,Widget Alpha
SKU-001,Feb-2024,150,Electronics,Widget Alpha
SKU-002,Jan-2024,50,Mechanical,Bolt Set
SKU-002,Feb-2024,45,Mechanical,Bolt Set
```

**Example 3: Excel with Multiple Sheets**
```
Sheet1: "Data" (valid - has Part No and month columns)
Sheet2: "Summary" (invalid - no Part No column)
Sheet3: "Instructions" (invalid - metadata only)
```

### 7.4 Common Data Issues

| Issue | Example | Resolution |
|-------|---------|------------|
| Merged cells | Excel cells spanning multiple rows | Unmerge before upload |
| Non-numeric demand | "N/A" or "-" in demand cells | Replace with 0 or remove |
| Missing Part No | Blank rows in data | Remove blank rows |
| Inconsistent date format | Mixed "Jan-2024" and "2024-01" | System handles mixed formats |
| Special characters | "SKU-001/ A" with slashes | System handles via string columns |
| Very sparse data | 90%+ zero demand | System detects and uses fallback |

---

*End of Data Schema*