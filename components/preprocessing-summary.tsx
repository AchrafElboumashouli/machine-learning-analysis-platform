"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ArrowRight, X, Settings } from "lucide-react"

interface PreprocessingStep {
  id: string
  name: string
  enabled: boolean
  method?: string
  icon: React.ReactNode
}

interface PreprocessingSummaryProps {
  steps: PreprocessingStep[]
  onToggleStep: (stepId: string) => void
  onEdit: (stepId: string) => void
  onContinue: () => void
}

export default function PreprocessingSummary({ steps, onToggleStep, onEdit, onContinue }: PreprocessingSummaryProps) {
  const enabledSteps = steps.filter((s) => s.enabled)

  return (
    <div className="space-y-6">
      {/* Pipeline Visualization */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-blue-600" />
            Data Transformation Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    step.enabled
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-100 border-2 border-gray-300 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {step.enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-center whitespace-nowrap">{step.name}</span>
                  {step.method && (
                    <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded truncate max-w-[80px]">
                      {step.method}
                    </span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className={`h-5 w-5 ${enabledSteps.length > 0 ? "text-blue-500" : "text-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Steps Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Transformations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {enabledSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No transformations selected. Your data will be used as-is.
            </p>
          ) : (
            <ul className="space-y-2">
              {enabledSteps.map((step) => (
                <li
                  key={step.id}
                  className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.name}</p>
                      {step.method && (
                        <p className="text-xs text-muted-foreground capitalize">{step.method.replace(/_/g, " ")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(step.id)} className="h-7 px-2 text-xs">
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStep(step.id)}
                      className="h-7 px-2 text-xs hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Skip Buttons */}
      {enabledSteps.some((s) => s.id === "encoding") && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm mb-3 text-amber-900">
              Skip encoding to keep categorical features in their original form.
            </p>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => onToggleStep("encoding")}>
              Skip Encoding
            </Button>
          </CardContent>
        </Card>
      )}

      {enabledSteps.some((s) => s.id === "normalization") && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm mb-3 text-amber-900">Skip normalization to use raw numeric values.</p>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => onToggleStep("normalization")}>
              Skip Normalization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <Button className="w-full h-12 text-base font-semibold" onClick={onContinue}>
        Continue to Target Selection
      </Button>
    </div>
  )
}
