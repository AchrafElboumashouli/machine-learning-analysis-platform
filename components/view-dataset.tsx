"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Table, AlertCircle } from "lucide-react"
import { useState, useMemo } from "react"

interface ViewDatasetProps {
  dataset: any
  dataStats: any
  onBack: () => void
  preprocessingStatus?: string
}

export default function ViewDataset({ dataset, dataStats, onBack, preprocessingStatus }: ViewDatasetProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Parse CSV data
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

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let data = [...parsedData.rows]

    // Apply search filter
    if (searchTerm) {
      data = data.filter((row: any) =>
        Object.values(row).some((value: any) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Apply sorting
    if (sortColumn) {
      data.sort((a: any, b: any) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]

        // Try numeric comparison
        const aNum = Number.parseFloat(aVal)
        const bNum = Number.parseFloat(bVal)

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum
        }

        // String comparison
        return sortOrder === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
      })
    }

    return data
  }, [parsedData.rows, searchTerm, sortColumn, sortOrder])

  // Paginate data
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

  const getColumnInfo = (columnName: string) => {
    if (!dataStats?.columnAnalysis) return null
    return dataStats.columnAnalysis.find((col: any) => col.column === columnName)
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
            <p className="text-muted-foreground text-center">Upload a dataset first to view its contents</p>
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
          <h1 className="text-3xl font-bold text-foreground">Dataset Preview</h1>
          <p className="text-muted-foreground mt-1">View the current version of your dataset</p>
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
            <p className="text-lg font-bold text-blue-600">{parsedData.rows.length.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Columns</p>
            <p className="text-lg font-bold text-green-600">{parsedData.headers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">File Size</p>
            <p className="text-lg font-bold text-purple-600">{dataset.size}</p>
          </CardContent>
        </Card>
        {preprocessingStatus && (
          <Card className="border-l-4 border-orange-500">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Preprocessing</p>
              <p className="text-lg font-bold text-orange-600">{preprocessingStatus}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Data Table
              </CardTitle>
              <CardDescription className="mt-2">
                Showing {paginatedData.length} of {filteredAndSortedData.length} rows
                {searchTerm && ` (filtered from ${parsedData.rows.length} total)`}
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
              placeholder="Search in dataset..."
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
          {parsedData.headers.length === 0 ? (
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
                      {parsedData.headers.map((header: string) => (
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
                        <td colSpan={parsedData.headers.length} className="px-4 py-8 text-center text-muted-foreground">
                          No data found matching your search
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="border-b hover:bg-muted/50 transition-colors">
                          {parsedData.headers.map((header: string) => (
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

      {/* Column Details */}
      {dataStats?.columnAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Column Information</CardTitle>
            <CardDescription>Data types and characteristics of each column</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parsedData.headers.map((header: string) => {
                const columnInfo = dataStats.columnAnalysis.find((col: any) => col.column === header)

                if (!columnInfo) return null

                return (
                  <div key={header} className="p-4 bg-muted rounded-lg border">
                    <p className="font-semibold text-foreground mb-3">{header}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium text-foreground">{columnInfo.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Count:</span>
                        <span className="font-medium text-foreground">{columnInfo.count}</span>
                      </div>
                      {columnInfo.missing > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Missing:</span>
                          <span className="font-medium text-red-600">{columnInfo.missing}</span>
                        </div>
                      )}
                      {columnInfo.type === "Numeric" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mean:</span>
                            <span className="font-medium text-foreground">{columnInfo.mean?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Range:</span>
                            <span className="font-medium text-foreground">
                              [{columnInfo.min?.toFixed(2)}, {columnInfo.max?.toFixed(2)}]
                            </span>
                          </div>
                        </>
                      )}
                      {columnInfo.type === "Categorical" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unique:</span>
                          <span className="font-medium text-foreground">{columnInfo.unique}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
