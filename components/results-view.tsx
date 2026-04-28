"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, BarChart3, TrendingUp, FileDown } from "lucide-react"
import { useState, useEffect } from "react"

interface ResultsViewProps {
  modelResults: any
  problemType?: string
}

export default function ResultsView({ modelResults, problemType = "Classification" }: ResultsViewProps) {
  const [evaluationMetrics, setEvaluationMetrics] = useState<any>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  useEffect(() => {
    if (modelResults && !evaluationMetrics) {
      prepareMetrics()
    }
  }, [modelResults, evaluationMetrics])

  const prepareMetrics = () => {
    if (!modelResults) return

    setIsEvaluating(true)
    try {
      const metrics = {
        // Classification metrics
        accuracy: modelResults.accuracy,
        precision: modelResults.precision,
        recall: modelResults.recall,
        f1_score: modelResults.f1Score,
        // Regression metrics
        rmse: modelResults.rmse,
        mae: modelResults.mae,
        r2: modelResults.r2 || modelResults.r2Score, 
        mse: modelResults.mse,
        // Clustering metrics
        silhouette_score: modelResults.silhouetteScore,
        davies_bouldin_score: modelResults.daviesBouldinIndex,
        calinski_harabasz_score: modelResults.calinskiHarabaszScore,
        cluster_distribution: modelResults.clusterDistribution,
        // Additional data
        isClustering: modelResults.isClustering,
      }

      setEvaluationMetrics(metrics)
    } catch (error) {
      console.error("Metrics preparation failed:", error)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const content = `
        Model Performance Report
        ========================
        Problem Type: ${problemType}
        Metrics: ${JSON.stringify(evaluationMetrics, null, 2)}
        Results: ${JSON.stringify(modelResults, null, 2)}
      `

      const blob = new Blob([content], { type: "text/plain" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "model-report.txt"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export report")
    }
  }

  const handleDownloadModel = () => {
    try {
      const modelData = JSON.stringify(modelResults, null, 2)
      const blob = new Blob([modelData], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "model-data.json"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download model")
    }
  }

  const handleShareResults = () => {
    try {
      let shareText = `Model Results: Type: ${problemType}\n`

      if (problemType === "Classification" && evaluationMetrics?.accuracy) {
        shareText += `Accuracy: ${(evaluationMetrics.accuracy * 100).toFixed(1)}%\n`
        shareText += `Precision: ${(evaluationMetrics.precision * 100).toFixed(1)}%\n`
        shareText += `Recall: ${(evaluationMetrics.recall * 100).toFixed(1)}%\n`
        shareText += `F1 Score: ${(evaluationMetrics.f1_score * 100).toFixed(1)}%`
      } else if (problemType === "Regression" && evaluationMetrics?.rmse) {
        shareText += `R² Score: ${evaluationMetrics.r2?.toFixed(3)}\n`
        shareText += `RMSE: ${evaluationMetrics.rmse?.toFixed(2)}\n`
        shareText += `MAE: ${evaluationMetrics.mae?.toFixed(2)}`
      } else if (problemType === "Clustering" && evaluationMetrics?.silhouette_score) {
        shareText += `Silhouette Score: ${evaluationMetrics.silhouette_score?.toFixed(3)}\n`
        shareText += `Davies-Bouldin: ${evaluationMetrics.davies_bouldin_score?.toFixed(3)}`
      }

      if (navigator.share) {
        navigator.share({
          title: "ML Model Results",
          text: shareText,
        })
      } else {
        navigator.clipboard.writeText(shareText)
        alert("Results copied to clipboard!")
      }
    } catch (error) {
      console.error("Share failed:", error)
      alert("Failed to share results")
    }
  }

  const renderMetrics = () => {
    if (!evaluationMetrics) return null

    if (problemType === "Regression") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">R² Score</p>
              <p className="text-3xl font-bold text-foreground">{evaluationMetrics.r2?.toFixed(3) || "N/A"}</p>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.max(0, Math.min(100, (evaluationMetrics.r2 || 0) * 100))}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">RMSE</p>
              <p className="text-3xl font-bold text-foreground">{evaluationMetrics.rmse?.toFixed(2) || "N/A"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">MAE</p>
              <p className="text-3xl font-bold text-foreground">{evaluationMetrics.mae?.toFixed(2) || "N/A"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">MSE</p>
              <p className="text-3xl font-bold text-foreground">{evaluationMetrics.mse?.toFixed(2) || "N/A"}</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (problemType === "Classification") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
              <p className="text-3xl font-bold text-foreground">
                {evaluationMetrics.accuracy ? (evaluationMetrics.accuracy * 100).toFixed(1) : "N/A"}%
              </p>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${(evaluationMetrics.accuracy || 0) * 100}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Precision</p>
              <p className="text-3xl font-bold text-foreground">
                {evaluationMetrics.precision ? (evaluationMetrics.precision * 100).toFixed(1) : "N/A"}%
              </p>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${(evaluationMetrics.precision || 0) * 100}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Recall</p>
              <p className="text-3xl font-bold text-foreground">
                {evaluationMetrics.recall ? (evaluationMetrics.recall * 100).toFixed(1) : "N/A"}%
              </p>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${(evaluationMetrics.recall || 0) * 100}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">F1 Score</p>
              <p className="text-3xl font-bold text-foreground">
                {evaluationMetrics.f1_score ? (evaluationMetrics.f1_score * 100).toFixed(1) : "N/A"}%
              </p>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${(evaluationMetrics.f1_score || 0) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (problemType === "Clustering") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Silhouette Score</p>
              <p className="text-3xl font-bold text-foreground">
                {evaluationMetrics.silhouette_score?.toFixed(3) || "N/A"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Calinski-Harabasz</p>
              <p className="text-3xl font-bold text-foreground">
                {evaluationMetrics.calinski_harabasz_score?.toFixed(2) || "N/A"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Davies-Bouldin</p>
              <p className="text-3xl font-bold text-foreground">
                {evaluationMetrics.davies_bouldin_score?.toFixed(3) || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Results & Evaluation</h1>
        <p className="text-muted-foreground">View comprehensive model performance metrics</p>
      </div>

      {!modelResults ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Results Yet</p>
            <p className="text-muted-foreground text-center">Train a model to see performance metrics</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {isEvaluating ? (
            <Card>
              <CardContent className="pt-12 pb-12 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 animate-pulse text-primary" />
                <p className="ml-3 text-muted-foreground">Preparing metrics...</p>
              </CardContent>
            </Card>
          ) : (
            renderMetrics()
          )}

          {problemType === "Clustering" && evaluationMetrics?.cluster_distribution && (
            <Card>
              <CardHeader>
                <CardTitle>Cluster Distribution</CardTitle>
                <CardDescription>Number of samples in each cluster</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.isArray(evaluationMetrics.cluster_distribution)
                    ? evaluationMetrics.cluster_distribution.map(
                        (item: { cluster: number; size: number }, idx: number) => (
                          <div key={idx} className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Cluster {item.cluster}</p>
                            <p className="text-2xl font-bold text-foreground">{item.size}</p>
                          </div>
                        ),
                      )
                    : Object.entries(evaluationMetrics.cluster_distribution).map(([cluster, count]) => (
                        <div key={cluster} className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Cluster {cluster}</p>
                          <p className="text-2xl font-bold text-foreground">{count as number}</p>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Report</CardTitle>
              <CardDescription>Complete model evaluation metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {modelResults.rmse && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">RMSE</p>
                      <p className="text-2xl font-bold text-foreground">{modelResults.rmse || "N/A"}</p>
                    </div>
                  )}
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Training Time</p>
                    <p className="text-2xl font-bold text-foreground">
                      {modelResults.duration || modelResults.trainingTime || "N/A"}
                    </p>
                  </div>
                  {modelResults.epoch && (
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Epochs/Iterations</p>
                      <p className="text-2xl font-bold text-foreground">{modelResults.epoch}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export & Share</CardTitle>
              <CardDescription>Save and share your model results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleExportPDF} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
                <Button onClick={handleDownloadModel} className="w-full bg-green-600 hover:bg-green-700">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Model
                </Button>
                <Button onClick={handleShareResults} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
