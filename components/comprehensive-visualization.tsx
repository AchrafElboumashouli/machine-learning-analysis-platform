"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, BarChart3, TrendingUp, Layers } from "lucide-react"
import RegressionCharts from "./charts/regression-charts"
import ClassificationCharts from "./charts/classification-charts"
import ClusteringCharts from "./charts/clustering-charts"

interface ComprehensiveVisualizationProps {
  modelResults: any
  problemType?: string
  modelName?: string
  dataset?: any
  targetVariable?: string
}

export default function ComprehensiveVisualization({
  modelResults,
  problemType = "Regression",
  modelName = "Unknown Model",
  dataset,
  targetVariable,
}: ComprehensiveVisualizationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [visualizationData, setVisualizationData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasChartData, setHasChartData] = useState(false)

  useEffect(() => {
    if (modelResults) {
      const safeData = {
        // Regression metrics
        r2Score: modelResults.r2Score ?? modelResults.r2 ?? null,
        rmse: modelResults.rmse ?? null,
        mae: modelResults.mae ?? null,
        mse: modelResults.mse ?? null,

        // Classification metrics
        accuracy: modelResults.accuracy ?? null,
        precision: modelResults.precision ?? null,
        recall: modelResults.recall ?? null,
        f1Score: modelResults.f1Score ?? modelResults.f1_score ?? null,

        // Clustering metrics
        silhouetteScore: modelResults.silhouetteScore ?? modelResults.silhouette_score ?? null,
        daviesBouldinIndex: modelResults.daviesBouldinIndex ?? modelResults.davies_bouldin_score ?? null,
        calinskiHarabaszScore: modelResults.calinskiHarabaszScore ?? modelResults.calinski_harabasz_score ?? null,
        numClusters: modelResults.numClusters ?? modelResults.num_clusters ?? null,

        // Chart data - these come from visualization.py
        actualPredicted: modelResults.actualPredicted ?? modelResults.actual_predicted ?? [],
        residuals: modelResults.residuals ?? [],
        errorDistribution: modelResults.errorDistribution ?? modelResults.error_distribution ?? [],
        yTrue: modelResults.yTrue ?? [],
        yPred: modelResults.yPred ?? [],
        confusionMatrix: modelResults.confusionMatrix ?? modelResults.confusion_matrix ?? [],
        rocCurve: modelResults.rocCurve ?? modelResults.roc_curve ?? [],
        precisionRecallCurve: modelResults.precisionRecallCurve ?? modelResults.precision_recall_curve ?? [],
        classDistribution: modelResults.classDistribution ?? modelResults.class_distribution ?? [],
        rocAuc: modelResults.rocAuc ?? modelResults.roc_auc ?? null,
        clusterPlot: modelResults.clusterPlot ?? modelResults.cluster_plot ?? [],
        silhouetteValues: modelResults.silhouetteValues ?? modelResults.silhouette_values ?? [],
        clusterDistribution: modelResults.clusterDistribution ?? modelResults.cluster_distribution ?? [],

        // Metadata
        ...modelResults,
      }

      const regressionDataReady =
        (Array.isArray(safeData.actualPredicted) && safeData.actualPredicted.length > 0) ||
        (Array.isArray(safeData.residuals) && safeData.residuals.length > 0) ||
        (Array.isArray(safeData.errorDistribution) && safeData.errorDistribution.length > 0) ||
        (Array.isArray(safeData.yTrue) && safeData.yTrue.length > 0)

      const classificationDataReady =
        (Array.isArray(safeData.confusionMatrix) && safeData.confusionMatrix.length > 0) ||
        (Array.isArray(safeData.rocCurve) && safeData.rocCurve.length > 0) ||
        (Array.isArray(safeData.precisionRecallCurve) && safeData.precisionRecallCurve.length > 0) ||
        (Array.isArray(safeData.yTrue) && safeData.yTrue.length > 0)

      const clusteringDataReady =
        (Array.isArray(safeData.clusterPlot) && safeData.clusterPlot.length > 0) ||
        (Array.isArray(safeData.silhouetteValues) && safeData.silhouetteValues.length > 0) ||
        (Array.isArray(safeData.clusterDistribution) && safeData.clusterDistribution.length > 0)

      let dataAvailable = false
      if (problemType === "Regression") {
        dataAvailable = regressionDataReady
      } else if (problemType === "Classification") {
        dataAvailable = classificationDataReady
      } else if (problemType === "Clustering") {
        dataAvailable = clusteringDataReady
      }

      console.log("¬ Visualization Data Ready:", {
        problemType,
        dataAvailable,
        regression: {
          ready: regressionDataReady,
          actualPredicted: safeData.actualPredicted?.length ?? 0,
          residuals: safeData.residuals?.length ?? 0,
          errorDistribution: safeData.errorDistribution?.length ?? 0,
          yTrue: safeData.yTrue?.length ?? 0,
        },
        classification: {
          ready: classificationDataReady,
          confusionMatrix: safeData.confusionMatrix?.length ?? 0,
          rocCurve: safeData.rocCurve?.length ?? 0,
          precisionRecallCurve: safeData.precisionRecallCurve?.length ?? 0,
        },
        clustering: {
          ready: clusteringDataReady,
          clusterPlot: safeData.clusterPlot?.length ?? 0,
          silhouetteValues: safeData.silhouetteValues?.length ?? 0,
          clusterDistribution: Object.keys(safeData.clusterDistribution || {}).length,
        },
      })

      setVisualizationData(safeData)
      setHasChartData(dataAvailable)
      setError(null)
    }
  }, [modelResults, problemType])

  // Helper function for safe metric display
  const getMetricValue = (value: any, fallback = "N/A"): string => {
    if (value === null || value === undefined) return fallback
    if (typeof value === "number") return value.toString()
    return fallback
  }

  // Helper for percentage display
  const formatPercentage = (value: any, decimals = 1): string => {
    if (value === null || value === undefined) return "N/A"
    const num = typeof value === "number" ? value : Number.parseFloat(value)
    if (isNaN(num)) return "N/A"
    return `${(num * 100).toFixed(decimals)}%`
  }

  if (!modelResults) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Model Visualization</h1>
          <p className="text-muted-foreground">Interactive charts and visualizations for model analysis</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Model Results Available</p>
            <p className="text-muted-foreground text-center">Train a model first to view interactive visualizations</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasChartData) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Model Visualization Dashboard</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <p>{modelName}</p>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{problemType}</span>
            </div>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-amber-950 dark:text-amber-100">
                    ⚠️ No Data Available for Visualization
                  </p>
                  <p className="text-sm text-amber-950 dark:text-amber-200 mt-1">
                    The model has been trained successfully, but the visualization data required to render plots is
                    missing, empty, or incorrectly formatted.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded p-4 space-y-3">
                  <p className="text-xs font-semibold text-foreground">🔍 What This Means</p>
                  <p className="text-xs text-muted-foreground">
                    The visualization system expects structured JSON outputs generated during the model evaluation
                    phase. Although the model execution is complete, the data required for plotting (arrays,
                    coordinates, or curve points) is either empty, undefined, or incompatible with the expected schema.
                    As a result, charts cannot be rendered.
                  </p>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      📦 Required JSON Inputs (Must Be Non-Empty)
                    </p>
                    {problemType === "Regression" && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>At least one of the following must contain data:</p>
                        <ul className="list-disc list-inside ml-1 space-y-0.5">
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">actualPredicted</code>
                            → array of object with actual/predicted
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">residuals</code> →
                            numeric array
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">
                              errorDistribution
                            </code>
                            → numeric array
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">yTrue</code> → numeric
                            array
                          </li>
                        </ul>
                      </div>
                    )}
                    {problemType === "Classification" && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>At least one of the following must contain data:</p>
                        <ul className="list-disc list-inside ml-1 space-y-0.5">
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">confusionMatrix</code>
                            → 2D array
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">rocCurve</code> →
                            array of object with fpr/tpr
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">
                              precisionRecallCurve
                            </code>
                            → array of object with precision/recall
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">yTrue</code> → numeric
                            array
                          </li>
                        </ul>
                      </div>
                    )}
                    {problemType === "Clustering" && (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>At least one of the following must contain data:</p>
                        <ul className="list-disc list-inside ml-1 space-y-0.5">
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">clusterPlot</code> →
                            array of object with x/y/label
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">
                              clusterDistribution
                            </code>
                            → object with clusterId keys
                          </li>
                          <li>
                            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">
                              silhouetteValues
                            </code>
                            → numeric array
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Check the backend response to ensure it returns the required visualization fields with non-empty
                  arrays or valid data structures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Show available metrics even if charts can't render */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Available Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {problemType === "Regression" && (
                <>
                  {visualizationData?.r2Score != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">R² Score</p>
                      <p className="text-xl font-bold text-primary">{visualizationData.r2Score.toFixed(4)}</p>
                    </div>
                  )}
                  {visualizationData?.rmse != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">RMSE</p>
                      <p className="text-xl font-bold text-accent">{visualizationData.rmse.toFixed(4)}</p>
                    </div>
                  )}
                  {visualizationData?.mae != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">MAE</p>
                      <p className="text-xl font-bold text-chart-3">{visualizationData.mae.toFixed(4)}</p>
                    </div>
                  )}
                </>
              )}

              {problemType === "Classification" && (
                <>
                  {visualizationData?.accuracy != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="text-xl font-bold text-primary">{formatPercentage(visualizationData.accuracy)}</p>
                    </div>
                  )}
                  {visualizationData?.precision != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">Precision</p>
                      <p className="text-xl font-bold text-accent">{formatPercentage(visualizationData.precision)}</p>
                    </div>
                  )}
                  {visualizationData?.recall != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">Recall</p>
                      <p className="text-xl font-bold text-chart-3">{formatPercentage(visualizationData.recall)}</p>
                    </div>
                  )}
                </>
              )}

              {problemType === "Clustering" && (
                <>
                  {visualizationData?.silhouetteScore != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">Silhouette Score</p>
                      <p className="text-xl font-bold text-primary">{visualizationData.silhouetteScore.toFixed(3)}</p>
                    </div>
                  )}
                  {visualizationData?.daviesBouldinIndex != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">Davies-Bouldin Index</p>
                      <p className="text-xl font-bold text-accent">{visualizationData.daviesBouldinIndex.toFixed(3)}</p>
                    </div>
                  )}
                  {visualizationData?.numClusters != null && (
                    <div className="p-3 bg-card/50 rounded">
                      <p className="text-xs text-muted-foreground">Num Clusters</p>
                      <p className="text-xl font-bold text-chart-3">{visualizationData.numClusters}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Model Visualization Dashboard</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <p>{modelName}</p>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{problemType}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Visualization Area */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Interactive Visualizations
              </CardTitle>
              <CardDescription>Explore model performance through dynamic, interactive charts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 animate-pulse text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Loading visualizations...</p>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 gap-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {problemType === "Regression" && (
                  <>
                    <TabsTrigger value="actual-predicted">Actual vs Predicted</TabsTrigger>
                    <TabsTrigger value="residuals">Residuals</TabsTrigger>
                    <TabsTrigger value="error-dist">Error Distribution</TabsTrigger>
                  </>
                )}
                {problemType === "Classification" && (
                  <>
                    <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
                    <TabsTrigger value="roc">ROC Curve</TabsTrigger>
                    <TabsTrigger value="precision-recall">Precision-Recall</TabsTrigger>
                  </>
                )}
                {problemType === "Clustering" && (
                  <>
                    <TabsTrigger value="clusters">Cluster Plot</TabsTrigger>
                    <TabsTrigger value="silhouette">Silhouette</TabsTrigger>
                    <TabsTrigger value="distribution">Distribution</TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {problemType === "Regression" && (
                    <>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">R² Score</p>
                          <p className="text-2xl font-bold text-primary">
                            {visualizationData?.r2Score != null ? visualizationData.r2Score.toFixed(4) : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Coefficient of Determination</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">RMSE</p>
                          <p className="text-2xl font-bold text-accent">
                            {visualizationData?.rmse != null ? visualizationData.rmse.toFixed(4) : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Root Mean Squared Error</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">MAE</p>
                          <p className="text-2xl font-bold text-chart-3">
                            {visualizationData?.mae != null ? visualizationData.mae.toFixed(4) : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Mean Absolute Error</p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {problemType === "Classification" && (
                    <>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Accuracy</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatPercentage(visualizationData?.accuracy)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Overall Correctness</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Precision</p>
                          <p className="text-2xl font-bold text-accent">
                            {formatPercentage(visualizationData?.precision)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Positive Predictive Value</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Recall</p>
                          <p className="text-2xl font-bold text-chart-3">
                            {formatPercentage(visualizationData?.recall)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">True Positive Rate</p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {problemType === "Clustering" && (
                    <>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Silhouette Score</p>
                          <p className="text-2xl font-bold text-primary">
                            {visualizationData?.silhouetteScore != null
                              ? visualizationData.silhouetteScore.toFixed(3)
                              : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Cluster Cohesion</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Davies-Bouldin Index</p>
                          <p className="text-2xl font-bold text-accent">
                            {visualizationData?.daviesBouldinIndex != null
                              ? visualizationData.daviesBouldinIndex.toFixed(3)
                              : "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Lower is Better</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-card/50">
                        <CardContent className="pt-6">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Num Clusters</p>
                          <p className="text-2xl font-bold text-chart-3">{visualizationData?.numClusters ?? "N/A"}</p>
                          <p className="text-xs text-muted-foreground mt-2">Total Clusters</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Render Problem-Type Specific Charts */}
              {problemType === "Regression" && visualizationData && (
                <RegressionCharts visualizationData={visualizationData} activeTab={activeTab} />
              )}

              {problemType === "Classification" && visualizationData && (
                <ClassificationCharts visualizationData={visualizationData} activeTab={activeTab} />
              )}

              {problemType === "Clustering" && visualizationData && (
                <ClusteringCharts visualizationData={visualizationData} activeTab={activeTab} />
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Data Source Info */}
      <Card className="bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Data Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Problem Type</p>
              <p className="font-semibold text-foreground">{problemType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Target Variable</p>
              <p className="font-semibold text-foreground">{targetVariable || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model Name</p>
              <p className="font-semibold text-foreground text-xs">{modelName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Training Data</p>
              <p className="font-semibold text-foreground">{dataset?.samples || "N/A"} samples</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
