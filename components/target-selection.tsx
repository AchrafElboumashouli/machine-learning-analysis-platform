"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface TargetSelectionProps {
  dataset: any
  targetVariable: string | null
  setTargetVariable: (variable: string | null) => void
  dataStats: any
  problemType: string | null
  setProblemType: (type: string | null) => void
}

export default function TargetSelection({
  dataset,
  targetVariable,
  setTargetVariable,
  dataStats,
  problemType,
  setProblemType,
}: TargetSelectionProps) {
  const [taskType, setTaskType] = useState<"regression" | "classification" | "clustering" | null>(null)

  const getColumns = () => {
    if (!dataStats?.columnAnalysis) {
      return { numeric: [], categorical: [] }
    }

    const numericColumns = dataStats.columnAnalysis
      .filter((col: any) => col.type === "Numeric")
      .map((col: any) => ({
        name: col.column,
        type: "Numeric",
        min: col.min,
        max: col.max,
        mean: col.mean,
        median: col.median,
        std: col.std,
        samples: [],
      }))

    const categoricalColumns = dataStats.columnAnalysis
      .filter((col: any) => {
        // Categorical columns: always include
        if (col.type === "Categorical") return true

        // Include if unique values ≤ 20 (discrete/categorical-like)
        // OR if it's binary (0,1) which is a special case of ≤20
        if (col.type === "Numeric") {
          const isBinary = col.unique === 2 && col.min === 0 && col.max === 1
          const isDiscreteClassification = col.unique <= 20
          return isBinary || isDiscreteClassification
        }

        return false
      })
      .map((col: any) => {
        // Get sample values for display (handle both categorical and numeric types)
        let sampleValues = []
        if (col.valueCounts) {
          sampleValues = Object.keys(col.valueCounts).slice(0, 5)
        } else if (col.unique <= 10) {
          // For numeric columns with few unique values, show them as samples
          sampleValues = [col.min, col.max, ...(col.mostCommon ? [col.mostCommon] : [])]
            .filter((v) => v !== undefined)
            .map((v) => String(v))
            .slice(0, 5)
        }

        return {
          name: col.column,
          type: col.type === "Categorical" ? "Categorical" : "Numeric Discrete",
          unique: col.unique,
          mostCommon: col.mostCommon,
          samples: sampleValues,
          classificationBadge:
            col.unique === 2
              ? "Binary Classification"
              : col.unique <= 20
                ? "Multiclass Classification"
                : "Many categories",
        }
      })

    return {
      numeric: numericColumns,
      categorical: categoricalColumns,
    }
  }

  const columns = getColumns()

  const handleSelectTarget = (colName: string | null, type: string) => {
    setTargetVariable(colName)
    setProblemType(type)
  }

  const getClassificationBadge = (col: any) => {
    if (col.unique === 2) {
      return { label: "Binary Classification", color: "bg-blue-100 text-blue-700" }
    } else if (col.unique <= 20) {
      return { label: "Multiclass Classification", color: "bg-purple-100 text-purple-700" }
    }
    return { label: "Many categories", color: "bg-amber-100 text-amber-700" }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Select Target Variable (Y)</h1>
        <p className="text-muted-foreground">Choose the column you want to predict</p>
      </div>

      {!dataset || !dataStats ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              {!dataset ? "No Dataset Selected" : "Data Not Analyzed"}
            </p>
            <p className="text-muted-foreground text-center">
              {!dataset
                ? "Please upload a dataset first"
                : "Please analyze your dataset before selecting a target variable"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Task Type Selection */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle>Step 1: Choose Task Type</CardTitle>
              <CardDescription>Select the type of machine learning task you want to perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setProblemType("Regression")
                  }}
                  disabled={columns.numeric.length === 0}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    columns.numeric.length === 0
                      ? "opacity-50 cursor-not-allowed border-gray-300"
                      : problemType === "Regression"
                        ? "border-blue-500 bg-blue-100 shadow-lg scale-105"
                        : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-foreground">📈 Regression</h3>
                    {problemType === "Regression" && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Predict continuous numeric values</p>
                  <div className="text-xs text-slate-600 bg-white/60 p-2 rounded">
                    <strong>Available columns:</strong> {columns.numeric.length}
                  </div>
                  {columns.numeric.length === 0 && (
                    <p className="text-xs text-red-600 mt-2">No numeric columns found</p>
                  )}
                </button>

                <button
                  onClick={() => {
                    setProblemType("Classification")
                  }}
                  disabled={columns.categorical.length === 0}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    columns.categorical.length === 0
                      ? "opacity-50 cursor-not-allowed border-gray-300"
                      : problemType === "Classification"
                        ? "border-purple-500 bg-purple-100 shadow-lg scale-105"
                        : "border-slate-300 hover:border-purple-400 hover:bg-purple-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-foreground">🎯 Classification</h3>
                    {problemType === "Classification" && <CheckCircle2 className="h-6 w-6 text-purple-600" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Predict categories or classes</p>
                  <div className="text-xs text-slate-600 bg-white/60 p-2 rounded">
                    <strong>Available columns:</strong> {columns.categorical.length}
                  </div>
                  {columns.categorical.length === 0 && (
                    <p className="text-xs text-red-600 mt-2">No categorical or binary numeric columns found</p>
                  )}
                </button>

                <button
                  onClick={() => {
                    setTargetVariable("Pas de labels (Clustering)")
                    setProblemType("Clustering")
                  }}
                  className={`p-6 border-2 rounded-xl text-left transition-all ${
                    problemType === "Clustering"
                      ? "border-emerald-500 bg-emerald-100 shadow-lg scale-105"
                      : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-foreground">🔗 Clustering</h3>
                    {problemType === "Clustering" && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Group data points without labels</p>
                  <div className="text-xs text-slate-600 bg-white/60 p-2 rounded">
                    <strong>Logic:</strong> Unsupervised learning
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Numeric Target Variables */}
          {problemType === "Regression" && columns.numeric.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Numeric Columns (For Regression)</CardTitle>
                <CardDescription>Select a continuous numeric target variable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {columns.numeric.map((col: any) => (
                    <button
                      key={col.name}
                      onClick={() => handleSelectTarget(col.name, "Regression")}
                      className={`p-5 border-2 rounded-xl text-left transition-all ${
                        targetVariable === col.name
                          ? "border-blue-500 bg-blue-100 shadow-lg"
                          : "border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-lg text-foreground">{col.name}</p>
                        {targetVariable === col.name && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Range:</span>
                          <span className="font-semibold">
                            {col.min.toFixed(2)} - {col.max.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Mean:</span>
                          <span className="font-semibold">{col.mean.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Median:</span>
                          <span className="font-semibold">{col.median.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Std Dev:</span>
                          <span className="font-semibold">{col.std.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded border border-slate-200">
                        <p className="text-xs text-slate-600">
                          Distribution: {col.std / col.mean < 0.5 ? "Low variance" : "High variance"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {problemType === "Classification" && columns.categorical.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Classification Targets</CardTitle>
                <CardDescription>
                  Select a column to predict (categorical, binary numeric, or discrete numeric columns)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {columns.categorical.map((col: any) => {
                    const badge = getClassificationBadge(col)
                    return (
                      <button
                        key={col.name}
                        onClick={() => handleSelectTarget(col.name, "Classification")}
                        className={`p-5 border-2 rounded-xl text-left transition-all ${
                          targetVariable === col.name
                            ? "border-purple-500 bg-purple-100 shadow-lg"
                            : "border-slate-200 hover:border-purple-400 hover:bg-purple-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-bold text-lg text-foreground">{col.name}</p>
                          {targetVariable === col.name && <CheckCircle2 className="h-5 w-5 text-purple-600" />}
                        </div>

                        <div className="mb-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Unique values:</span>
                            <span className="font-semibold">{col.unique}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Type:</span>
                            <span className="font-semibold">{col.type}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Most common:</span>
                            <span className="font-semibold">{col.mostCommon}</span>
                          </div>
                        </div>

                        {col.samples.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-600 mb-2">
                              {col.type === "Numeric Discrete" ? "Sample values (0, 1, etc):" : "Sample values:"}
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              {col.samples.map((sample: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono"
                                >
                                  {sample}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`mt-3 p-2 rounded ${badge.color}`}>
                          <p className="text-xs font-semibold">{badge.label}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Target Info */}
          {(targetVariable || problemType === "Clustering") && problemType && (
            <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-6 w-6" />
                  Configuration Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <p className="text-sm text-muted-foreground mb-1">Target Variable</p>
                    <p className="text-xl font-bold text-foreground">{targetVariable || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <p className="text-sm text-muted-foreground mb-1">Task Type</p>
                    <p className="text-xl font-bold text-green-600 capitalize">{problemType}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <p className="text-sm text-muted-foreground mb-1">Next Step</p>
                    <p className="text-xl font-bold text-blue-600">Configure Split</p>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-800 mb-2">✓ Configuration Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Your target variable is set. Proceed to configure your train/test split ratio.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
