"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DataDiagnosticsProps {
  visualizationData: any
  problemType: string
  modelResults: any
}

export default function DataDiagnostics({ visualizationData, problemType, modelResults }: DataDiagnosticsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    requirements: true,
    available: true,
    missing: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Define requirements for each problem type
  const getRequirements = () => {
    switch (problemType) {
      case "Regression":
        return {
          required: ["actualPredicted", "residuals", "errorDistribution", "yTrue", "yPred"],
          metrics: ["r2Score", "rmse", "mae", "mse"],
          description: "Regression models need prediction comparison data and error metrics",
        }
      case "Classification":
        return {
          required: ["confusionMatrix", "rocCurve", "precisionRecallCurve", "yTrue", "yPred"],
          metrics: ["accuracy", "precision", "recall", "f1Score", "rocAuc"],
          description: "Classification models need decision boundary data and classification metrics",
        }
      case "Clustering":
        return {
          required: ["clusterPlot", "clusterDistribution", "silhouetteValues", "clusterLabels"],
          metrics: ["silhouetteScore", "daviesBouldinIndex", "calinskiHarabaszScore", "numClusters"],
          description: "Clustering models need cluster assignments and cluster quality metrics",
        }
      default:
        return { required: [], metrics: [], description: "" }
    }
  }

  // Check if a field has data
  const hasData = (field: string): boolean => {
    const value = visualizationData?.[field]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === "number" || typeof value === "string") return value !== null && value !== undefined
    return false
  }

  const requirements = getRequirements()
  const availableData = requirements.required.filter(hasData)
  const missingData = requirements.required.filter((field) => !hasData(field))
  const availableMetrics = requirements.metrics.filter((metric) => visualizationData?.[metric] != null)
  const missingMetrics = requirements.metrics.filter((metric) => visualizationData?.[metric] == null)

  const isReady = availableData.length > 0

  const consoleLogs = () => {
    const logs = {
      timestamp: new Date().toISOString(),
      problemType,
      requirements: {
        plotData: requirements.required,
        metrics: requirements.metrics,
      },
      available: {
        plotData: availableData,
        metrics: availableMetrics,
      },
      missing: {
        plotData: missingData,
        metrics: missingMetrics,
      },
      rawData: {
        visualizationData: visualizationData,
        modelResults: modelResults,
      },
    }

    console.log("¬ Data Diagnostics:", logs)
    return logs
  }

  return (
    <div className="space-y-4">
      {isReady ? (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            ✓ Sufficient data available for visualization ({availableData.length}/{requirements.required.length}{" "}
            required fields)
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            ✗ Missing critical data: {missingData.length} required field(s) are empty or undefined
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection("requirements")}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">📋 Data Requirements</CardTitle>
              <CardDescription className="text-xs mt-1">{requirements.description}</CardDescription>
            </div>
            {expandedSections.requirements ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.requirements && (
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold mb-2">Plot Data Fields (need at least one with data):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {requirements.required.map((field) => (
                  <div
                    key={field}
                    className="flex items-start gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  >
                    {hasData(field) ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <code className="text-xs">{field}</code>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <p className="text-xs font-semibold mb-2">Performance Metrics (optional but recommended):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {requirements.metrics.map((metric) => (
                  <div
                    key={metric}
                    className="flex items-start gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  >
                    {visualizationData?.[metric] != null ? (
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    )}
                    <code className="text-xs">{metric}</code>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection("available")}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">
                ✓ Available Data ({availableData.length}/{requirements.required.length})
              </CardTitle>
            </div>
            {expandedSections.available ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.available && (
          <CardContent>
            {availableData.length > 0 ? (
              <div className="space-y-1 text-xs">
                {availableData.map((field) => {
                  const value = visualizationData?.[field]
                  const size = Array.isArray(value) ? value.length : "value"
                  return (
                    <div
                      key={field}
                      className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded"
                    >
                      <code className="text-green-900 dark:text-green-100">{field}</code>
                      <span className="text-green-700 dark:text-green-300 text-xs">
                        {Array.isArray(value) ? `${size} items` : typeof value}
                      </span>
                    </div>
                  )
                })}
                {availableMetrics.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-900">
                    <p className="text-xs font-semibold mb-1">Metrics:</p>
                    {availableMetrics.map((metric) => (
                      <div key={metric} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                        <code className="text-blue-900 dark:text-blue-100">{metric}</code>:{" "}
                        {visualizationData?.[metric]?.toFixed?.(4) ?? visualizationData?.[metric]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No data available</p>
            )}
          </CardContent>
        )}
      </Card>

      {missingData.length > 0 && (
        <Card>
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection("missing")}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">✗ Missing Data ({missingData.length})</CardTitle>
              </div>
              {expandedSections.missing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {expandedSections.missing && (
            <CardContent>
              <div className="space-y-1 text-xs">
                {missingData.map((field) => (
                  <div key={field} className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
                    <code className="text-red-900 dark:text-red-100">{field}</code>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                These fields are empty or undefined. Check that your visualization generation script outputs these
                fields.
              </p>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">🔧 Debug Logs</CardTitle>
          <CardDescription className="text-xs">Console output for development inspection</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => {
              consoleLogs()
              alert("Diagnostic logs sent to browser console. Press F12 to view.")
            }}
          >
            Log to Console
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Click above to log complete diagnostic information to your browser console for deeper inspection.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
