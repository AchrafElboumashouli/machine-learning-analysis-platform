"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ScatterChart,
  Scatter,
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
import { useMemo } from "react"

interface ClusteringChartsProps {
  visualizationData: any
  activeTab: string
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f97316", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"]

export default function ClusteringCharts({ visualizationData, activeTab }: ClusteringChartsProps) {
  // Cluster data (2D coordinates)
  const clusterData = Array.isArray(visualizationData?.clusterPlot)
    ? visualizationData.clusterPlot.map((point: any, idx: number) => {
      // Handle both {x, y, label} and [x, y, label] formats
      if (Array.isArray(point)) {
        return {
          x: point[0] || 0,
          y: point[1] || 0,
          cluster: point[2] || visualizationData?.clusterLabels?.[idx] || 0,
          index: idx,
        }
      }
      return {
        x: point.x || 0,
        y: point.y || 0,
        cluster: point.label || point.cluster || visualizationData?.clusterLabels?.[idx] || 0,
        index: idx,
      }
    })
    : []

  // Cluster distribution
  const clusterDistribution = Array.isArray(visualizationData?.clusterDistribution)
    ? visualizationData.clusterDistribution.map((item: any) => ({
      cluster: `Cluster ${item.cluster ?? item.id ?? 0}`,
      samples: item.size ?? item.count ?? item.samples ?? 0,
    }))
    : Object.entries(visualizationData?.clusterDistribution || {}).map(([clusterId, count]: [string, any]) => ({
      cluster: `Cluster ${clusterId}`,
      samples: typeof count === "object" ? count.size || count.count || 0 : count || 0,
    }))
  const sharedAxisDomain = useMemo(() => {
    if (!Array.isArray(visualizationData?.clusterPlot)) {
      return { x: ["auto", "auto"], y: ["auto", "auto"] }
    }

    const xs = visualizationData.clusterPlot.map((p: any) => p.x)
    const ys = visualizationData.clusterPlot.map((p: any) => p.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    // Add small padding so points don’t touch borders
    const padX = (maxX - minX) * 0.05
    const padY = (maxY - minY) * 0.05

    return {
      x: [minX - padX, maxX + padX],
      y: [minY - padY, maxY + padY],
    }
  }, [visualizationData])

  // Silhouette scores by cluster
  const silhouetteByCluster =
    clusterData.length > 0
      ? clusterData
        .reduce((acc: any[], point: any) => {
          const clusterIdx = point.cluster
          if (!acc[clusterIdx]) {
            acc[clusterIdx] = { cluster: `Cluster ${clusterIdx}`, scores: [], meanScore: 0 }
          }
          // Get per-sample silhouette value for this point
          const sampleScore = Array.isArray(visualizationData?.silhouetteValues)
            ? visualizationData.silhouetteValues[point.index] || 0
            : 0
          acc[clusterIdx].scores.push(sampleScore)
          return acc
        }, [])
        .map((item: any) => ({
          cluster: item.cluster,
          score:
            item.scores.length > 0 ? item.scores.reduce((a: number, b: number) => a + b, 0) / item.scores.length : 0,
        }))
      : []

  const numClusters =
    visualizationData?.numClusters ||
    (clusterData.length > 0 ? Math.max(...clusterData.map((d: any) => d.cluster)) + 1 : clusterDistribution.length)
  const centroidPlotData = Array.isArray(visualizationData?.clusterCenters)
    ? visualizationData.clusterCenters
      .map((center: any, idx: number) => {
        if (!Array.isArray(center) || center.length < 2) return null
        return {
          x: center[0],
          y: center[1],
          cluster: idx,
        }
      })
      .filter(Boolean)
    : []

  // ---- Centroid overlay data (same coordinate space) ----
  const centroidScatterData = Array.isArray(visualizationData?.clusterCenters)
    ? visualizationData.clusterCenters
      .map((center: any, idx: number) => {
        if (!Array.isArray(center) || center.length < 2) return null
        return {
          x: center[0],
          y: center[1],
          cluster: idx,
        }
      })
      .filter(Boolean)
    : []
  return (
    <Tabs value={activeTab}>
      {/* Cluster Plot (2D) */}
      <TabsContent value="clusters" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>2D Cluster Visualization</CardTitle>
            <CardDescription>Cluster assignments in 2D projection space (PCA)</CardDescription>
          </CardHeader>
          <CardContent>
            {clusterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    label={{ value: "Component 1", position: "insideBottomRight", offset: -5 }}
                    type="number"
                    dataKey="x"
                  />
                  <YAxis
                    label={{ value: "Component 2", angle: -90, position: "insideLeft" }}
                    type="number"
                    dataKey="y"
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 border border-gray-300 dark:border-slate-600 rounded shadow">
                            <p className="text-xs">Cluster: {data.cluster}</p>
                            <p className="text-xs">x: {data.x.toFixed(2)}</p>
                            <p className="text-xs">y: {data.y.toFixed(2)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend />
                  {Array.from({ length: numClusters }).map((_, clusterIdx) => (
                    <Scatter
                      key={clusterIdx}
                      name={`Cluster ${clusterIdx}`}
                      data={clusterData.filter((d: any) => d.cluster === clusterIdx)}
                      fill={COLORS[clusterIdx % COLORS.length]}
                      fillOpacity={0.7}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No cluster data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cluster Centers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cluster Centers</CardTitle>
            <CardDescription>Centroid coordinates for each cluster</CardDescription>
          </CardHeader>
          <CardContent>
            {/* ---------- Centroid Plot (same coordinate space) ---------- */}
            {centroidPlotData.length > 0 && (
              <div className="mb-6 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="Component 1" />
                    <YAxis type="number" dataKey="y" name="Component 2" />
                    <Tooltip />

                    <Scatter
                      name="Centroids"
                      data={centroidPlotData}
                      shape="diamond"
                    >
                      {centroidPlotData.map((c: any, i: number) => (
                        <Cell
                          key={`centroid-${i}`}
                          fill={COLORS[c.cluster % COLORS.length]}
                          stroke="#000"
                          strokeWidth={1.5}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ---------- EXISTING CARDS (UNCHANGED) ---------- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(visualizationData.clusterCenters || []).map((center: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border"
                  style={{
                    borderColor: COLORS[idx % COLORS.length],
                    backgroundColor: COLORS[idx % COLORS.length] + "10",
                  }}
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Cluster {idx}
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    [{Array.isArray(center) ? center.map((v: number) => v.toFixed(2)).join(", ") : "N/A"}]
                  </p>
                </div>
              ))}
            </div>
          </CardContent>

        </Card>
      </TabsContent>

      {/* Silhouette Scores */}
      <TabsContent value="silhouette" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Silhouette Scores by Cluster</CardTitle>
            <CardDescription>Higher scores indicate better-defined clusters (range: -1 to 1)</CardDescription>
          </CardHeader>
          <CardContent>
            {silhouetteByCluster.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={silhouetteByCluster}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cluster" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" name="Silhouette Score">
                    {silhouetteByCluster.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                No silhouette score data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overall Silhouette */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-card rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Mean Silhouette</p>
                <p className="text-2xl font-bold text-primary">
                  {visualizationData.silhouetteScore?.toFixed(4) || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Davies-Bouldin</p>
                <p className="text-2xl font-bold text-accent">
                  {visualizationData.daviesBouldinIndex?.toFixed(4) || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Calinski-Harabasz</p>
                <p className="text-2xl font-bold text-chart-3">
                  {visualizationData.calinskiHarabaszScore?.toFixed(2) || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Cluster Distribution */}
      <TabsContent value="distribution" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Cluster Size Distribution</CardTitle>
            <CardDescription>Number of samples assigned to each cluster</CardDescription>
          </CardHeader>
          <CardContent>
            {clusterDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clusterDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cluster" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="samples" fill="#f97316" name="Sample Count">
                    {clusterDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                No distribution data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cluster Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Cluster Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clusterDistribution.map((cluster: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-semibold text-foreground">{cluster.cluster}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{cluster.samples} samples</p>
                    <p className="text-xs text-muted-foreground">
                      {(
                        (cluster.samples / clusterDistribution.reduce((sum: number, c: any) => sum + c.samples, 0)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
