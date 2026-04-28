"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { AlertCircle } from "lucide-react"

interface ClassificationChartsProps {
  visualizationData: any
  activeTab: string
}

const ChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload[0]) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        {Object.entries(data).map(([key, value]) => (
          <p key={key} className="text-xs text-gray-700">
            <span className="font-semibold">{key}:</span> {typeof value === "number" ? value.toFixed(4) : value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ClassificationCharts({ visualizationData, activeTab }: ClassificationChartsProps) {
  // Transform confusion matrix
  const confusionMatrix = visualizationData.confusionMatrix || [
    [0, 0],
    [0, 0],
  ]
  const confusionMatrixData = [
    { label: "True Negative", value: confusionMatrix[0]?.[0] || 0, color: "#10b981" },
    { label: "False Positive", value: confusionMatrix[0]?.[1] || 0, color: "#ef4444" },
    { label: "False Negative", value: confusionMatrix[1]?.[0] || 0, color: "#f59e0b" },
    { label: "True Positive", value: confusionMatrix[1]?.[1] || 0, color: "#3b82f6" },
  ]

  const rocData = (visualizationData.rocCurve || [])
    .filter((point: any) => point && typeof point === "object" && "fpr" in point && "tpr" in point)
    .map((point: any) => ({
      fpr: Number.parseFloat(point.fpr) || 0,
      tpr: Number.parseFloat(point.tpr) || 0,
    }))


  const prData = (visualizationData.precisionRecallCurve || [])
    .filter((point: any) => point && typeof point === "object" && "recall" in point && "precision" in point)
    .map((point: any) => ({
      recall: Number.parseFloat(point.recall) || 0,
      precision: Number.parseFloat(point.precision) || 0,
    }))



  // Prediction probability distribution
  const probData = visualizationData.predictionProbabilities || []
  const probBins = Array.from({ length: 10 }, (_, i) => {
    const min = i * 0.1
    const max = (i + 1) * 0.1
    const count = probData.filter((p: number) => p >= min && p < max).length
    return {
      range: `${min.toFixed(1)}-${max.toFixed(1)}`,
      count,
    }
  })

  return (
    <Tabs value={activeTab}>
      {/* Confusion Matrix */}
      <TabsContent value="confusion" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Confusion Matrix Heatmap</CardTitle>
            <CardDescription>Detailed breakdown of classification predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="border-2 border-green-500 p-4 rounded text-center bg-green-50">
                <p className="text-sm text-muted-foreground">True Negative</p>
                <p className="text-3xl font-bold text-green-600">{confusionMatrix[0]?.[0] || 0}</p>
              </div>
              <div className="border-2 border-red-500 p-4 rounded text-center bg-red-50">
                <p className="text-sm text-muted-foreground">False Positive</p>
                <p className="text-3xl font-bold text-red-600">{confusionMatrix[0]?.[1] || 0}</p>
              </div>
              <div className="border-2 border-yellow-500 p-4 rounded text-center bg-yellow-50">
                <p className="text-sm text-muted-foreground">False Negative</p>
                <p className="text-3xl font-bold text-yellow-600">{confusionMatrix[1]?.[0] || 0}</p>
              </div>
              <div className="border-2 border-blue-500 p-4 rounded text-center bg-blue-50">
                <p className="text-sm text-muted-foreground">True Positive</p>
                <p className="text-3xl font-bold text-blue-600">{confusionMatrix[1]?.[1] || 0}</p>
              </div>
            </div>

            {/* Confusion Matrix Bar Chart */}
            <div className="mt-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={confusionMatrixData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {confusionMatrixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ROC Curve */}
      <TabsContent value="roc" className="space-y-6 mt-6">
        {rocData.length === 0 ? (
          <>
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 font-semibold">No ROC Curve Data</p>
                <p className="text-sm text-muted-foreground mt-2">
                  ROC curve requires probability predictions for binary classification
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>ROC Curve</CardTitle>
              <CardDescription>Receiver Operating Characteristic</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={rocData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fpr" label={{ value: "False Positive Rate", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "True Positive Rate", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tpr"
                    stroke="#3b82f6"
                    dot={false}
                    isAnimationActive={false}
                    name="ROC Curve"
                  />
                  <Line
                    type="monotone"
                    dataKey={() => {
                      // Diagonal reference line
                      return undefined
                    }}
                    stroke="#9ca3af"
                    strokeDasharray="5 5"
                    dot={false}
                    name="Random Classifier"
                  />
                </LineChart>
              </ResponsiveContainer>
              {visualizationData.rocAuc !== null && visualizationData.rocAuc !== undefined && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-semibold">AUC Score: {visualizationData.rocAuc.toFixed(3)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Precision-Recall Curve */}
      <TabsContent value="precision-recall" className="space-y-6 mt-6">
        {prData.length === 0 ? (
          <>
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 font-semibold">No Precision-Recall Data</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Precision-Recall curve requires probability predictions for binary classification
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Precision-Recall Curve</CardTitle>
              <CardDescription>Trade-off between Precision and Recall</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={prData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="recall" label={{ value: "Recall", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Precision", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="precision"
                    stroke="#f59e0b"
                    dot={false}
                    isAnimationActive={false}
                    name="PR Curve"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Probability Distribution */}
      <TabsContent value="probability-dist" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Prediction Probability Distribution</CardTitle>
            <CardDescription>Distribution of predicted probabilities across samples</CardDescription>
          </CardHeader>
          <CardContent>
            {probBins.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={probBins}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No probability data available
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
