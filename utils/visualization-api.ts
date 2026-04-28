/**
 * Visualization API Integration Layer
 * Handles JSON data fetching and transformation from backend
 */

interface APIConfig {
  baseUrl: string
  timeout?: number
}

interface RegressionData {
  yTrue: number[]
  yPred: number[]
  rmse?: number
  mae?: number
  r2Score?: number
  mse?: number
  residuals?: number[]
}

interface ClassificationData {
  yTrue: number[]
  yPred: number[]
  accuracy?: number
  precision?: number
  recall?: number
  f1Score?: number
  confusionMatrix?: number[][]
  rocCurve?: number[]
  rocAuc?: number
  precisionRecallCurve?: number[]
  predictionProbabilities?: number[]
}

interface ClusteringData {
  clusterLabels: number[]
  clusterCoordinates: number[][]
  silhouetteScore?: number
  silhouetteScores?: number[]
  daviesBouldinIndex?: number
  calinskiHarabaszScore?: number
  numClusters?: number
  clusterDistribution?: Array<{ cluster: number; size: number }>
  clusterCenters?: number[][]
}

/**
 * Fetch regression visualization data from backend API
 */
export async function fetchRegressionData(endpoint: string, config?: APIConfig): Promise<RegressionData> {
  const baseUrl = config?.baseUrl || ""
  const timeout = config?.timeout || 30000

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch regression data:", error)
    throw error
  }
}

/**
 * Fetch classification visualization data from backend API
 */
export async function fetchClassificationData(endpoint: string, config?: APIConfig): Promise<ClassificationData> {
  const baseUrl = config?.baseUrl || ""
  const timeout = config?.timeout || 30000

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch classification data:", error)
    throw error
  }
}

/**
 * Fetch clustering visualization data from backend API
 */
export async function fetchClusteringData(endpoint: string, config?: APIConfig): Promise<ClusteringData> {
  const baseUrl = config?.baseUrl || ""
  const timeout = config?.timeout || 30000

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch clustering data:", error)
    throw error
  }
}

/**
 * Transform raw API data to chart-ready format
 */
export function transformRegressionForCharts(data: RegressionData) {
  return {
    yTrue: data.yTrue,
    yPred: data.yPred,
    r2Score: data.r2Score || 0,
    rmse: data.rmse || 0,
    mae: data.mae || 0,
    mse: data.mse || 0,
  }
}

export function transformClassificationForCharts(data: ClassificationData) {
  return {
    accuracy: data.accuracy || 0,
    precision: data.precision || 0,
    recall: data.recall || 0,
    f1Score: data.f1Score || 0,
    confusionMatrix: data.confusionMatrix || [
      [0, 0],
      [0, 0],
    ],
    rocCurve: data.rocCurve || [],
    rocAuc: data.rocAuc || 0,
    precisionRecallCurve: data.precisionRecallCurve || [],
    predictionProbabilities: data.predictionProbabilities || [],
  }
}

export function transformClusteringForCharts(data: ClusteringData) {
  return {
    clusterLabels: data.clusterLabels,
    clusterCoordinates: data.clusterCoordinates,
    silhouetteScore: data.silhouetteScore || 0,
    silhouetteScores: data.silhouetteScores || [],
    daviesBouldinIndex: data.daviesBouldinIndex || 0,
    calinskiHarabaszScore: data.calinskiHarabaszScore || 0,
    numClusters: data.numClusters || 0,
    clusterDistribution: data.clusterDistribution || [],
    clusterCenters: data.clusterCenters || [],
  }
}
