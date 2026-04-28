import sys
import json
import pandas as pd
import numpy as np
from io import StringIO

from evaluators import RegressionEvaluator, ClassificationEvaluator, ClusteringEvaluator

def main():
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    problem_type = input_data.get('problemType', 'Classification')
    y_test_data = input_data.get('yTest', [])
    predictions_data = input_data.get('predictions', [])
    X_test_data = input_data.get('XTest', None)
    
    # Convert to numpy arrays
    y_test = np.array(y_test_data)
    predictions = np.array(predictions_data)
    
    # Evaluate based on problem type
    if problem_type == 'Regression':
        metrics = RegressionEvaluator.evaluate(y_test, predictions)
    elif problem_type == 'Classification':
        metrics = ClassificationEvaluator.evaluate(y_test, predictions)
    elif problem_type == 'Clustering':
        if X_test_data:
            X_test = pd.read_csv(StringIO(X_test_data))
            metrics = ClusteringEvaluator.evaluate(X_test.values, predictions)
        else:
            metrics = {"error": "X_test data required for clustering evaluation"}
    else:
        metrics = {"error": f"Unknown problem type: {problem_type}"}
    
    # Output results as JSON
    print(json.dumps(metrics))

if __name__ == "__main__":
    main()
