"""
Export trained models and results
"""
import json
import sys
import os
import pickle
import pandas as pd
from datetime import datetime


def export_model_results(model_data, model_name, format_type='pkl'):
    """
    Export model results including metrics, predictions, and model info
    
    Args:
        model_data: Dictionary containing model results
        model_name: Name for the exported model
        format_type: Export format ('pkl', 'json', 'csv')
        
    Returns:
        dict: Export result with file paths
    """
    # Create exports directory
    export_dir = 'exports'
    os.makedirs(export_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    base_name = f"{model_name}_{timestamp}"
    
    exported_files = []
    
    try:
        # Export metrics as JSON
        metrics_file = os.path.join(export_dir, f"{base_name}_metrics.json")
        metrics = {
            'algorithm': model_data.get('algorithm'),
            'problemType': model_data.get('problemType'),
            'targetVariable': model_data.get('targetVariable'),
            'trainSamples': model_data.get('trainSamples'),
            'testSamples': model_data.get('testSamples'),
            'trainingTime': model_data.get('trainingTime'),
            'splitRatio': model_data.get('splitRatio')
        }
        
        # Add problem-specific metrics
        if model_data.get('problemType') == 'Classification':
            metrics.update({
                'accuracy': model_data.get('accuracy'),
                'precision': model_data.get('precision'),
                'recall': model_data.get('recall'),
                'f1Score': model_data.get('f1Score')
            })
        elif model_data.get('problemType') == 'Regression':
            metrics.update({
                'rmse': model_data.get('rmse'),
                'r2Score': model_data.get('r2Score')
            })
        
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)
        exported_files.append(metrics_file)
        
        # Export predictions as CSV
        if 'predictions' in model_data and 'yTest' in model_data:
            predictions_file = os.path.join(export_dir, f"{base_name}_predictions.csv")
            pred_df = pd.DataFrame({
                'Actual': model_data['yTest'],
                'Predicted': model_data['predictions']
            })
            pred_df.to_csv(predictions_file, index=False)
            exported_files.append(predictions_file)
        
        # Export learning curve if available
        if 'learningCurve' in model_data:
            curve_file = os.path.join(export_dir, f"{base_name}_learning_curve.csv")
            curve_df = pd.DataFrame(model_data['learningCurve'])
            curve_df.to_csv(curve_file, index=False)
            exported_files.append(curve_file)
        
        # Export model metadata as pickle
        if format_type == 'pkl':
            model_file = os.path.join(export_dir, f"{base_name}_model.pkl")
            with open(model_file, 'wb') as f:
                pickle.dump(model_data, f)
            exported_files.append(model_file)
        
        return {
            'success': True,
            'message': f'Successfully exported {len(exported_files)} files',
            'files': exported_files,
            'exportDir': export_dir
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


if __name__ == '__main__':
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    model_data = input_data.get('model', {})
    model_name = input_data.get('modelName', 'model')
    format_type = input_data.get('format', 'pkl')
    
    result = export_model_results(model_data, model_name, format_type)
    print(json.dumps(result))
