"""
Chart Data Formatter for Matplotlib → Recharts Conversion

Converts Python/Matplotlib-style data into JSON-serializable formats
suitable for Recharts visualization in React.
"""

import json
import numpy as np
from typing import Dict, List, Tuple, Any, Optional


class ChartDataFormatter:
    """Base formatter for converting data to Recharts-compatible JSON"""

    @staticmethod
    def format_scatter_data(
        x_values: np.ndarray,
        y_values: np.ndarray,
        max_points: int = 500,
        decimals: int = 4
    ) -> List[Dict[str, float]]:
        """
        Format scatter plot data
        
        Args:
            x_values: X-axis values
            y_values: Y-axis values
            max_points: Maximum points to include (subsamples if needed)
            decimals: Number of decimal places
            
        Returns:
            List of {x, y} dictionaries suitable for Recharts ScatterChart
        """
        x_arr = np.asarray(x_values).flatten()
        y_arr = np.asarray(y_values).flatten()
        
        points = min(len(x_arr), len(y_arr))
        stride = max(1, int(np.ceil(points / max_points)))
        
        data = [
            {
                "x": round(float(x_arr[i]), decimals),
                "y": round(float(y_arr[i]), decimals)
            }
            for i in range(0, points, stride)
        ]
        
        return data

    @staticmethod
    def format_histogram_data(
        values: np.ndarray,
        bin_count: int = 15,
        decimals: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Format histogram data
        
        Args:
            values: Data values
            bin_count: Number of histogram bins
            decimals: Number of decimal places
            
        Returns:
            List of {bin, count} dictionaries
        """
        values = np.asarray(values).flatten()
        
        if len(values) == 0:
            return []
        
        min_val, max_val = np.min(values), np.max(values)
        range_val = max_val - min_val
        
        if range_val == 0:
            return [{
                "bin": str(round(min_val, decimals)),
                "count": len(values)
            }]
        
        bins = []
        bin_width = range_val / bin_count
        
        for i in range(bin_count):
            bin_start = min_val + i * bin_width
            bin_end = max_val + 0.0001 if i == bin_count - 1 else bin_start + bin_width
            
            count = int(np.sum((values >= bin_start) & (values < bin_end)))
            
            bins.append({
                "bin": f"{round(bin_start, decimals)}-{round(bin_end, decimals)}",
                "count": count
            })
        
        return bins

    @staticmethod
    def format_confusion_matrix(
        matrix: np.ndarray,
        class_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Format confusion matrix data
        
        Args:
            matrix: 2D confusion matrix array
            class_names: Optional list of class names
            
        Returns:
            Dictionary with 'matrix' and 'labels' keys
        """
        matrix = np.asarray(matrix)
        
        if matrix.ndim == 1:
            size = int(np.sqrt(len(matrix)))
            matrix = matrix.reshape(size, size)
        
        n_classes = matrix.shape[0]
        
        if class_names is None:
            # Generate default class names
            import string
            class_names = [string.ascii_uppercase[i] if i < 26 else f"Class {i}" 
                          for i in range(n_classes)]
        
        return {
            "matrix": matrix.astype(int).tolist(),
            "labels": class_names
        }

    @staticmethod
    def format_line_chart_data(
        x_values: List[Any],
        series_data: Dict[str, np.ndarray],
        decimals: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Format multi-series line chart data
        
        Args:
            x_values: X-axis values (epochs, iterations, etc.)
            series_data: Dictionary of series_name -> values
            decimals: Number of decimal places
            
        Returns:
            List of data points with all series values
        """
        data = []
        
        for idx, x in enumerate(x_values):
            point = {"x": x}
            
            for series_name, values in series_data.items():
                if idx < len(values):
                    val = float(values[idx])
                    point[series_name] = round(val, decimals)
            
            data.append(point)
        
        return data

    @staticmethod
    def format_bar_chart_data(
        categories: List[str],
        values: Dict[str, np.ndarray] | np.ndarray,
        decimals: int = 2
    ) -> List[Dict[str, Any]]:
        """
        Format bar chart data
        
        Args:
            categories: Category labels for X-axis
            values: Either single array or dict of series -> arrays
            decimals: Number of decimal places
            
        Returns:
            List of data points with all series values
        """
        data = []
        
        if isinstance(values, dict):
            for idx, cat in enumerate(categories):
                point = {"name": cat}
                for series_name, series_vals in values.items():
                    if idx < len(series_vals):
                        point[series_name] = round(float(series_vals[idx]), decimals)
                data.append(point)
        else:
            # Single series
            values = np.asarray(values).flatten()
            for idx, cat in enumerate(categories):
                data.append({
                    "name": cat,
                    "value": round(float(values[idx]), decimals)
                })
        
        return data

    @staticmethod
    def format_roc_curve_data(
        fpr: np.ndarray,
        tpr: np.ndarray,
        decimals: int = 4
    ) -> List[Dict[str, float]]:
        """Format ROC curve data for binary classification"""
        fpr = np.asarray(fpr).flatten()
        tpr = np.asarray(tpr).flatten()
        
        return [
            {
                "fpr": round(float(fpr[i]), decimals),
                "tpr": round(float(tpr[i]), decimals)
            }
            for i in range(min(len(fpr), len(tpr)))
        ]

    @staticmethod
    def format_feature_importance_data(
        feature_names: List[str],
        importances: np.ndarray,
        decimals: int = 4
    ) -> List[Dict[str, Any]]:
        """Format feature importance data"""
        importances = np.asarray(importances).flatten()
        
        # Create pairs and sort by importance
        pairs = list(zip(feature_names, importances))
        pairs.sort(key=lambda x: x[1], reverse=True)
        
        return [
            {
                "feature": name,
                "importance": round(float(imp), decimals),
                "rank": idx + 1
            }
            for idx, (name, imp) in enumerate(pairs)
        ]

    @staticmethod
    def format_correlation_heatmap(
        correlation_matrix: np.ndarray,
        feature_names: Optional[List[str]] = None,
        decimals: int = 3
    ) -> Dict[str, Any]:
        """Format correlation matrix for heatmap visualization"""
        matrix = np.asarray(correlation_matrix)
        n_features = matrix.shape[0]
        
        if feature_names is None:
            feature_names = [f"Feature {i}" for i in range(n_features)]
        
        # Round values
        matrix = np.round(matrix, decimals)
        
        return {
            "matrix": matrix.tolist(),
            "labels": feature_names
        }

    @staticmethod
    def format_learning_curve_data(
        epochs: np.ndarray,
        train_loss: np.ndarray,
        val_loss: Optional[np.ndarray] = None,
        decimals: int = 6
    ) -> List[Dict[str, Any]]:
        """Format learning curve data for training dynamics visualization"""
        data = []
        
        for idx, epoch in enumerate(epochs):
            point = {
                "epoch": int(epoch),
                "trainLoss": round(float(train_loss[idx]), decimals)
            }
            
            if val_loss is not None and idx < len(val_loss):
                point["valLoss"] = round(float(val_loss[idx]), decimals)
            
            data.append(point)
        
        return data

    @staticmethod
    def format_residuals_data(
        predicted: np.ndarray,
        actual: np.ndarray,
        max_points: int = 500,
        decimals: int = 4
    ) -> List[Dict[str, float]]:
        """Format residual data for regression analysis"""
        predicted = np.asarray(predicted).flatten()
        actual = np.asarray(actual).flatten()
        
        points = min(len(predicted), len(actual))
        stride = max(1, int(np.ceil(points / max_points)))
        
        data = []
        for i in range(0, points, stride):
            data.append({
                "fitted": round(float(predicted[i]), decimals),
                "residual": round(float(actual[i] - predicted[i]), decimals)
            })
        
        return data

    @staticmethod
    def format_elbow_method_data(
        k_values: List[int],
        inertias: np.ndarray,
        decimals: int = 2
    ) -> List[Dict[str, Any]]:
        """Format elbow method data for optimal cluster selection"""
        inertias = np.asarray(inertias).flatten()
        
        return [
            {
                "k": int(k),
                "inertia": round(float(inertias[i]), decimals)
            }
            for i, k in enumerate(k_values)
        ]

    @staticmethod
    def format_cluster_distribution_data(
        cluster_labels: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Format cluster size distribution"""
        labels = np.asarray(cluster_labels).flatten().astype(int)
        
        unique, counts = np.unique(labels, return_counts=True)
        
        return [
            {
                "cluster": f"Cluster {int(cluster)}",
                "count": int(count)
            }
            for cluster, count in sorted(zip(unique, counts))
        ]


class RechartsFormatter:
    """Convert Matplotlib concepts to Recharts JSON structures"""

    @staticmethod
    def to_json_safe(data: Any) -> str:
        """Convert data to JSON-safe string"""
        return json.dumps(data, cls=NumpyEncoder)

    @staticmethod
    def export_all_visualizations(
        results: Dict[str, Any],
        problem_type: str,
        model_name: str
    ) -> Dict[str, Any]:
        """Export all visualizations for a trained model"""
        formatter = ChartDataFormatter()
        
        export_data = {
            "modelName": model_name,
            "problemType": problem_type,
            "timestamp": str(np.datetime64('now')),
            "visualizations": {}
        }
        
        if problem_type == "Classification":
            export_data["visualizations"] = {
                "confusionMatrix": formatter.format_confusion_matrix(
                    results.get("confusionMatrix", [])
                ),
                "classDistribution": formatter.format_bar_chart_data(
                    [f"Class {i}" for i in range(len(results.get("classDistribution", [])))],
                    results.get("classDistribution", [])
                ),
                "rocCurve": formatter.format_roc_curve_data(
                    results.get("fpr", []), results.get("tpr", [])
                ) if "fpr" in results else None,
                "featureImportance": formatter.format_feature_importance_data(
                    results.get("featureNames", []),
                    results.get("featureImportance", [])
                ) if "featureImportance" in results else None,
            }
        
        elif problem_type == "Regression":
            export_data["visualizations"] = {
                "actualVsPredicted": formatter.format_scatter_data(
                    results.get("predictions", []),
                    results.get("yTest", [])
                ),
                "residuals": formatter.format_residuals_data(
                    results.get("predictions", []),
                    results.get("yTest", [])
                ),
                "residualDistribution": formatter.format_histogram_data(
                    np.array(results.get("yTest", [])) - np.array(results.get("predictions", []))
                ),
                "featureImportance": formatter.format_feature_importance_data(
                    results.get("featureNames", []),
                    results.get("featureImportance", [])
                ) if "featureImportance" in results else None,
            }
        
        elif problem_type == "Clustering":
            export_data["visualizations"] = {
                "clusterDistribution": formatter.format_cluster_distribution_data(
                    results.get("predictions", [])
                ),
                "elbowCurve": formatter.format_elbow_method_data(
                    list(range(1, 11)),
                    results.get("inertias", [])
                ) if "inertias" in results else None,
            }
        
        return export_data


class NumpyEncoder(json.JSONEncoder):
    """JSON encoder that handles NumPy types"""
    
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        return super().default(obj)
