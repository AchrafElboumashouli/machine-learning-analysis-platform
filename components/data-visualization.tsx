"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, LineChart, ScatterChart, PieChart } from "lucide-react"

interface DataVisualizationProps {
  dataset: any
}

export default function DataVisualization({ dataset }: DataVisualizationProps) {
  const chartTypes = [
    { id: "bar", label: "Bar Chart", icon: BarChart3 },
    { id: "line", label: "Line Chart", icon: LineChart },
    { id: "scatter", label: "Scatter Plot", icon: ScatterChart },
    { id: "pie", label: "Pie Chart", icon: PieChart },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Data Visualization</h1>
        <p className="text-muted-foreground">Visualize and explore your dataset patterns</p>
      </div>

      {!dataset ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Dataset Selected</p>
            <p className="text-muted-foreground text-center">Upload a dataset first to visualize your data</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Visualization Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chartTypes.map((chart) => {
              const Icon = chart.icon
              return (
                <Card key={chart.id} className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-3">
                      <Icon className="h-8 w-8 text-blue-500" />
                      <p className="font-semibold text-center">{chart.label}</p>
                      <Button size="sm" className="w-full">
                        Create
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Sample Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Data Distribution</CardTitle>
              <CardDescription>Feature statistics and distribution analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <p className="text-slate-500 font-semibold mb-2">Visualization Preview</p>
                  <p className="text-sm text-slate-400">Charts will be rendered here based on your dataset</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Preprocessing */}
          <Card>
            <CardHeader>
              <CardTitle>Data Preprocessing</CardTitle>
              <CardDescription>Clean, normalize, and handle missing values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-semibold text-foreground mb-2">Handle Missing Values</p>
                  <select className="w-full border rounded px-3 py-2 text-sm">
                    <option>Drop rows</option>
                    <option>Fill with mean</option>
                    <option>Fill with median</option>
                    <option>Forward fill</option>
                  </select>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-semibold text-foreground mb-2">Feature Scaling</p>
                  <select className="w-full border rounded px-3 py-2 text-sm">
                    <option>None</option>
                    <option>StandardScaler</option>
                    <option>MinMaxScaler</option>
                    <option>RobustScaler</option>
                  </select>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-semibold text-foreground mb-2">Outlier Detection</p>
                  <select className="w-full border rounded px-3 py-2 text-sm">
                    <option>None</option>
                    <option>Z-Score</option>
                    <option>IQR Method</option>
                    <option>Isolation Forest</option>
                  </select>
                </div>
              </div>
              <Button className="w-full mt-4">Apply Preprocessing</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
