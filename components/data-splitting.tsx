"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DataSplittingProps {
  dataset: any
  targetVariable: string | null
  trainSplitPercentage: number
  setTrainSplitPercentage: (value: number) => void
  onSplitConfirm: () => void
}

export default function DataSplitting({
  dataset,
  targetVariable,
  trainSplitPercentage,
  setTrainSplitPercentage,
  onSplitConfirm,
}: DataSplittingProps) {
  const testSplitPercentage = 100 - trainSplitPercentage
  const totalSamples = dataset?.samples || 1000
  const trainSamples = Math.floor((trainSplitPercentage / 100) * totalSamples)
  const testSamples = totalSamples - trainSamples

  const chartData = [
    {
      name: "Training",
      value: trainSamples,
      percentage: trainSplitPercentage,
    },
    {
      name: "Testing",
      value: testSamples,
      percentage: testSplitPercentage,
    },
  ]

  const presets = [
    { label: "70-30", train: 70 },
    { label: "75-25", train: 75 },
    { label: "80-20", train: 80 },
    { label: "85-15", train: 85 },
    { label: "90-10", train: 90 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Configure Data Splitting</h1>
        <p className="text-muted-foreground">Choose how to split your data for training and testing</p>
      </div>

      {!dataset || !targetVariable ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">Missing Requirements</p>
            <p className="text-muted-foreground text-center">
              Complete: Upload dataset → Analyze → Select target → Configure split
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Preset Buttons */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Quick Presets</CardTitle>
              <CardDescription>Select a common train/test split ratio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant={trainSplitPercentage === preset.train ? "default" : "outline"}
                    onClick={() => setTrainSplitPercentage(preset.train)}
                    className="px-4 py-2"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Slider */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Split Ratio</CardTitle>
              <CardDescription>Use the slider to set a custom training/testing split</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-foreground">Training Percentage</label>
                  <span className="text-2xl font-bold text-blue-600">{trainSplitPercentage}%</span>
                </div>
                <Slider
                  value={[trainSplitPercentage]}
                  onValueChange={(value) => setTrainSplitPercentage(value[0])}
                  min={10}
                  max={90}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10% min</span>
                  <span>90% max</span>
                </div>
              </div>

              {/* Split Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Training Data</p>
                    <p className="text-2xl font-bold text-blue-600">{trainSplitPercentage}%</p>
                    <p className="text-xs text-muted-foreground mt-2">{trainSamples.toLocaleString()} samples</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Testing Data</p>
                    <p className="text-2xl font-bold text-red-600">{testSplitPercentage}%</p>
                    <p className="text-xs text-muted-foreground mt-2">{testSamples.toLocaleString()} samples</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Data Split Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Data Split Visualization</CardTitle>
              <CardDescription>Visual representation of your training/testing split</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [
                      `${value.toLocaleString()} samples`,
                      value instanceof Number ? "Count" : "name",
                    ]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Split Configuration Details */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Configuration Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Total Samples</p>
                  <p className="text-lg font-bold text-foreground">{totalSamples.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Train Samples</p>
                  <p className="text-lg font-bold text-blue-600">{trainSamples.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Test Samples</p>
                  <p className="text-lg font-bold text-red-600">{testSamples.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Train %</p>
                  <p className="text-lg font-bold text-blue-600">{trainSplitPercentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Test %</p>
                  <p className="text-lg font-bold text-red-600">{testSplitPercentage}%</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-sm text-blue-900">
                  ✓ Your model will be trained on {trainSamples.toLocaleString()} samples and tested on{" "}
                  {testSamples.toLocaleString()} samples to ensure unbiased evaluation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Confirm Button */}
          <Button
            onClick={onSplitConfirm}
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] hover:shadow-lg hover:shadow-green-500/20"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Confirm Split & Proceed to Training
          </Button>
        </>
      )}
    </div>
  )
}
