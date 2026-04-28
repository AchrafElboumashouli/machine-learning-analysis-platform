"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Table, AlertCircle } from "lucide-react"
import { useState, useMemo } from "react"

interface ViewPreprocessedDatasetProps {
  dataset: any
  dataStats: any
  preprocessingConfig: {
    missingValueStrategy: "mean" | "median" | "drop" | "forward_fill" | "no_change"
    encodingMethod: "onehot" | "ordinal" | "label" | "no_change"
    scalingMethod: "standard" | "minmax" | "none"
  }
  onBack: () => void
  targetVariable?: string | null
}

export default function ViewPreprocessedDataset({
  dataset,
  dataStats,
  preprocessingConfig,
  onBack,
  targetVariable,
}: ViewPreprocessedDatasetProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Parse original CSV data
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

  // Apply preprocessing transformations (excluding target column)
  const preprocessedData = useMemo(() => {
    if (parsedData.rows.length === 0) {
      return parsedData
    }

    let transformedRows = JSON.parse(JSON.stringify(parsedData.rows))
    let transformedHeaders = [...parsedData.headers]

    console.log("¬ ViewPreprocessedDataset - targetVariable:", targetVariable)
    console.log("¬ Original headers before filtering:", transformedHeaders)

    const targetColumnName = targetVariable || null

    // Step 1: Handle missing values (skip target column)
    if (preprocessingConfig.missingValueStrategy !== "no_change") {
      transformedRows = transformedRows.map((row: any) => {
        const newRow = { ...row }
        transformedHeaders.forEach((header: string) => {
          if (header === targetColumnName) return

          if (newRow[header] === "" || newRow[header] === null || newRow[header] === undefined) {
            if (preprocessingConfig.missingValueStrategy === "drop") {
              return null
            } else if (
              preprocessingConfig.missingValueStrategy === "mean" ||
              preprocessingConfig.missingValueStrategy === "median"
            ) {
              const numericValues = transformedRows
                .map((r: any) => {
                  const val = Number.parseFloat(r[header])
                  return isNaN(val) ? null : val
                })
                .filter((v: any) => v !== null)

              if (numericValues.length > 0) {
                if (preprocessingConfig.missingValueStrategy === "mean") {
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
            } else if (preprocessingConfig.missingValueStrategy === "forward_fill") {
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

      transformedRows = transformedRows.filter((row: any) => row !== null)
    }

    // Step 2: Handle categorical encoding (skip target column)
    if (preprocessingConfig.encodingMethod !== "no_change") {
      const categoricalColumns: { [key: string]: string[] } = {}

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
        if (preprocessingConfig.encodingMethod === "onehot") {
          const newHeaders: string[] = []
          const newRows: any[] = transformedRows.map(() => ({}))

          transformedHeaders.forEach((header: string) => {
            if (header === targetColumnName) {
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
        } else if (preprocessingConfig.encodingMethod === "ordinal") {
          Object.entries(categoricalColumns).forEach(([header, values]: [string, string[]]) => {
            const valueMap = Object.fromEntries(values.map((v: string, i: number) => [v, i + 1]))
            transformedRows.forEach((row: any) => {
              row[header] = valueMap[row[header]] || 0
            })
          })
        } else if (preprocessingConfig.encodingMethod === "label") {
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
    if (preprocessingConfig.scalingMethod !== "none") {
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
          if (preprocessingConfig.scalingMethod === "standard") {
            const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length
            const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / values.length
            const std = Math.sqrt(variance)

            transformedRows.forEach((row: any) => {
              if (std !== 0) {
                row[header] = ((Number.parseFloat(row[header]) - mean) / std).toFixed(4)
              }
            })
          } else if (preprocessingConfig.scalingMethod === "minmax") {
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
    const allHeaders = transformedHeaders
    const displayRows = transformedRows.map((row: any) => {
      const newRow: any = {}
      allHeaders.forEach((header: string) => {
        newRow[header] = row[header]
      })
      return newRow
    })

    console.log("¬ Feature headers (normalized):", featureHeaders)
    console.log("¬ Target column (not normalized):", targetColumnName)
    console.log("¬ All headers for display:", allHeaders)

    return { headers: allHeaders, rows: displayRows }
  }, [parsedData, preprocessingConfig, targetVariable])

  const displayData = useMemo(() => {
    if (preprocessedData.rows.length === 0) {
      return preprocessedData
    }

    return preprocessedData
  }, [preprocessedData])

  const filteredAndSortedData = useMemo(() => {
    let data = [...displayData.rows]

    if (searchTerm) {
      data = data.filter((row: any) =>
        Object.values(row).some((value: any) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (sortColumn) {
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

    return data
  }, [displayData.rows, searchTerm, sortColumn, sortOrder])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredAndSortedData.slice(start, end)
  }, [filteredAndSortedData, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortOrder("asc")
    }
  }

  if (!dataset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
            <Table className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Dataset Selected</p>
            <p className="text-muted-foreground text-center">Upload a dataset first to view preprocessed data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Preprocessed Dataset</h1>
          <p className="text-muted-foreground mt-1">View your dataset after applying preprocessing transformations</p>
        </div>
      </div>

      {/* Dataset Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Dataset Name</p>
            <p className="text-lg font-bold text-foreground truncate">{dataset.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Rows</p>
            <p className="text-lg font-bold text-blue-600">{displayData.rows.length.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Columns</p>
            <p className="text-lg font-bold text-green-600">{displayData.headers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">File Size</p>
            <p className="text-lg font-bold text-purple-600">{dataset.size}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-teal-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Status</p>
            <p className="text-lg font-bold text-teal-600">Preprocessed</p>
          </CardContent>
        </Card>
      </div>

      {/* Preprocessing Summary */}
      <Card className="border-l-4 border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Applied Transformations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground font-medium">Missing Values Strategy:</span>
            <span className="text-blue-700 font-semibold">
              {preprocessingConfig.missingValueStrategy.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground font-medium">Categorical Encoding:</span>
            <span className="text-blue-700 font-semibold">{preprocessingConfig.encodingMethod.replace(/_/g, " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground font-medium">Feature Scaling:</span>
            <span className="text-blue-700 font-semibold">{preprocessingConfig.scalingMethod}</span>
          </div>
          {targetVariable && (
            <div className="flex justify-between pt-2 border-t border-blue-200">
              <span className="text-foreground font-medium">Target Column :</span>
              <span className="text-blue-700 font-semibold">{targetVariable}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Preprocessed Features Table
              </CardTitle>
              <CardDescription className="mt-2">
                Showing {paginatedData.length} of {filteredAndSortedData.length} rows
                {searchTerm && ` (filtered from ${displayData.rows.length} total)`}
                <span className="text-xs text-amber-600 ml-2">(Target column excluded from preprocessing)</span>
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

          {/* Search Bar */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search in preprocessed dataset..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border rounded-lg text-sm bg-background text-foreground border-border placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </CardHeader>

        <CardContent>
          {displayData.headers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-muted-foreground mr-3" />
              <p className="text-muted-foreground">Unable to parse dataset. Please check the file format.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b">
                    <tr>
                      {displayData.headers.map((header: string) => (
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
                          colSpan={displayData.headers.length}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No data found matching your search
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="border-b hover:bg-muted/50 transition-colors">
                          {displayData.headers.map((header: string) => (
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
                <div className="flex items-center justify-between mt-6">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
