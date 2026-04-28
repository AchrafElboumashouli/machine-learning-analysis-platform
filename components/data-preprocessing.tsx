"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, CheckCircle, Table } from "lucide-react"

interface PreprocessingConfig {
  missingValueStrategy: "mean" | "median" | "drop" | "forward_fill" | "no_change"
  encodingMethod: "onehot" | "ordinal" | "label" | "no_change"
  scalingMethod: "standard" | "minmax" | "none"
}

interface DataPreprocessingProps {
  dataset: any
  dataStats: any
  currentConfig: PreprocessingConfig
  onConfigUpdate: (config: PreprocessingConfig) => void
  onViewPreprocessedDataset?: () => void
  targetVariable?: string | null
  onPreprocessedDatasetReady?: (preprocessedData: any) => void
}

const DataPreprocessing: React.FC<DataPreprocessingProps> = ({
  dataset,
  dataStats,
  currentConfig,
  onConfigUpdate,
  onViewPreprocessedDataset,
  targetVariable,
  onPreprocessedDatasetReady,
}) => {
  const [localConfig, setLocalConfig] = useState<PreprocessingConfig>(currentConfig)
  const [isConfigured, setIsConfigured] = useState(false)
  const [showDatasetPreview, setShowDatasetPreview] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const parsedData = useMemo(() => {
    if (!dataset?.content) return { headers: [], rows: [] }

    try {
      const lines = dataset.content.trim().split("\n")
      if (lines.length < 2) return { headers: [], rows: [] }

      const headers = lines[0].split(",").map((h: string) => h.trim().replace(/['"]/g, ""))
      const rows = lines.slice(1).map((line: string) => {
        const values = line.split(",").map((v: string) => v.trim().replace(/['"]/g, ""))
        const row: any = {}
        headers.forEach((header: string, idx: number) => {
          row[header] = values[idx] || ""
        })
        return row
      })

      return { headers, rows }
    } catch (error) {
      console.error("Error parsing CSV:", error)
      return { headers: [], rows: [] }
    }
  }, [dataset?.content])

  const preprocessedData = useMemo(() => {
    if (parsedData.rows.length === 0 || !isConfigured) {
      return parsedData
    }

    let transformedRows = JSON.parse(JSON.stringify(parsedData.rows))
    let transformedHeaders = [...parsedData.headers]

    console.log("¬ DataPreprocessing - targetVariable:", targetVariable)
    console.log("¬ DataPreprocessing - isConfigured:", isConfigured)

    const targetColumnName = targetVariable || null

    // Step 1: Handle missing values (skip target column)
    if (localConfig.missingValueStrategy !== "no_change") {
      transformedRows = transformedRows.map((row: any) => {
        const newRow = { ...row }
        transformedHeaders.forEach((header: string) => {
          if (header === targetColumnName) return

          if (newRow[header] === "" || newRow[header] === null || newRow[header] === undefined) {
            if (localConfig.missingValueStrategy === "drop") {
              return null
            } else if (localConfig.missingValueStrategy === "mean" || localConfig.missingValueStrategy === "median") {
              const numericValues = transformedRows
                .map((r: any) => {
                  const val = Number.parseFloat(r[header])
                  return isNaN(val) ? null : val
                })
                .filter((v: any) => v !== null)

              if (numericValues.length > 0) {
                if (localConfig.missingValueStrategy === "mean") {
                  newRow[header] = (
                    numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length
                  ).toFixed(2)
                } else {
                  numericValues.sort((a: number, b: number) => a - b)
                  const mid = Math.floor(numericValues.length / 2)
                  newRow[header] = (
                    numericValues.length % 2 !== 0
                      ? numericValues[mid]
                      : (numericValues[mid - 1] + numericValues[mid]) / 2
                  ).toFixed(2)
                }
              }
            } else if (localConfig.missingValueStrategy === "forward_fill") {
              // Find previous non-empty value
              for (let i = transformedRows.indexOf(row) - 1; i >= 0; i--) {
                if (transformedRows[i][header] !== "" && transformedRows[i][header] !== null) {
                  newRow[header] = transformedRows[i][header]
                  break
                }
              }
            }
          }
        })
        return newRow
      })

      // Remove null rows (from drop strategy)
      transformedRows = transformedRows.filter((row: any) => row !== null)
    }

    // Step 2: Handle categorical encoding (skip target column)
    if (localConfig.encodingMethod !== "no_change") {
      const categoricalColumns: { [key: string]: string[] } = {}

      // Identify categorical columns (excluding target)
      transformedHeaders.forEach((header: string) => {
        if (header === targetColumnName) return

        const sampleValues = transformedRows.slice(0, 10).map((r: any) => r[header])
        const isNumeric = sampleValues.every((v: any) => !isNaN(Number.parseFloat(v)) && v !== "")

        if (!isNumeric) {
          const uniqueValues = [...new Set(transformedRows.map((r: any) => r[header]))]
          if (uniqueValues.length < 20) {
            categoricalColumns[header] = uniqueValues
          }
        }
      })

      if (Object.keys(categoricalColumns).length > 0) {
        if (localConfig.encodingMethod === "onehot") {
          const newHeaders: string[] = []
          const newRows: any[] = transformedRows.map(() => ({}))

          transformedHeaders.forEach((header: string) => {
            if (header === targetColumnName) {
              // Keep target column as-is, not encoded
              newRows.forEach((row: any, idx: number) => {
                row[header] = transformedRows[idx][header]
              })
              newHeaders.push(header)
              return
            }

            if (!categoricalColumns[header]) {
              newHeaders.push(header)
              newRows.forEach((row: any, idx: number) => {
                row[header] = transformedRows[idx][header]
              })
            }
          })

          // Create one-hot columns for categorical (but NOT for target)
          Object.entries(categoricalColumns).forEach(([header, values]: [string, string[]]) => {
            values.forEach((value: string) => {
              const newCol = `${header}_${value}`
              newHeaders.push(newCol)
              newRows.forEach((row: any, idx: number) => {
                row[newCol] = transformedRows[idx][header] === value ? 1 : 0
              })
            })
          })

          transformedHeaders = newHeaders
          transformedRows = newRows
        } else if (localConfig.encodingMethod === "ordinal") {
          Object.entries(categoricalColumns).forEach(([header, values]: [string, string[]]) => {
            const valueMap = Object.fromEntries(values.map((v: string, i: number) => [v, i + 1]))
            transformedRows.forEach((row: any) => {
              row[header] = valueMap[row[header]] || 0
            })
          })
        } else if (localConfig.encodingMethod === "label") {
          Object.entries(categoricalColumns).forEach(([header]: [string, string[]]) => {
            const uniqueValues = [...new Set(transformedRows.map((r: any) => r[header]))]
            const valueMap = Object.fromEntries(uniqueValues.map((v: string, i: number) => [v, i]))
            transformedRows.forEach((row: any) => {
              row[header] = valueMap[row[header]] ?? 0
            })
          })
        }
      }
    }

    // Step 3: Handle feature scaling (SKIP target column COMPLETELY)
    if (localConfig.scalingMethod !== "none") {
      const numericColumns: string[] = []

      transformedHeaders.forEach((header: string) => {
        if (header === targetColumnName) return

        const isNumeric = transformedRows.every((r: any) => !isNaN(Number.parseFloat(r[header])) && r[header] !== "")
        if (isNumeric) {
          numericColumns.push(header)
        }
      })

      numericColumns.forEach((header: string) => {
        const values = transformedRows.map((r: any) => Number.parseFloat(r[header])).filter((v: number) => !isNaN(v))

        if (values.length > 0) {
          if (localConfig.scalingMethod === "standard") {
            const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length
            const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / values.length
            const std = Math.sqrt(variance)

            transformedRows.forEach((row: any) => {
              if (std !== 0) {
                row[header] = ((Number.parseFloat(row[header]) - mean) / std).toFixed(4)
              }
            })
          } else if (localConfig.scalingMethod === "minmax") {
            const min = Math.min(...values)
            const max = Math.max(...values)
            const range = max - min

            transformedRows.forEach((row: any) => {
              if (range !== 0) {
                row[header] = ((Number.parseFloat(row[header]) - min) / range).toFixed(4)
              }
            })
          }
        }
      })
    }

    const featureHeaders = transformedHeaders.filter((header: string) => header !== targetColumnName)
    const featureRows = transformedRows.map((row: any) => {
      const newRow: any = {}
      featureHeaders.forEach((header: string) => {
        newRow[header] = row[header]
      })
      return newRow
    })

    return { headers: featureHeaders, rows: featureRows }
  }, [parsedData, localConfig, isConfigured, targetVariable])

  const displayData = useMemo(() => {
    if (showDatasetPreview && preprocessedData) {
      return preprocessedData
    }
    return null
  }, [preprocessedData, showDatasetPreview])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    const end = start + rowsPerPage

    const data = [...(displayData?.rows || [])]

    // Apply sorting
    if (sortColumn && displayData) {
      data.sort((a: any, b: any) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]

        const aNum = Number.parseFloat(aVal)
        const bNum = Number.parseFloat(bVal)

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum
        }

        return sortOrder === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
      })
    }

    return data.slice(start, end)
  }, [displayData, currentPage, rowsPerPage, sortColumn, sortOrder])

  const totalPages = Math.ceil(displayData?.rows.length / rowsPerPage) || 0

  const handleMissingValueChange = (strategy: "mean" | "median" | "drop" | "forward_fill" | "no_change") => {
    setLocalConfig({ ...localConfig, missingValueStrategy: strategy })
  }

  const handleEncodingChange = (method: "onehot" | "ordinal" | "label" | "no_change") => {
    setLocalConfig({ ...localConfig, encodingMethod: method })
  }

  const handleScalingChange = (method: "standard" | "minmax" | "none") => {
    setLocalConfig({ ...localConfig, scalingMethod: method })
  }

  const handleConfirmSettings = () => {
    onConfigUpdate(localConfig)
    setIsConfigured(true)
    setCurrentPage(1)
    if (onPreprocessedDatasetReady) {
      // The Python script will handle splitting and excluding target from feature scaling
      const headers = preprocessedData.headers
      const csvContent =
        headers.join(",") +
        "\n" +
        preprocessedData.rows.map((row: any) => headers.map((h: string) => row[h]).join(",")).join("\n")

      onPreprocessedDatasetReady({
        ...dataset,
        content: csvContent,
      })
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortOrder("asc")
    }
  }

  const RecommendedBadge = () => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      Recommended
    </span>
  )

  const missingValueOptions = [
    { id: "mean" as const, name: "Mean", description: "Fill with mean value", recommended: true },
    { id: "median" as const, name: "Median", description: "Fill with median value", recommended: false },
    { id: "drop" as const, name: "Drop", description: "Remove rows with missing values", recommended: false },
    { id: "forward_fill" as const, name: "Forward Fill", description: "Fill with previous value", recommended: false },
    { id: "no_change" as const, name: "No Change", description: "Keep missing values as-is", recommended: false },
  ]

  const encodingOptions = [
    {
      id: "onehot" as const,
      name: "One-Hot Encoding",
      description: "Create binary columns (recommended)",
      recommended: true,
    },
    { id: "ordinal" as const, name: "Ordinal Encoding", description: "Assign integer ranks", recommended: false },
    { id: "label" as const, name: "Label Encoding", description: "Simple numeric labels", recommended: false },
    {
      id: "no_change" as const,
      name: "No Change",
      description: "Keep original categorical values",
      recommended: false,
    },
  ]

  const scalingOptions = [
    { id: "standard" as const, name: "Standard Scaler", description: "Mean=0, Std=1 (recommended)", recommended: true },
    { id: "minmax" as const, name: "MinMax Scaler", description: "Scale to [0,1] range", recommended: false },
    { id: "none" as const, name: "No Scaling", description: "Use original values", recommended: false },
  ]

  const OptionCard = ({
    id,
    name,
    description,
    recommended,
    isSelected,
    onClick,
  }: {
    id: string
    name: string
    description: string
    recommended: boolean
    isSelected: boolean
    onClick: () => void
  }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-teal-500 border-2 bg-teal-50 shadow-md" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm font-semibold">{name}</CardTitle>
              {recommended && <RecommendedBadge />}
            </div>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {isSelected && <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />}
        </div>
      </CardHeader>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configure Preprocessing</h1>
        <p className="text-muted-foreground mt-1">
          Preprocessing: {dataset?.name ? dataset.name : "No dataset selected"}
        </p>
      </div>

      {/* Success message now shown at top instead of bottom */}
      {isConfigured && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-700">Preprocessing settings confirmed</span>
        </div>
      )}

      {/* Missing Values Strategy Section */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Missing Values Strategy</h2>
          <p className="text-sm text-muted-foreground mb-4">Choose how to handle missing data in your dataset</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {missingValueOptions.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                name={option.name}
                description={option.description}
                recommended={option.recommended}
                isSelected={localConfig.missingValueStrategy === option.id}
                onClick={() => handleMissingValueChange(option.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Categorical Encoding Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Categorical Encoding</h2>
          <p className="text-sm text-muted-foreground mb-4">Select how to encode categorical variables</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {encodingOptions.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                name={option.name}
                description={option.description}
                recommended={option.recommended}
                isSelected={localConfig.encodingMethod === option.id}
                onClick={() => handleEncodingChange(option.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feature Scaling Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Feature Scaling</h2>
          <p className="text-sm text-muted-foreground mb-4">Choose how to scale numerical features</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scalingOptions.map((option) => (
              <OptionCard
                key={option.id}
                id={option.id}
                name={option.name}
                description={option.description}
                recommended={option.recommended}
                isSelected={localConfig.scalingMethod === option.id}
                onClick={() => handleScalingChange(option.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={handleConfirmSettings}
          className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
        >
          Confirm Preprocessing Settings
        </Button>

        {isConfigured && (
          <Button
            onClick={onViewPreprocessedDataset}
            variant="outline"
            className="w-full h-11 text-base font-semibold gap-2 border border-blue-200 hover:bg-blue-50 text-blue-700 bg-transparent"
          >
            <Eye className="h-4 w-4" />
            View Dataset After Preprocessing (Full Screen)
          </Button>
        )}
      </div>

      {isConfigured && showDatasetPreview && (
        <Card className="border-t-4 border-t-teal-500">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Preprocessed Dataset Preview
                </CardTitle>
                <CardDescription className="mt-2">
                  Showing {paginatedData.length} of {displayData?.rows.length || 0} rows
                </CardDescription>
              </div>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border rounded-lg text-sm font-medium bg-background text-foreground border-border hover:bg-muted transition-colors"
              >
                <option value={5}>5 rows</option>
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Dataset Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Rows</p>
                <p className="text-lg font-bold text-blue-600">{displayData?.rows.length?.toLocaleString() || "N/A"}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Columns</p>
                <p className="text-lg font-bold text-green-600">{displayData?.headers.length || 0}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">File Size</p>
                <p className="text-lg font-bold text-purple-600">{dataset?.size || "N/A"}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg border border-l-4 border-l-teal-500">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Status</p>
                <p className="text-lg font-bold text-teal-600">Preprocessed</p>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b">
                  <tr>
                    {displayData?.headers?.map((header: string) => (
                      <th
                        key={header}
                        onClick={() => handleSort(header)}
                        className="px-4 py-3 text-left font-semibold text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate">{header}</span>
                          {sortColumn === header && (
                            <span className="text-xs font-bold text-blue-600">{sortOrder === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={displayData?.headers.length || 0}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row: any, rowIdx: number) => (
                      <tr key={rowIdx} className="border-b hover:bg-muted/50 transition-colors">
                        {displayData?.headers?.map((header: string) => (
                          <td key={`${rowIdx}-${header}`} className="px-4 py-3 text-foreground">
                            <span className="truncate block" title={String(row[header])}>
                              {row[header] || "-"}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DataPreprocessing
