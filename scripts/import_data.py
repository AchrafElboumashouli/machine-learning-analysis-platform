import pandas as pd
from state import state

def import_csv(file):
    df = pd.read_csv(file)
    state.df = df

    return {
        "rows": df.shape[0],
        "columns": df.shape[1],
        "column_names": df.columns.tolist(),
        "preview": df.head(5).to_dict(orient="records")
    }
