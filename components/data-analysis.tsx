"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface DataAnalysisProps {
  dataset: any
  dataStats: any
  setDataStats: (stats: any) => void
  setActiveTab?: (tab: string) => void
}

export default function DataAnalysis({ dataset, dataStats, setDataStats, setActiveTab }: DataAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    if (dataset?.content && !dataStats && !isAnalyzing) {
      const analyzeAutomatically = async () => {
        setIsAnalyzing(true)
        setAnalysisError(null)

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ csvContent: dataset.content }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${response.status}: Analysis failed`)
          }

          const stats = await response.json()

          if (!stats || typeof stats !== "object") {
            throw new Error("Invalid response from analysis")
          }

          setDataStats(stats)
        } catch (error: any) {
          console.error("Error analyzing data:", error)
          const errorMsg =
            error.name === "AbortError"
              ? "Analysis timeout - dataset may be too large"
              : error.message || "Failed to analyze data"
          setAnalysisError(errorMsg)
        } finally {
          setIsAnalyzing(false)
        }
      }

      analyzeAutomatically()
    }
  }, [dataset?.content, dataStats, isAnalyzing])

  const analyzeCSVData = (content: string) => {
    const lines = content.trim().split("\n")
    if (lines.length < 2) {
      throw new Error("Invalid CSV format")
    }

    // Parse headers
    const headers = lines[0].split(",").map((h) => h.trim().replace(/['"]/g, ""))
    const dataLines = lines.slice(1).filter((line) => line.trim())

    // Parse all rows
    const rows = dataLines.map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""))
      const row: any = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx]
      })
      return row
    })

    // Analyze each column
    const columnAnalysis = headers.map((header) => {
      const values = rows.map((row) => row[header]).filter((v) => v !== "" && v !== null && v !== undefined)
      const numericValues = values.map((v) => Number.parseFloat(v)).filter((v) => !isNaN(v))

      const isNumeric = numericValues.length > values.length * 0.5 // More than 50% are numbers

      if (isNumeric && numericValues.length > 0) {
        // Numeric column
        const sorted = [...numericValues].sort((a, b) => a - b)
        const sum = numericValues.reduce((a, b) => a + b, 0)
        const mean = sum / numericValues.length
        const median = sorted[Math.floor(sorted.length / 2)]
        const min = sorted[0]
        const max = sorted[sorted.length - 1]

        // Calculate standard deviation
        const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length
        const std = Math.sqrt(variance)

        // Detect outliers using IQR method
        const q1 = sorted[Math.floor(sorted.length * 0.25)]
        const q3 = sorted[Math.floor(sorted.length * 0.75)]
        const iqr = q3 - q1
        const lowerBound = q1 - 1.5 * iqr
        const upperBound = q3 + 1.5 * iqr
        const outliers = numericValues.filter((v) => v < lowerBound || v > upperBound)

        return {
          column: header,
          type: "Numeric",
          count: numericValues.length,
          missing: values.length - numericValues.length,
          mean,
          median,
          std,
          min,
          max,
          outliers: outliers.length,
          outlierPercentage: (outliers.length / numericValues.length) * 100,
        }
      } else {
        // Categorical column
        const uniqueValues = [...new Set(values)]
        const valueCounts: any = {}
        values.forEach((v) => {
          valueCounts[v] = (valueCounts[v] || 0) + 1
        })

        return {
          column: header,
          type: "Categorical",
          count: values.length,
          missing: rows.length - values.length,
          unique: uniqueValues.length,
          mostCommon: Object.entries(valueCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0],
          valueCounts,
        }
      }
    })

    // Calculate correlations for numeric columns
    const numericColumns = columnAnalysis.filter((col) => col.type === "Numeric")
    const correlations: any[] = []

    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const col1 = numericColumns[i].column
        const col2 = numericColumns[j].column

        const values1 = rows.map((row) => Number.parseFloat(row[col1])).filter((v) => !isNaN(v))
        const values2 = rows.map((row) => Number.parseFloat(row[col2])).filter((v) => !isNaN(v))

        if (values1.length === values2.length && values1.length > 0) {
          // Calculate Pearson correlation
          const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length
          const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length

          let numerator = 0
          let denom1 = 0
          let denom2 = 0

          for (let k = 0; k < values1.length; k++) {
            const diff1 = values1[k] - mean1
            const diff2 = values2[k] - mean2
            numerator += diff1 * diff2
            denom1 += diff1 * diff1
            denom2 += diff2 * diff2
          }

          const correlation = numerator / Math.sqrt(denom1 * denom2)

          if (!isNaN(correlation) && Math.abs(correlation) > 0.1) {
            correlations.push({
              pair: `${col1} & ${col2}`,
              correlation: correlation,
            })
          }
        }
      }
    }

    // Sort correlations by absolute value
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

    // Count missing values
    const nullValues = columnAnalysis
      .filter((col) => col.missing > 0)
      .map((col) => ({
        column: col.column,
        count: col.missing,
        percentage: (col.missing / rows.length) * 100,
      }))

    // Find duplicate rows
    const rowStrings = rows.map((row) => JSON.stringify(row))
    const uniqueRows = new Set(rowStrings)
    const duplicateRows = rowStrings.length - uniqueRows.size

    return {
      totalRows: rows.length,
      totalColumns: headers.length,
      numericColumns: columnAnalysis.filter((col) => col.type === "Numeric").length,
      categoricalColumns: columnAnalysis.filter((col) => col.type === "Categorical").length,
      missingValues: (nullValues.reduce((sum, col) => sum + col.count, 0) / (rows.length * headers.length)) * 100,
      duplicateRows,
      nullValues: nullValues.slice(0, 10), // Top 10 columns with missing values
      statisticalSummary: columnAnalysis.filter((col) => col.type === "Numeric").slice(0, 10),
      categoricalSummary: columnAnalysis.filter((col) => col.type === "Categorical").slice(0, 10),
      dataTypes: columnAnalysis.map((col) => ({
        column: col.column,
        type: col.type,
        count: col.count,
      })),
      outliers: columnAnalysis
        .filter((col) => col.type === "Numeric" && col.outliers > 0)
        .map((col) => ({
          column: col.column,
          outlierCount: col.outliers,
          percentage: col.outlierPercentage,
        })),
      correlations: correlations.slice(0, 10), // Top 10 correlations
      columnAnalysis, // Store full analysis
    }
  }

  const handleAnalyzeData = async () => {
    if (!dataset?.content) {
      alert("No dataset content found. Please upload a dataset first.")
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: dataset.content }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Analysis failed`)
      }

      const stats = await response.json()

      if (!stats || typeof stats !== "object") {
        throw new Error("Invalid response from analysis")
      }

      setDataStats(stats)
      setActiveTab?.("analysis")
    } catch (error: any) {
      console.error("Error analyzing data:", error)
      const errorMsg =
        error.name === "AbortError"
          ? "Analysis timeout - dataset may be too large"
          : error.message || "Failed to analyze data"
      setAnalysisError(errorMsg)
      alert(errorMsg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Data Analysis & Description</h1>
        <p className="text-muted-foreground">Explore dataset characteristics to choose the best model</p>
      </div>

      {!dataset ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Dataset Selected</p>
            <p className="text-muted-foreground text-center">Upload a dataset first to analyze</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {isAnalyzing && !dataStats && (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">Analyzing your dataset...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {dataStats && (
            <>
              {/* Dataset Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Rows</p>
                    <p className="text-3xl font-bold text-foreground">{dataStats.totalRows.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Columns</p>
                    <p className="text-3xl font-bold text-foreground">{dataStats.totalColumns}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Numeric Columns</p>
                    <p className="text-3xl font-bold text-purple-600">{dataStats.numericColumns}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Categorical Columns</p>
                    <p className="text-3xl font-bold text-orange-600">{dataStats.categoricalColumns}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Quality */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality Assessment</CardTitle>
                  <CardDescription>Missing values and data completeness</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dataStats.missingValues > 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-900">Missing Data Detected</p>
                        <p className="text-sm text-yellow-800">
                          Overall missing values: {dataStats.missingValues.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900">Complete Dataset</p>
                        <p className="text-sm text-green-800">No missing values detected</p>
                      </div>
                    </div>
                  )}

                  {dataStats.nullValues.length > 0 && (
                    <div>
                      <p className="font-semibold mb-3">Missing Values by Column:</p>
                      <div className="space-y-2">
                        {dataStats.nullValues.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium">{item.column}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-500"
                                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold w-16 text-right">
                                {item.count} ({item.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-semibold">
                      Duplicate Rows:{" "}
                      <span className={dataStats.duplicateRows > 0 ? "text-red-500" : "text-green-600"}>
                        {dataStats.duplicateRows}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Statistical Summary */}
              {dataStats.statisticalSummary.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Statistical Summary (Numeric Columns)</CardTitle>
                    <CardDescription>Descriptive statistics for numeric columns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b-2">
                          <tr>
                            <th className="text-left py-2 px-2 font-semibold">Column</th>
                            <th className="text-right py-2 px-2 font-semibold">Mean</th>
                            <th className="text-right py-2 px-2 font-semibold">Median</th>
                            <th className="text-right py-2 px-2 font-semibold">Std Dev</th>
                            <th className="text-right py-2 px-2 font-semibold">Min</th>
                            <th className="text-right py-2 px-2 font-semibold">Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataStats.statisticalSummary.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b hover:bg-slate-50">
                              <td className="py-2 px-2 font-medium">{item.column}</td>
                              <td className="text-right py-2 px-2">{item.mean.toFixed(2)}</td>
                              <td className="text-right py-2 px-2">{item.median.toFixed(2)}</td>
                              <td className="text-right py-2 px-2">{item.std.toFixed(2)}</td>
                              <td className="text-right py-2 px-2">{item.min.toFixed(2)}</td>
                              <td className="text-right py-2 px-2">{item.max.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Categorical Summary */}
              {dataStats.categoricalSummary.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Categorical Summary</CardTitle>
                    <CardDescription>Overview of categorical columns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dataStats.categoricalSummary.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                          <p className="font-semibold text-foreground mb-2">{item.column}</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              Unique values: <span className="font-semibold text-foreground">{item.unique}</span>
                            </p>
                            <p className="text-muted-foreground">
                              Most common: <span className="font-semibold text-foreground">{item.mostCommon}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Outliers */}
              {dataStats.outliers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Outlier Detection</CardTitle>
                    <CardDescription>Detected outliers using IQR method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dataStats.outliers.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium">{item.column}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{item.outlierCount} outliers</span>
                            <span className="text-sm font-semibold text-orange-600">{item.percentage.toFixed(2)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feature Correlations */}
              {dataStats.correlations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Correlations</CardTitle>
                    <CardDescription>Correlation between feature pairs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dataStats.correlations.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-sm">{item.pair}</span>
                          <span className={`font-semibold ${item.correlation > 0 ? "text-green-600" : "text-red-600"}`}>
                            {item.correlation.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
