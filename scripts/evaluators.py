"""
Evaluation modules for different problem types
"""
import numpy as np
import sys
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score, silhouette_samples, calinski_harabasz_score, davies_bouldin_score,
    confusion_matrix, roc_curve, auc, precision_recall_curve
)
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

class RegressionEvaluator:
    """Evaluator for regression problems"""
    
    @staticmethod
    def evaluate(y_test, predictions):
        """
        Evaluate regression model performance
        
        Args:
            y_test: True target values
            predictions: Predicted values
            
        Returns:
            dict: Dictionary containing evaluation metrics
        """
        mse = mean_squared_error(y_test, predictions)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, predictions)
        r2 = r2_score(y_test, predictions)
        
        return {
            'r2': round(float(r2), 4),
            'rmse': round(float(rmse), 4),
            'mae': round(float(mae), 4),
            'mse': round(float(mse), 4)
        }


class ClassificationEvaluator:
    """Evaluator for classification problems"""
    
    @staticmethod
    def evaluate(y_test, predictions, y_proba=None):
        """
        Evaluate classification model performance
        
        Args:
            y_test: True target values
            predictions: Predicted values
            y_proba: Probability predictions (for ROC/PR curves)
            
        Returns:
            dict: Dictionary containing evaluation metrics
        """
        sys.stderr.write("\n[DEBUG STEP 4] Inside ClassificationEvaluator.evaluate\n")
        sys.stderr.write(f"Received y_test length: {len(y_test)}\n")
        sys.stderr.write(f"Received predictions length: {len(predictions)}\n")
        sys.stderr.write(f"Received y_proba: {'YES' if y_proba is not None else 'NO'}\n")
        
        if y_proba is not None:
            sys.stderr.write(f"y_proba shape: {y_proba.shape if hasattr(y_proba, 'shape') else len(y_proba)}\n")
            sys.stderr.write(f"y_proba sample (first 5): {y_proba[:5] if hasattr(y_proba, '__getitem__') else 'N/A'}\n")

        accuracy = accuracy_score(y_test, predictions)
        precision = precision_score(y_test, predictions, average='weighted', zero_division=0)
        recall = recall_score(y_test, predictions, average='weighted', zero_division=0)
        f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)
        cm = confusion_matrix(y_test, predictions)
        
        result = {
            'accuracy': round(float(accuracy), 4),
            'precision': round(float(precision), 4),
            'recall': round(float(recall), 4),
            'f1Score': round(float(f1), 4),
            'confusionMatrix': cm.tolist(),
            'rocCurve': [],
            'precisionRecallCurve': [],
            'rocAuc': 0,
        }
        
        # ROC & PR curves (only for binary or multi-class)
        try:
            n_classes = len(np.unique(y_test))
            sys.stderr.write("\n[DEBUG STEP 5] ROC & PR computation\n")
            sys.stderr.write(f"Number of classes: {n_classes}\n")
            
            sys.stderr.write(f"\n[DEBUG][ROC INPUT] y_true unique classes: {set(np.unique(y_test).tolist())}\n")
            sys.stderr.write(f"[DEBUG][ROC INPUT] y_true class counts:\n")
            unique, counts = np.unique(y_test, return_counts=True)
            for u, c in zip(unique, counts):
                sys.stderr.write(f"  Class {u}: {c} samples\n")
            
            if y_proba is not None:
                sys.stderr.write(f"[DEBUG][ROC INPUT] y_proba shape: {y_proba.shape}\n")
                sys.stderr.write(f"[DEBUG][ROC INPUT] y_proba min: {np.min(y_proba):.6f}\n")
                sys.stderr.write(f"[DEBUG][ROC INPUT] y_proba max: {np.max(y_proba):.6f}\n")
                sys.stderr.write(f"[DEBUG][ROC INPUT] y_proba sample (first 5 rows):\n")
                sys.stderr.write(f"{y_proba[:5]}\n")
            
            if n_classes == 2 and y_proba is not None:
                # Binary classification
                sys.stderr.write(f"\n[DEBUG] Computing BINARY classification ROC/PR\n")
                fpr, tpr, _ = roc_curve(y_test, y_proba[:, 1])
                roc_auc = auc(fpr, tpr)
                precision_vals, recall_vals, _ = precision_recall_curve(y_test, y_proba[:, 1])
                
                sys.stderr.write(f"[DEBUG] ROC FPR length: {len(fpr)}\n")
                sys.stderr.write(f"[DEBUG] ROC TPR length: {len(tpr)}\n")
                sys.stderr.write(f"[DEBUG] ROC AUC: {roc_auc:.4f}\n")
                sys.stderr.write(f"[DEBUG] Precision-Recall precision length: {len(precision_vals)}\n")
                sys.stderr.write(f"[DEBUG] Precision-Recall recall length: {len(recall_vals)}\n")
                
                result['rocCurve'] = [
                    {'fpr': float(f), 'tpr': float(t)} for f, t in zip(fpr, tpr)
                ]
                result['rocAuc'] = round(float(roc_auc), 4)
                result['precisionRecallCurve'] = [
                    {'precision': float(p), 'recall': float(r)} for p, r in zip(precision_vals, recall_vals)
                ]
                
                sys.stderr.write(f"[DEBUG] Final rocCurve length: {len(result['rocCurve'])}\n")
                sys.stderr.write(f"[DEBUG] Final precisionRecallCurve length: {len(result['precisionRecallCurve'])}\n")
            
            elif n_classes > 2 and y_proba is not None:
                # Multi-class: compute OvR ROC curves
                sys.stderr.write(f"\n[DEBUG] Computing MULTI-CLASS ROC (One-vs-Rest)\n")
                roc_curves_list = []
                for i in range(n_classes):
                    binary_labels = (y_test == np.unique(y_test)[i]).astype(int)
                    if y_proba.shape[1] > i:
                        fpr, tpr, _ = roc_curve(binary_labels, y_proba[:, i])
                        roc_curves_list.append({
                            'class': int(i),
                            'curve': [{'fpr': float(f), 'tpr': float(t)} for f, t in zip(fpr, tpr)]
                        })
                
                sys.stderr.write(f"[DEBUG] Multi-class ROC curves computed: {len(roc_curves_list)}\n")
                result['rocCurve'] = roc_curves_list
            
            else:
                if y_proba is None:
                    sys.stderr.write(f"[DEBUG] SKIPPED: y_proba is None\n")
                elif n_classes == 1:
                    sys.stderr.write(f"[DEBUG] SKIPPED: Only 1 class in y_test (single-class problem)\n")
                else:
                    sys.stderr.write(f"[DEBUG] SKIPPED: n_classes={n_classes}, y_proba={'None' if y_proba is None else 'present'}\n")
            
        except Exception as e:
            sys.stderr.write(f"\n[DEBUG] EXCEPTION in ROC/PR computation: {str(e)}\n")
            import traceback
            sys.stderr.write(traceback.format_exc())
        
        return result


class ClusteringEvaluator:
    """Evaluator for clustering problems"""
    
    @staticmethod
    def evaluate(X, labels):
        """
        Evaluate clustering model performance
        
        Args:
            X: Feature matrix
            labels: Cluster labels
            
        Returns:
            dict: Dictionary containing evaluation metrics and visualization data
        """
        n_clusters = len(np.unique(labels))
        n_samples = len(labels)
        
        metrics = {}
        
        if n_clusters > 1 and n_samples > n_clusters:
            try:
                silhouette = silhouette_score(X, labels)
                metrics['silhouette_score'] = round(float(silhouette), 4)
            except:
                metrics['silhouette_score'] = None
                
            try:
                calinski = calinski_harabasz_score(X, labels)
                metrics['calinski_harabasz_score'] = round(float(calinski), 4)
            except:
                metrics['calinski_harabasz_score'] = None
                
            try:
                davies = davies_bouldin_score(X, labels)
                metrics['davies_bouldin_score'] = round(float(davies), 4)
            except:
                metrics['davies_bouldin_score'] = None
            
            try:
                silhouette_vals = silhouette_samples(X, labels)
                metrics['silhouette_values'] = [round(float(v), 4) for v in silhouette_vals]
            except:
                metrics['silhouette_values'] = []
        
        unique, counts = np.unique(labels, return_counts=True)
        metrics['cluster_distribution'] = {int(k): int(v) for k, v in zip(unique, counts)}
        
        metrics['cluster_labels'] = [int(label) for label in labels]
        
        try:
            if X.shape[1] > 2:
                pca = PCA(n_components=2)
                X_reduced = pca.fit_transform(X)
            else:
                X_reduced = X[:, :2] if X.shape[1] >= 2 else np.column_stack([X[:, 0], np.zeros(X.shape[0])])
            
            cluster_plot = [
                {
                    "x": round(float(X_reduced[i, 0]), 4),
                    "y": round(float(X_reduced[i, 1]), 4),
                    "label": int(labels[i])
                }
                for i in range(len(labels))
            ]
            metrics['cluster_plot'] = cluster_plot
        except Exception as e:
            metrics['cluster_plot'] = []
        
        metrics['num_clusters'] = int(n_clusters)
        
        return metrics
