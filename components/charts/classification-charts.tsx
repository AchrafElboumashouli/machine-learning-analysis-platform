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
import { useMemo } from "react"

interface ClassificationChartsProps {
  visualizationData: any
  activeTab: string
}

/* ---------------- Tooltip ---------------- */

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null

  const data = payload[0].payload

  return (
    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
      {Object.entries(data).map(([key, value]) => {
        if (typeof value !== "number" && typeof value !== "string") return null
        return (
          <p key={key} className="text-xs text-gray-700">
            <span className="font-semibold">{key}:</span>{" "}
            {typeof value === "number" ? value.toFixed(4) : value}
          </p>
        )
      })}
    </div>
  )
}

/* ---------------- Component ---------------- */

export default function ClassificationCharts({
  visualizationData,
  activeTab,
}: ClassificationChartsProps) {

  /* ---------- Confusion Matrix ---------- */

  const confusionMatrix = visualizationData?.confusionMatrix || [
    [0, 0],
    [0, 0],
  ]

  const confusionMatrixData = [
    { label: "True Negative", value: confusionMatrix[0]?.[0] || 0, color: "#10b981" },
    { label: "False Positive", value: confusionMatrix[0]?.[1] || 0, color: "#ef4444" },
    { label: "False Negative", value: confusionMatrix[1]?.[0] || 0, color: "#f59e0b" },
    { label: "True Positive", value: confusionMatrix[1]?.[1] || 0, color: "#3b82f6" },
  ]

  /* ---------- ROC Curve ---------- */

  const rocData = useMemo(() => {
    return (visualizationData?.rocCurve || [])
      .filter((p: any) => p && "fpr" in p && "tpr" in p)
      .map((p: any) => ({
        fpr: Number(p.fpr) || 0,
        tpr: Number(p.tpr) || 0,
      }))
      .sort((a: any, b: any) => a.fpr - b.fpr)
  }, [visualizationData])

  const rocBaseline = useMemo(() => {
    return rocData.map((p: any) => ({
      fpr: p.fpr,
      tpr: p.fpr,
    }))
  }, [rocData])

  /* ---------- Precision–Recall ---------- */

  const prData = useMemo(() => {
    return (visualizationData?.precisionRecallCurve || [])
      .filter((p: any) => p && "recall" in p && "precision" in p)
      .map((p: any) => ({
        recall: Number(p.recall) || 0,
        precision: Number(p.precision) || 0,
      }))
      .sort((a: any, b: any) => a.recall - b.recall)
  }, [visualizationData])

  /* ---------- Probability Distribution ---------- */

  const probBins = useMemo(() => {
    const probs = visualizationData?.predictionProbabilities || []
    if (probs.length === 0) return []

    const binCount = Math.max(5, Math.round(Math.sqrt(probs.length)))
    const binSize = 1 / binCount

    return Array.from({ length: binCount }, (_, i) => {
      const min = i * binSize
      const max = min + binSize
      return {
        range: `${min.toFixed(2)} – ${max.toFixed(2)}`,
        count: probs.filter((p: number) => p >= min && p < max).length,
      }
    })
  }, [visualizationData])

  /* ================= RENDER ================= */

  return (
    <Tabs value={activeTab}>

      {/* ---------------- Confusion Matrix ---------------- */}
      <TabsContent value="confusion" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Confusion Matrix</CardTitle>
            <CardDescription>Classification outcome breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {confusionMatrixData.map((c) => (
                <div
                  key={c.label}
                  className="border-2 p-4 rounded text-center"
                  style={{ borderColor: c.color, backgroundColor: `${c.color}15` }}
                >
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-3xl font-bold">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={confusionMatrixData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {confusionMatrixData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ---------------- ROC Curve ---------------- */}
      <TabsContent value="roc" className="space-y-6 mt-6">
        {rocData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-semibold">No ROC Data</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>ROC Curve</CardTitle>
              <CardDescription>True vs False Positive Rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fpr" type="number" domain={[0, 1]} />
                  <YAxis type="number" domain={[0, 1]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line data={rocData} dataKey="tpr" stroke="#3b82f6" dot={false} name="Model" />
                  <Line data={rocBaseline} dataKey="tpr" stroke="#9ca3af" strokeDasharray="5 5" dot={false} name="Random" />
                </LineChart>
              </ResponsiveContainer>
              {visualizationData?.rocAuc != null && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-semibold">
                    AUC: {visualizationData.rocAuc.toFixed(3)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ---------------- Precision Recall ---------------- */}
      <TabsContent value="precision-recall" className="space-y-6 mt-6">
        {prData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-semibold">No PR Data</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Precision–Recall Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={prData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="recall" type="number" domain={[0, 1]} />
                  <YAxis type="number" domain={[0, 1]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line dataKey="precision" stroke="#f59e0b" dot={false} name="PR Curve" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* ---------------- Probability Distribution ---------------- */}
      <TabsContent value="probability-dist" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Prediction Probability Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={probBins}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  )
}
