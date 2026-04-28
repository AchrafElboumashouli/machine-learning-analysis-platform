"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Database, CheckCircle } from "lucide-react"
import { useState } from "react"

interface ExportSectionProps {
  modelResults: any
  problemType?: string
}

export default function ExportSection({ modelResults, problemType = "Classification" }: ExportSectionProps) {
  const [exportStatus, setExportStatus] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const [exportedFiles, setExportedFiles] = useState<string[]>([])

  const handleExportModel = async (format = "pkl") => {
    if (!modelResults) return

    setIsExporting(true)
    setExportStatus("")
    setExportedFiles([])

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelResults,
          modelName: `${problemType}_model_${Date.now()}`,
          format,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setExportStatus(result.message || "Export successful")
          setExportedFiles(result.files || [])
        } else {
          setExportStatus(result.error || "Export failed")
        }
      } else {
        setExportStatus("Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
      setExportStatus("Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPredictions = () => {
    if (!modelResults?.predictions || !modelResults?.yTest) {
      alert("No predictions available to export")
      return
    }

    const csvContent = [
      ["Actual", "Predicted"].join(","),
      ...modelResults.yTest.map((actual: any, i: number) => [actual, modelResults.predictions[i]].join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `predictions_${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportLearningCurve = () => {
    if (!modelResults?.learningCurve) {
      alert("No learning curve data available")
      return
    }

    const headers = Object.keys(modelResults.learningCurve[0])
    const csvContent = [
      headers.join(","),
      ...modelResults.learningCurve.map((row: any) => headers.map((h) => row[h]).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `learning_curve_${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportMetrics = () => {
    if (!modelResults) {
      alert("No metrics available")
      return
    }

    const metrics = {
      algorithm: modelResults.algorithm,
      problemType: modelResults.problemType || problemType,
      targetVariable: modelResults.targetVariable,
      trainSamples: modelResults.trainSamples,
      testSamples: modelResults.testSamples,
      ...(problemType === "Classification" && {
        accuracy: modelResults.accuracy,
        precision: modelResults.precision,
        recall: modelResults.recall,
        f1Score: modelResults.f1Score,
      }),
      ...(problemType === "Regression" && {
        rmse: modelResults.rmse,
        r2Score: modelResults.r2Score,
      }),
    }

    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `metrics_${Date.now()}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Export & Save</h1>
        <p className="text-muted-foreground">Export results, models, and reports for future use</p>
      </div>

      {!modelResults ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Results to Export</p>
            <p className="text-muted-foreground text-center">Train a model first to export results</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {exportStatus && (
            <Card
              className={`border-l-4 ${exportedFiles.length > 0 ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50"}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className={`h-5 w-5 flex-shrink-0 mt-0.5 ${exportedFiles.length > 0 ? "text-green-600" : "text-red-600"}`}
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${exportedFiles.length > 0 ? "text-green-800" : "text-red-800"}`}>
                      {exportStatus}
                    </p>
                    {exportedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-green-700">Exported files:</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          {exportedFiles.map((file, i) => (
                            <li key={i} className="font-mono text-xs">
                              ✓ {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Export Reports
                </CardTitle>
                <CardDescription>Save detailed analysis reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-transparent" variant="outline" onClick={handleExportMetrics}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Metrics (JSON)
                </Button>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={handleExportPredictions}
                  disabled={!modelResults.predictions}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Predictions (CSV)
                </Button>
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={handleExportLearningCurve}
                  disabled={!modelResults.learningCurve}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Learning Curve (CSV)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Export Model
                </CardTitle>
                <CardDescription>Save trained models for later use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-transparent"
                  variant="outline"
                  onClick={() => handleExportModel("pkl")}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Download Complete Export (PKL)"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Exports metrics, predictions, and learning curve as separate files
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>Model Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Algorithm:</span>
                  <span className="font-semibold">{modelResults.algorithm || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Problem Type:</span>
                  <span className="font-semibold">{problemType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Variable:</span>
                  <span className="font-semibold">{modelResults.targetVariable || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Training Samples:</span>
                  <span className="font-semibold">{modelResults.trainSamples || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
