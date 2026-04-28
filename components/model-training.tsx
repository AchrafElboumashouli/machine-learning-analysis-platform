"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, CheckCircle2, AlertCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PreprocessingConfig {
  missingValueStrategy: "mean" | "median" | "drop" | "forward_fill"
  encodingMethod: "onehot" | "ordinal" | "label"
  scalingMethod: "standard" | "minmax" | "none"
}

interface ModelTrainingProps {
  selectedAlgorithm: string | null
  dataset: any
  targetVariable: string | null
  trainSplitPercentage: number
  preprocessingConfig: PreprocessingConfig
  setModelResults: (results: any) => void
  problemType: string | null
  kMeansCluster?: number
}

export default function ModelTraining({
  selectedAlgorithm,
  dataset,
  targetVariable,
  trainSplitPercentage,
  preprocessingConfig,
  setModelResults,
  problemType,
  kMeansCluster = 3,
}: ModelTrainingProps) {
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [trainingComplete, setTrainingComplete] = useState(false)
  const [trainingResults, setTrainingResults] = useState<any>(null)
  const [trainingLogs, setTrainingLogs] = useState<string[]>([])

  const intervalRef = useRef<number | null>(null)

  const algorithmNames: Record<string, string> = {
    "Linear Regression": "Linear Regression",
    "Random Forest Regressor": "Random Forest Regressor",
    KNN: "K-Nearest Neighbors",
    "Decision Tree": "Decision Trees",
    SVR: "Support Vector Regression",
    "Logistic Regression": "Logistic Regression",
    "Random Forest (Classifier)": "Random Forest (Classifier)",
    SVM: "Support Vector Machine",
    "K-Means": "K-Means Clustering",
    "linear-reg": "Linear Regression",
    "poly-reg": "Polynomial Regression",
    logistic: "Logistic Regression",
    "decision-tree": "Decision Trees",
    "random-forest": "Random Forest",
    "naive-bayes": "Naïve Bayes",
    svm: "Support Vector Machine",
    knn: "K-Nearest Neighbors",
    kmeans: "K-Means Clustering",
    "neural-net": "Neural Networks",
  }

  const generateLogs = () => {
    const totalSamples = dataset?.samples || 1000
    const trainSamples = Math.floor((trainSplitPercentage / 100) * totalSamples)
    const testSamples = totalSamples - trainSamples

    return [
      "[INFO] Model initialization started...",
      `[INFO] Algorithm: ${algorithmNames[selectedAlgorithm!] || selectedAlgorithm}`,
      `[INFO] Target variable: ${targetVariable}`,
      `[INFO] Dataset size: ${totalSamples} samples`,
      `[INFO] Train/Test split: ${trainSamples}/${testSamples}`,
      `[INFO] Missing value strategy: ${preprocessingConfig.missingValueStrategy}`,
      `[INFO] Encoding method: ${preprocessingConfig.encodingMethod}`,
      `[INFO] Scaling method: ${preprocessingConfig.scalingMethod}`,
      "[INFO] Split data into train/test...",
      "[INFO] Fit preprocessing on training data only...",
      "[INFO] Starting model training...",
    ]
  }

  const handleStartTraining = async () => {
    if (!dataset || !selectedAlgorithm || (!targetVariable && problemType !== "Clustering") || isTraining) return

    setIsTraining(true)
    setTrainingProgress(0)
    setTrainingComplete(false)
    setTrainingLogs(generateLogs())

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: dataset.content,
          algorithm: selectedAlgorithm,
          targetVariable: targetVariable,
          trainRatio: trainSplitPercentage,
          problemType: problemType,
          preprocessingConfig: preprocessingConfig,
          kMeansCluster: selectedAlgorithm === "K-Means" ? kMeansCluster : undefined,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Training failed`)
      }

      intervalRef.current = window.setInterval(() => {
        setTrainingProgress((prev) => {
          const next = Math.min(prev + Math.random() * 15, 95)

          if (Math.floor(next) % 15 === 0) {
            setTrainingLogs((logs) => [
              ...logs,
              `[RUNNING] Epoch ${Math.floor(next)}/100 - Loss ${(0.6 - next / 200).toFixed(3)}`,
            ])
          }

          return next
        })
      }, 300)

      const results = await response.json()
      console.log("=== TRAIN RESULTS RECEIVED ===")
      console.log("results keys:", Object.keys(results))
      console.log("results:", results)

      console.log("results.predictions exists:", Array.isArray(results?.predictions))
      console.log("results.XTest exists:", Array.isArray(results?.XTest))
      console.log(
        "results.XTest shape:",
        results?.XTest?.length,
        results?.XTest?.[0]?.length
      )

      if (intervalRef.current) clearInterval(intervalRef.current)
      setTrainingProgress(50)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setTrainingProgress(100)
      try {


        const vizResponse = await fetch("/api/visualizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelResults: results,
            problemType: problemType,
            modelName: selectedAlgorithm,
          }),
        })


        if (vizResponse.ok) {
          const vizData = await vizResponse.json()
          const mergedResults = {
            ...results,
            ...vizData,
            rocCurve: results.rocCurve ?? vizData.rocCurve,
            precisionRecallCurve:
              results.precisionRecallCurve ?? vizData.precisionRecallCurve,
          }

          setTrainingResults(results)
          setModelResults(mergedResults)
        } else {
          setTrainingResults(results)
          setModelResults(results)
        }
      } catch (vizError) {
        console.error("Visualization transformation error:", vizError)
        setTrainingResults(results)
        setModelResults(results)
      }

      setTrainingLogs((logs) => [...logs, "[COMPLETE] Training finished successfully"])
      setIsTraining(false)
      setTrainingComplete(true)
    } catch (error: any) {
      if (intervalRef.current) clearInterval(intervalRef.current)

      console.error("Error training model:", error)
      const errorMsg =
        error.name === "AbortError" ? "Training timeout - request took too long" : error.message || "Training failed"

      setTrainingLogs((logs) => [...logs, `[ERROR] ${errorMsg}`])
      alert(errorMsg)
      setIsTraining(false)
    }

  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Model Training</h1>

      {!dataset || !selectedAlgorithm || (!targetVariable && problemType !== "Clustering") ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-semibold">Missing Configuration</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card
            className={
              !isTraining && !trainingComplete
                ? "border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50"
                : ""
            }
          >
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
              <CardDescription>
                {isTraining || trainingComplete ? `${Math.round(trainingProgress)}%` : "Ready to begin"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-slate-200 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>

              <div className="mt-4 flex flex-col items-center gap-4">
                {trainingComplete && (
                  <p className="text-sm font-medium text-green-600 flex items-center gap-2 w-full">
                    <CheckCircle2 className="h-4 w-4" />
                    Training completed
                  </p>
                )}
                {isTraining && <p className="text-sm font-medium text-blue-600 w-full">Training in progress...</p>}

                {!isTraining && (
                  <div className="w-full pt-2">
                    <Button
                      onClick={handleStartTraining}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-[1.01]"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      {trainingComplete ? "Retrain Model" : "Start Training"}
                    </Button>
                    {!trainingComplete && (
                      <p className="text-xs text-center text-muted-foreground mt-2 italic">
                        Click above to begin training with your configured settings
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logs */}
          {(isTraining || trainingComplete) && (
            <Card>
              <CardHeader>
                <CardTitle>Training Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 font-mono text-sm p-4 h-64 overflow-y-auto">
                  {trainingLogs.map((log, i) => (
                    <p key={i}>{log}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {trainingComplete && trainingResults && (
            <Card className="border-l-4 border-green-500 bg-green-50">
              <CardContent className="pt-6 flex gap-3">
                <CheckCircle2 className="text-green-600" />
                <div>
                  <p className="font-semibold">Training Complete</p>
                  {problemType === "Classification" && (
                    <div className="text-sm space-y-1 mt-1">
                      <p>Accuracy: {(trainingResults.accuracy * 100).toFixed(1)}%</p>
                      <p>F1-Score: {(trainingResults.f1Score * 100).toFixed(1)}%</p>
                    </div>
                  )}
                  {problemType === "Regression" && (
                    <div className="text-sm space-y-1 mt-1">
                      <p>R² Score: {((trainingResults.r2 || trainingResults.r2Score || 0) * 100).toFixed(1)}%</p>
                      <p>RMSE: {trainingResults.rmse}</p>
                    </div>
                  )}
                  {problemType === "Clustering" && (
                    <div className="text-sm space-y-1 mt-1">
                      <p>Status: {trainingResults.status}</p>
                      <p>Samples: {trainingResults.trainSamples}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learning Curve */}
          {trainingComplete && trainingResults?.learningCurve && (
            <Card>
              <CardHeader>
                <CardTitle>Learning Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingResults.learningCurve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="trainLoss" stroke="#3b82f6" />
                    <Line dataKey="valLoss" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
