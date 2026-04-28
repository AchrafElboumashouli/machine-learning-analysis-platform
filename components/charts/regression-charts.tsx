"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ScatterChart,
  Scatter,
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
  ReferenceLine,
} from "recharts"

interface RegressionChartsProps {
  visualizationData: any
  activeTab: string
}

export default function RegressionCharts({ visualizationData, activeTab }: RegressionChartsProps) {
  // Transform actual vs predicted data
  const actualPredictedData =
    visualizationData?.yTrue?.map((actual: number, idx: number) => ({
      index: idx,
      actual,
      predicted: visualizationData.yPred?.[idx] || 0,
    })) || []

  // Calculate residuals
  const residualsData =
    visualizationData?.yTrue?.map((actual: number, idx: number) => {
      const predicted = visualizationData.yPred?.[idx] || 0
      return {
        index: idx,
        residual: actual - predicted,
      }
    }) || []

  // Calculate error distribution with defensive checks
 

  // Helper function for safe metric display
  const formatMetric = (value: number | undefined): string => {
    return typeof value === "number" ? value.toFixed(4) : "N/A"
  }
  // Absolute errors
  const errors =
    visualizationData?.yTrue?.map((actual: number, idx: number) => {
      const predicted = visualizationData?.yPred?.[idx] ?? 0
      return Math.abs(actual - predicted)
    }) || []

  // Dynamic bin count (√n rule)
  const binCount = Math.max(5, Math.round(Math.sqrt(errors.length || 1)))

  const maxError = errors.length > 0 ? Math.max(...errors) : 1
  const binSize = maxError / binCount

  const errorBins = Array.from({ length: binCount }, (_, i) => {
    const min = i * binSize
    const max = min + binSize
    const count = errors.filter((e: number) => e >= min && e < max).length

    return {
      range: `${min.toFixed(1)} - ${max.toFixed(1)}`,
      count,
    }
  })

  // Helper function to get sorted median
  const getMedianError = (): string => {
    if (errors.length === 0) return "N/A"
    const sorted = [...errors].sort((a: number, b: number) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return formatMetric(median)
  }

  return (
    <Tabs value={activeTab}>
      {/* Actual vs Predicted */}
      <TabsContent value="actual-predicted" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Actual vs Predicted Values</CardTitle>
            <CardDescription>Scatter plot showing the relationship between actual and predicted values</CardDescription>
          </CardHeader>
          <CardContent>
            {actualPredictedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="actual"
                    name="Actual"
                    label={{ value: "Actual Values", position: "insideBottomRight", offset: -5 }}
                  />

                  <YAxis
                    dataKey="predicted"
                    name="Predicted"
                    label={{ value: "Predicted Values", angle: -90, position: "insideLeft" }}
                  />

                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />

                  <Scatter
                    name="Predictions"
                    data={actualPredictedData}
                    xKey="actual"
                    yKey="predicted"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />

                  {/* Optional: perfect fit line */}
                  <ReferenceLine y={0} stroke="#808080" />
                </ScatterChart>
              </ResponsiveContainer>

            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No prediction data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actual vs Predicted Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Actual vs Predicted Trend</CardTitle>
            <CardDescription>Time series view of actual and predicted values</CardDescription>
          </CardHeader>
          <CardContent>
            {actualPredictedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={actualPredictedData.slice(0, 100)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#f97316" strokeWidth={2} name="Predicted" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Residuals */}
      <TabsContent value="residuals" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Residuals Plot</CardTitle>
            <CardDescription>Residuals (Actual - Predicted) to identify patterns in prediction errors</CardDescription>
          </CardHeader>
          <CardContent>
            {residualsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="index"
                    label={{ value: "Sample Index", position: "insideBottomRight", offset: -5 }}
                  />

                  <YAxis
                    dataKey="residual"
                    label={{ value: "Residual Value", angle: -90, position: "insideLeft" }}
                  />

                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />

                  <Scatter
                    name="Residuals"
                    data={residualsData}
                    xKey="index"
                    yKey="residual"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />

                  <ReferenceLine y={0} stroke="#808080" strokeDasharray="5 5" />
                </ScatterChart>

              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No residual data available
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Error Distribution */}
      <TabsContent value="error-dist" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Distribution Histogram</CardTitle>
            <CardDescription>
              Frequency distribution of absolute prediction errors
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorBins.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={errorBins}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="range"
                    label={{ value: "Error Range", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    label={{ value: "Frequency", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    name="Frequency"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No error distribution data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Error Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Min Error</p>
                <p className="text-lg font-bold text-foreground">
                  {errors.length > 0 ? formatMetric(Math.min(...errors)) : "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Max Error</p>
                <p className="text-lg font-bold text-foreground">
                  {errors.length > 0 ? formatMetric(Math.max(...errors)) : "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Mean Error</p>
                <p className="text-lg font-bold text-foreground">
                  {errors.length > 0
                    ? formatMetric(errors.reduce((a: number, b: number) => a + b, 0) / errors.length)
                    : "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Median Error</p>
                <p className="text-lg font-bold text-foreground">{getMedianError()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
