from state import state

def explore():
    df = state.df
    if df is None:
        return {"error": "No dataset loaded"}

    return {
        "shape": df.shape,
        "dtypes": df.dtypes.astype(str).to_dict(),
        "missing": df.isnull().sum().to_dict()
    }
