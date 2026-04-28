"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Info, AlertCircle } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useState, useMemo } from "react"

interface AlgorithmPanelProps {
  selectedAlgorithm: string | null
  onSelectAlgorithm: (algo: string) => void
  dataset: any
  targetVariable: string | null
  dataStats: any
  problemType: string | null
  kMeansCluster?: number
  onKMeansClusterChange?: (clusters: number) => void
}

export default function AlgorithmPanel({
  selectedAlgorithm,
  onSelectAlgorithm,
  dataset,
  targetVariable,
  dataStats,
  problemType,
  kMeansCluster = 3,
  onKMeansClusterChange,
}: AlgorithmPanelProps) {
  const [useAutoDetect, setUseAutoDetect] = useState(true)

  const autoDetectClusters = useMemo(() => {
    if (!dataset?.samples) return 3
    const n = dataset.samples
    const suggested = Math.round(Math.sqrt(n / 2))
    return Math.max(2, Math.min(10, suggested))
  }, [dataset?.samples])

  const effectiveClusters = useAutoDetect ? autoDetectClusters : kMeansCluster

  const taskType = problemType ? problemType.toLowerCase() : "classification"

  const allAlgorithms = [
    // ========== REGRESSION ==========
    {
      id: "Linear Regression",
      name: "Linear Regression (Régression linéaire)",
      category: "Regression",
      description: "Best for linear relationships between variables",
      use: "Simple linear regression patterns",
      complexity: "Low",
      types: ["regression"],
    },
    {
      id: "Decision Tree Regressor",
      name: "Decision Tree Regressor",
      category: "Regression",
      description: "Tree-based regression model",
      use: "Non-linear regression patterns",
      complexity: "Medium",
      types: ["regression"],
    },
    {
      id: "Random Forest Regressor",
      name: "Random Forest Regressor",
      category: "Regression",
      description: "Ensemble of decision trees for regression",
      use: "Non-linear regression patterns",
      complexity: "High",
      types: ["regression"],
    },
    {
      id: "SVR",
      name: "Support Vector Regression (SVR)",
      category: "Regression",
      description: "Support Vector Regression",
      use: "Complex regression patterns",
      complexity: "High",
      types: ["regression"],
    },
    {
      id: "KNN",
      name: "k-Nearest Neighbors (k-NN)",
      category: "Regression",
      description: "Instance-based learning algorithm for regression",
      use: "Regression based on nearest neighbors",
      complexity: "Low",
      types: ["regression"],
    },
    {
      id: "MLP Regressor",
      name: "Artificial Neural Networks",
      category: "Regression",
      description: "Artificial Neural Networks for regression tasks",
      use: "Complex non-linear regression with hidden layers",
      complexity: "High",
      types: ["regression"],
    },

    // ========== CLASSIFICATION ==========
    {
      id: "Logistic Regression",
      name: "Logistic Regression",
      category: "Classification",
      description: "Linear model for binary and multi-class classification",
      use: "Linear classification patterns, probability estimates",
      complexity: "Low",
      types: ["classification"],
    },
    {
      id: "Naive Bayes",
      name: "Naïve Bayes",
      category: "Classification",
      description: "Probabilistic classifier based on Bayes' theorem",
      use: "Fast probabilistic classification, text classification",
      complexity: "Low",
      types: ["classification"],
    },
    {
      id: "SVM",
      name: "Support Vector Machine (SVM)",
      category: "Classification",
      description: "Support Vector Machine for classification",
      use: "Complex classification patterns",
      complexity: "High",
      types: ["classification"],
    },
    {
      id: "KNN",
      name: "k-Nearest Neighbors (k-NN)",
      category: "Classification",
      description: "Instance-based learning algorithm",
      use: "Classification based on nearest neighbors",
      complexity: "Low",
      types: ["classification"],
    },
    {
      id: "Decision Tree Classifier",
      name: "Decision Tree Classifier",
      category: "Classification",
      description: "Tree-based classification model",
      use: "Non-linear classification patterns",
      complexity: "Medium",
      types: ["classification"],
    },
    {
      id: "Random Forest (Classifier)",
      name: "Random Forest Classifier",
      category: "Classification",
      description: "Ensemble of decision trees for robust predictions",
      use: "Classification, handles non-linear data",
      complexity: "High",
      types: ["classification"],
    },
    {
      id: "MLP Classifier",
      name: "Artificial Neural Networks (MLP Classifier)",
      category: "Classification",
      description: "Artificial Neural Networks for classification",
      use: "Complex non-linear classification with hidden layers",
      complexity: "High",
      types: ["classification"],
    },

    // ========== CLUSTERING ==========
    {
      id: "K-Means",
      name: "K-Means",
      category: "Clustering",
      description: "Partitioning method for unsupervised learning",
      use: "Grouping similar data points",
      complexity: "Medium",
      types: ["clustering"],
    },
  ]

  const algorithms = allAlgorithms.filter((algo) => {
    if (!problemType) {
      return true
    }
    if (problemType === "Clustering") {
      return algo.types.includes("clustering")
    }
    return algo.types.includes(taskType)
  })

  const algorithmsByCategory = algorithms.reduce(
    (acc, algo) => {
      if (!acc[algo.category]) {
        acc[algo.category] = []
      }
      acc[algo.category].push(algo)
      return acc
    },
    {} as Record<string, typeof algorithms>,
  )

  const categoryOrder = ["Regression", "Classification", "Clustering"]
  const sortedCategories = Object.keys(algorithmsByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  )

  const handleAlgorithmClick = (algoId: string) => {
    onSelectAlgorithm(algoId)
  }

  const getRecommendation = () => {
    if (!dataStats) return null

    const datasetSize = dataStats.totalRows
    const numFeatures = dataStats.numericColumns

    if (taskType === "regression") {
      if (datasetSize < 1000) return "Linear Regression"
      if (numFeatures > 10) return "Random Forest Regressor"
      return "Decision Tree Regressor"
    } else if (taskType === "classification") {
      if (datasetSize < 1000) return "Logistic Regression"
      if (numFeatures > 10) return "Random Forest (Classifier)"
      return "Decision Tree Classifier"
    } else if (taskType === "clustering") {
      if (datasetSize < 1000) return null
      if (numFeatures > 10) return "K-Means"
      return null
    }
    return null
  }

  const recommendedAlgo = getRecommendation()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Select ML Algorithm</h1>
        <p className="text-muted-foreground">
          {targetVariable
            ? `Predicting: ${targetVariable} (${taskType})`
            : problemType
              ? `Task Type: ${problemType}`
              : "Select a target variable to get algorithm recommendations"}
        </p>
      </div>

      {!targetVariable && problemType !== "Clustering" && (
        <div className="bg-blue-50 border-blue-200 p-4 rounded">
          <Info className="h-4 w-4 text-blue-600 inline-block mr-2" />
          <span className="text-blue-800">
            💡 Tip: Select a target variable in the <strong>Select Target</strong> step to get algorithm recommendations
            tailored to your problem.
          </span>
        </div>
      )}

      {!dataset ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">Missing Dataset</p>
            <p className="text-muted-foreground text-center">Upload a dataset first to select an algorithm</p>
          </CardContent>
        </Card>
      ) : algorithms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Algorithms Available</p>
            <p className="text-muted-foreground text-center">
              No algorithms match your current problem type. Please select a target variable first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Algorithm Selection Grid - Organized by Category */}
          {sortedCategories.map((category) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-foreground mb-3">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {algorithmsByCategory[category].map((algo) => {
                  const isRecommended = algo.id === recommendedAlgo
                  return (
                    <Card
                      key={algo.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedAlgorithm === algo.id
                          ? "border-blue-500 border-2 bg-blue-50 shadow-lg scale-105"
                          : isRecommended
                            ? "border-green-400 border-2"
                            : "border-gray-200"
                      }`}
                      onClick={() => handleAlgorithmClick(algo.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{algo.name}</CardTitle>
                              {isRecommended && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <CardDescription className="text-xs mt-1">{algo.description}</CardDescription>
                          </div>
                          {selectedAlgorithm === algo.id && (
                            <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-semibold">{algo.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Complexity:</span>
                            <span
                              className={`font-semibold ${
                                algo.complexity === "Low"
                                  ? "text-green-600"
                                  : algo.complexity === "Medium"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {algo.complexity}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}

          {selectedAlgorithm && (
            <>
              {selectedAlgorithm === "K-Means" && (
                <Card className="border-l-4 border-l-blue-500 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-700">K-Means Configuration</CardTitle>
                    <CardDescription>Select the number of clusters for K-Means clustering</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Number of Clusters: {kMeansCluster}
                      </label>
                      <Slider
                        min={2}
                        max={10}
                        step={1}
                        value={[kMeansCluster]}
                        onValueChange={(value) => onKMeansClusterChange?.(value[0])}
                        className="w-full [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Minimum (2)</span>
                        <span>Maximum (10)</span>
                      </div>
                    </div>

                    <div className="bg-blue-100 border border-blue-300 p-4 rounded-lg">
                      <p className="font-semibold text-blue-900 mb-2">Cluster Selection Tips:</p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Adjust the slider to select the desired number of clusters</li>
                        <li>• Larger k values create more granular clusters</li>
                        <li>• Review the clustering results to verify your choice</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-l-4 border-l-green-500 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Algorithm Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>{algorithms.find((a) => a.id === selectedAlgorithm)?.name}</strong> will be trained with
                      these settings:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Data Preprocessing: Automatic
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Validation: Cross-validation enabled
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {selectedAlgorithm === "K-Means"
                          ? `Number of Clusters = ${kMeansCluster}`
                          : "Hyperparameters: Optimized defaults"}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
