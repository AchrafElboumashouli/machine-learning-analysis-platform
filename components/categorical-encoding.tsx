"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, ArrowRight, SkipForward, X, Zap } from "lucide-react"

interface CategoricalEncodingProps {
  dataset: any
  targetVariable?: string | null
  onEncodingComplete: (encodedData: any) => void
  onSkipEncoding?: () => void
}

interface SuccessModalProps {
  isOpen: boolean
  title: string
  message: string
  result: any
  onClose: () => void
  onContinue: () => void
  datasetHead?: any[]
  headers?: string[]
}

function EncodingSuccessModal({
  isOpen,
  title,
  message,
  result,
  onClose,
  onContinue,
  datasetHead,
  headers,
}: SuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-2xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-900">{title}</CardTitle>
          </div>
          <button onClick={onClose} className="text-green-600 hover:text-green-800">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-800 font-medium">{message}</p>

          <div className="bg-white rounded-lg p-4 space-y-3 border border-green-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Encoding Details</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Method</p>
                  <p className="text-xs text-gray-600">{result.encoding_method}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Columns</p>
                  <p className="text-xs text-gray-600">{result.categorical_columns?.length || 0} encoded</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Original</p>
                  <p className="text-xs text-gray-600">{result.original_features} features</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Final</p>
                  <p className="text-xs text-gray-600">{result.encoded_features} features</p>
                </div>
              </div>
            </div>

            {result.categorical_columns && result.categorical_columns.length > 0 && (
              <div className="pt-2 border-t border-green-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Encoded Columns</p>
                <div className="flex flex-wrap gap-2">
                  {result.categorical_columns.map((col: string) => (
                    <Badge key={col} variant="secondary" className="bg-green-100 text-green-800">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {datasetHead && headers && (
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Dataset Preview</p>
              <div className="overflow-x-auto max-h-48 bg-white rounded border border-green-200 p-3">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {headers.slice(0, 8).map((h) => (
                        <th key={h} className="text-left px-2 py-1 font-semibold text-gray-700">
                          {h}
                        </th>
                      ))}
                      {headers.length > 8 && <th className="text-left px-2 py-1 font-semibold text-gray-500">...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {datasetHead.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        {headers.slice(0, 8).map((h) => (
                          <td key={`${idx}-${h}`} className="px-2 py-1 text-gray-600">
                            {typeof row[h] === "number" ? row[h].toFixed(4) : String(row[h] || "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Close
            </Button>
            <Button onClick={onContinue} className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md">
              Continue to Normalization
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CategoricalEncoding({
  dataset,
  targetVariable,
  onEncodingComplete,
  onSkipEncoding,
}: CategoricalEncodingProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isEncoding, setIsEncoding] = useState(false)
  const [encodingComplete, setEncodingComplete] = useState(false)
  const [encodingResult, setEncodingResult] = useState<any>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const encodingMethods = [
    {
      id: "label",
      name: "Label Encoding",
      description: "Converts categories to integer labels (0, 1, 2, ...)",
      whenToUse: "Tree-based models (Decision Trees, Random Forest)",
      pros: "Simple, memory efficient, preserves single column",
      cons: "May imply ordering between categories",
      recommended: true,
    },
    {
      id: "onehot",
      name: "One-Hot Encoding",
      description: "Creates binary columns for each category",
      whenToUse: "Linear models (Linear/Logistic Regression, SVM, Neural Networks)",
      pros: "No ordinal relationship, works well with linear models",
      cons: "Increases dimensionality, can cause memory issues",
    },
    {
      id: "ordinal",
      name: "Ordinal Encoding",
      description: "Assigns integers based on category order",
      whenToUse: "When categories have natural ordering (small < medium < large)",
      pros: "Preserves meaningful order, memory efficient",
      cons: "Requires known category hierarchy",
    },
  ]

  const handleEncode = async () => {
    if (!selectedMethod || !dataset?.content) return

    setIsEncoding(true)

    try {
      const response = await fetch("/api/encode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: dataset.content,
          encodingMethod: selectedMethod,
          targetColumn: targetVariable,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Encoding failed")
      }

      const result = await response.json()

      if (result.success) {
        setEncodingResult(result)
        setEncodingComplete(true)
        setShowSuccessModal(true)

        onEncodingComplete({
          ...dataset,
          content: result.encoded_data,
          encodingInfo: result,
        })
      } else {
        throw new Error(result.error || "Encoding failed")
      }
    } catch (error: any) {
      console.error("Encoding error:", error)
      alert(error.message || "Failed to encode categorical features")
    } finally {
      setIsEncoding(false)
    }
  }

  const handleSkipEncoding = () => {
    onEncodingComplete(dataset)
    if (onSkipEncoding) {
      onSkipEncoding()
    }
  }

  if (!dataset) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">No Dataset Available</p>
        </CardContent>
      </Card>
    )
  }

  if (encodingComplete && encodingResult) {
    return (
      <div className="space-y-6 relative">
        {showSuccessModal && (
          <EncodingSuccessModal
            isOpen={showSuccessModal}
            title="Encoding Complete"
            message="Your categorical features have been encoded successfully. You can now proceed to normalization."
            result={encodingResult}
            onClose={() => setShowSuccessModal(false)}
            onContinue={() => setShowSuccessModal(false)}
            datasetHead={dataset.head}
            headers={dataset.headers}
          />
        )}

        <Card className="border-l-4 border-green-500 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle>Encoding Complete</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{encodingResult.message}</p>
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
              <div>
                <p className="text-xs text-muted-foreground">Method Used</p>
                <p className="font-semibold">{encodingResult.encoding_method}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Columns Encoded</p>
                <p className="font-semibold">{encodingResult.categorical_columns?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Original Features</p>
                <p className="font-semibold">{encodingResult.original_features}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Final Features</p>
                <p className="font-semibold">{encodingResult.encoded_features}</p>
              </div>
            </div>
            {encodingResult.categorical_columns && encodingResult.categorical_columns.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Encoded Columns:</p>
                <div className="flex flex-wrap gap-2">
                  {encodingResult.categorical_columns.map((col: string) => (
                    <Badge key={col} variant="secondary">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4 bg-transparent"
              onClick={() => {
                setEncodingComplete(false)
                setSelectedMethod(null)
                setEncodingResult(null)
              }}
            >
              Choose Different Method
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Categorical Feature Encoding</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkipEncoding}
          className="text-muted-foreground hover:text-foreground bg-transparent"
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Skip Encoding
        </Button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <strong>Encoding is now automatic:</strong> Categorical features are encoded during the unified training
            pipeline, ensuring proper handling with train/test split.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
