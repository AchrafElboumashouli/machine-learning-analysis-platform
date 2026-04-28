import json
import pandas as pd
import numpy as np
from io import StringIO
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler, MinMaxScaler, RobustScaler, MaxAbsScaler

def feature_engineer(csv_content: str, fe_steps: dict) -> dict:
    """Enhanced feature engineering logic from step_04_feature_engineering"""
    df = pd.read_csv(StringIO(csv_content))
    
    if fe_steps.get("encoding", {}).get("enabled"):
        col = fe_steps["encoding"].get("column")
        method = fe_steps["encoding"].get("method")
        
        if col in df.columns:
            if method == "Label Encoding":
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
            elif method == "One-Hot Encoding":
                ohe = OneHotEncoder(sparse_output=False, drop="first", handle_unknown="ignore")
                encoded = ohe.fit_transform(df[[col]])
                encoded_df = pd.DataFrame(
                    encoded, 
                    columns=ohe.get_feature_names_out([col]),
                    index=df.index
                )
                df = pd.concat([df.drop(columns=[col]), encoded_df], axis=1)

    if fe_steps.get("scaling", {}).get("enabled"):
        cols = fe_steps["scaling"].get("columns", [])
        method = fe_steps["scaling"].get("method", "StandardScaler")
        
        selected_cols = [c for c in cols if c in df.columns]
        if selected_cols:
            if method == "StandardScaler":
                scaler = StandardScaler()
            elif method == "MinMaxScaler":
                scaler = MinMaxScaler()
            elif method == "RobustScaler":
                scaler = RobustScaler()
            elif method == "MaxAbsScaler":
                scaler = MaxAbsScaler()
            
            df[selected_cols] = scaler.fit_transform(df[selected_cols])

    return {
        'status': 'Feature engineering completed',
        'processedData': df.to_dict('records'),
        'headers': df.columns.tolist()
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        csv_file = sys.argv[1]
        steps_json = sys.argv[2]
        with open(csv_file, 'r') as f:
            content = f.read()
        steps = json.loads(steps_json)
        result = feature_engineer(content, steps)
        print(json.dumps(result))
