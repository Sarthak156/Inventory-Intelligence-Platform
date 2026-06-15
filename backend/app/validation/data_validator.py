def validate_dataframe(df):

    errors = []

    if df.isnull().sum().sum() > 0:
        errors.append("Null values detected")

    if df.duplicated().sum() > 0:
        errors.append("Duplicate rows found")

    return errors