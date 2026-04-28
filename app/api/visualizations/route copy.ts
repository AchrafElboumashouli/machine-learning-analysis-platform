/**
 * Visualizations API Route
 * Transforms Python results into chart-ready JSON data
 */

import { NextResponse } from "next/server"
import { execSync } from "child_process"
import path from "path"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { modelResults, problemType, modelName } = body

    if (!modelResults) {
      return NextResponse.json({ error: "No model results provided" }, { status: 400 })
    }

    let visualizationData
    try {
      const scriptPath = path.join(process.cwd(), "scripts", "visualization.py")
      const inputData = {
        problemType,
        yTest: modelResults.yTest,
        predictions: modelResults.predictions,
        XTest: modelResults.xTest,
        yPredProba: modelResults.yPredProba,
        rocCurve: modelResults.rocCurve,
        precisionRecallCurve: modelResults.precisionRecallCurve,
      }

      const pythonOutput = execSync(`python3 ${scriptPath}`, {
        input: JSON.stringify(inputData),
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      })

      visualizationData = JSON.parse(pythonOutput)
      visualizationData.modelName = modelName
      visualizationData.problemType = problemType
      visualizationData.timestamp = new Date().toISOString()

      if (problemType === "Clustering") {
        visualizationData = {
          ...visualizationData,
          clusterings: {
            metrics: {
              silhouetteScore: visualizationData.silhouetteScore || 0,
              daviesBouldinIndex: visualizationData.daviesBouldinIndex || 0,
              calinskiHarabaszScore: visualizationData.calinskiHarabaszScore || 0,
              nClusters: visualizationData.clusterLabels
                ? Math.max(...new Set(visualizationData.clusterLabels)) + 1
                : 2,
            },
            clusterDistribution: visualizationData.clusterDistribution || [],
            clusterPlot: visualizationData.clusterPlot || [],
            clusterLabels: visualizationData.clusterLabels || [],
            silhouetteValues: visualizationData.silhouetteValues || [],
            clusterCoordinates: visualizationData.clusterCoordinates || [],
            clusterCenters: visualizationData.clusterCenters || [],
          },
          modelName,
          problemType,
          timestamp: new Date().toISOString(),
        }
      }
    } catch (pythonError) {
      console.error("¬ Python visualization error:", pythonError)
      // Fallback to TypeScript formatting if Python fails
      visualizationData = formatVisualizationData(modelResults, problemType, modelName)
    }

    return NextResponse.json(visualizationData, { status: 200 })
  } catch (error) {
    console.error("¬ Visualization API error:", error)
    return NextResponse.json({ error: "Failed to process visualizations" }, { status: 500 })
  }
}

// =====================================================
// CLASSIFICATION VISUALIZATIONS
// =====================================================

function formatClassificationVisualizations(modelResults: any) {
  const classifications = {
    metrics: {
      accuracy: modelResults.accuracy || 0,
      precision: modelResults.precision || 0,
      recall: modelResults.recall || 0,
      f1Score: modelResults.f1Score || 0,
    },
    confusionMatrix: modelResults.confusionMatrix || [],
    classDistribution: formatClassDistributionData(modelResults.classDistribution),
    rocCurve: modelResults.rocCurve || [],
    precisionRecallCurve: modelResults.precisionRecallCurve || [],
    rocAuc: modelResults.rocAuc || null,
    featureImportance: formatFeatureImportanceData(modelResults.featureImportance),
    classLabels: modelResults.classLabels || [],
  }

  return { classifications }
}

// =====================================================
// REGRESSION VISUALIZATIONS
// =====================================================

function formatRegressionVisualizations(modelResults: any) {
  const predictions = modelResults.predictions || []
  const yTest = modelResults.yTest || []

  const actualVsPredicted = predictions.slice(0, 100).map((pred: number, idx: number) => ({
    x: Number(pred.toFixed(4)),
    y: Number((yTest[idx] || 0).toFixed(4)),
  }))

  const residuals = predictions.slice(0, 100).map((pred: number, idx: number) => ({
    fitted: Number(pred.toFixed(4)),
    residual: Number(((yTest[idx] || 0) - pred).toFixed(4)),
  }))

  const residualValues = residuals.map((r) => r.residual)
  const residualDistribution = createHistogramBins(residualValues, 15)

  const regressions = {
    metrics: {
      r2Score: modelResults.r2Score || 0,
      rmse: modelResults.rmse || 0,
      mae: modelResults.mae || 0,
      mse: modelResults.mse || 0,
    },
    actualVsPredicted,
    residuals,
    residualDistribution,
    featureImportance: formatFeatureImportanceData(modelResults.featureImportance),
    learningCurve: modelResults.learningCurve || null,
  }

  return { regressions }
}

// =====================================================
// CLUSTERING VISUALIZATIONS
// =====================================================

function formatClusteringVisualizations(modelResults: any) {
  const xTest = parseXTest(modelResults.xTest)
  const predictions = modelResults.predictions || []

  const clusterScatter = xTest.slice(0, 300).map((point: any, idx: number) => ({
    x: Array.isArray(point) ? point[0] : 0,
    y: Array.isArray(point) ? point[1] : 0,
    cluster: predictions[idx] || 0,
  }))

  const clusterDistribution = createClusterDistributionData(predictions)

  const clusterings = {
    metrics: {
      silhouetteScore: modelResults.silhouetteScore || 0,
      daviesBouldinIndex: modelResults.daviesBouldinIndex || 0,
      calinskiHarabaszScore: modelResults.calinskiHarabaszScore || 0,
      nClusters: Math.max(...predictions) + 1 || 2,
    },
    clusterScatter,
    clusterDistribution,
    elbowCurve: modelResults.elbowCurve || null,
    silhouettePlot: modelResults.silhouettePlot || null,
  }

  return { clusterings }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function formatVisualizationData(modelResults: any, problemType: string, modelName: string) {
  const baseData = {
    modelName,
    problemType,
    timestamp: new Date().toISOString(),
  }

  if (problemType === "Classification") {
    return {
      ...baseData,
      ...formatClassificationVisualizations(modelResults),
    }
  } else if (problemType === "Regression") {
    return {
      ...baseData,
      ...formatRegressionVisualizations(modelResults),
    }
  } else if (problemType === "Clustering") {
    return {
      ...baseData,
      ...formatClusteringVisualizations(modelResults),
    }
  }

  return baseData
}

function formatClassDistributionData(data: any): Array<{ class: string; count: number }> {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map((item: any, idx: number) => ({
      class: typeof item === "object" ? item.class || `Class ${idx}` : `Class ${idx}`,
      count: typeof item === "object" ? item.count || 0 : item,
    }))
  }
  return []
}

function formatFeatureImportanceData(data: any): Array<{ feature: string; importance: number; rank: number }> {
  if (!data) return []

  const features = Array.isArray(data)
    ? data.map((imp: any, idx: number) => ({
        feature: typeof imp === "object" ? imp.name || `Feature ${idx}` : `Feature ${idx}`,
        importance: typeof imp === "object" ? imp.importance || 0 : imp,
      }))
    : []

  features.sort((a, b) => b.importance - a.importance)

  return features.map((f, idx) => ({
    ...f,
    importance: Number(f.importance.toFixed(4)),
    rank: idx + 1,
  }))
}

function createHistogramBins(values: number[], binCount: number): Array<{ bin: string; count: number }> {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  if (range === 0) {
    return [{ bin: min.toFixed(2), count: values.length }]
  }

  const step = range / binCount
  const bins: Array<{ bin: string; count: number }> = []

  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * step
    const binEnd = i === binCount - 1 ? max + 0.0001 : binStart + step

    const count = values.filter((v) => v >= binStart && v < binEnd).length

    bins.push({
      bin: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
      count,
    })
  }

  return bins
}

function createClusterDistributionData(predictions: number[]): Array<{ cluster: string; count: number }> {
  const counts = new Map<number, number>()

  predictions.forEach((label) => {
    counts.set(label, (counts.get(label) || 0) + 1)
  })

  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([cluster, count]) => ({
      cluster: `Cluster ${cluster}`,
      count,
    }))
}

function parseXTest(xTest: any): any[] {
  if (!xTest) return []
  if (typeof xTest === "string") {
    try {
      return JSON.parse(xTest)
    } catch {
      return []
    }
  }
  return xTest
}
