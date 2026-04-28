"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, Plus, Trash2, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Column {
  id: string
  name: string
  dataType: "numeric" | "categorical" | "text"
}

interface CreateDatasetModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (dataset: any) => void
}

export default function CreateDatasetModal({ isOpen, onClose, onCreate }: CreateDatasetModalProps) {
  const [datasetName, setDatasetName] = useState("")
  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<Record<string, any>[]>([])
  const [step, setStep] = useState<"name" | "schema" | "data">("name")
  const [error, setError] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState("")
  const [newColumnType, setNewColumnType] = useState<"numeric" | "categorical" | "text">("numeric")

  if (!isOpen) return null

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      setError("Column name cannot be empty")
      return
    }

    if (columns.some((c) => c.name.toLowerCase() === newColumnName.toLowerCase())) {
      setError("Column name already exists")
      return
    }

    setColumns([...columns, { id: Date.now().toString(), name: newColumnName, dataType: newColumnType }])
    setNewColumnName("")
    setNewColumnType("numeric")
    setError(null)
  }

  const handleRemoveColumn = (columnId: string) => {
    setColumns(columns.filter((c) => c.id !== columnId))
    setRows(
      rows.map((row) => {
        const newRow = { ...row }
        delete newRow[columnId]
        return newRow
      }),
    )
  }

  const handleAddRow = () => {
    const newRow: Record<string, any> = {}
    columns.forEach((col) => {
      newRow[col.id] = ""
    })
    setRows([...rows, newRow])
  }

  const handleRemoveRow = (rowIndex: number) => {
    setRows(rows.filter((_, i) => i !== rowIndex))
  }

  const handleUpdateCell = (rowIndex: number, columnId: string, value: any) => {
    const newRows = [...rows]
    newRows[rowIndex] = { ...newRows[rowIndex], [columnId]: value }
    setRows(newRows)
  }

  const validateData = (): boolean => {
    if (!datasetName.trim()) {
      setError("Dataset name is required")
      return false
    }

    if (columns.length === 0) {
      setError("At least one column is required")
      return false
    }

    if (rows.length === 0) {
      setError("At least one row of data is required")
      return false
    }

    // Validate data types
    for (let i = 0; i < rows.length; i++) {
      for (const col of columns) {
        const value = rows[i][col.id]

        if (!value && value !== 0) {
          setError(`Row ${i + 1}, Column "${col.name}": Empty value not allowed`)
          return false
        }

        if (col.dataType === "numeric") {
          if (isNaN(Number(value))) {
            setError(`Row ${i + 1}, Column "${col.name}": Value must be numeric`)
            return false
          }
        }
      }
    }

    setError(null)
    return true
  }

  const handleCreate = () => {
    if (!validateData()) return

    // Convert to CSV format
    const headers = columns.map((c) => c.name).join(",")
    const dataRows = rows.map((row) => columns.map((col) => row[col.id]).join(",")).join("\n")
    const csvContent = `${headers}\n${dataRows}`

    const newDataset = {
      id: Date.now(),
      name: datasetName,
      size: (csvContent.length / 1024).toFixed(2) + " KB",
      uploadedAt: new Date().toLocaleDateString(),
      type: "created",
      rows: rows.length,
      cols: columns.length,
      samples: rows.length,
      features: columns.length,
      content: csvContent,
      columns: columns,
    }

    onCreate(newDataset)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setDatasetName("")
    setColumns([])
    setRows([])
    setStep("name")
    setError(null)
    setNewColumnName("")
    setNewColumnType("numeric")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Create Dataset Manually</CardTitle>
            <CardDescription>Define schema and enter data for your custom dataset</CardDescription>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Dataset Name */}
          {step === "name" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dataset Name</label>
                <Input
                  placeholder="e.g., My Custom Dataset"
                  value={datasetName}
                  onChange={(e) => {
                    setDatasetName(e.target.value)
                    setError(null)
                  }}
                  className="w-full"
                />
              </div>
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (datasetName.trim()) {
                      setStep("schema")
                      setError(null)
                    } else {
                      setError("Dataset name is required")
                    }
                  }}
                >
                  Next: Define Columns
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Define Columns/Schema */}
          {step === "schema" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Dataset Name: {datasetName}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Add Columns</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Column name"
                    value={newColumnName}
                    onChange={(e) => {
                      setNewColumnName(e.target.value)
                      setError(null)
                    }}
                  />
                  <Select value={newColumnType} onValueChange={(value: any) => setNewColumnType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numeric</SelectItem>
                      <SelectItem value="categorical">Categorical</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddColumn} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              </div>

              {/* Column List */}
              {columns.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Columns ({columns.length})</h3>
                  <div className="grid gap-2">
                    {columns.map((col) => (
                      <div key={col.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{col.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{col.dataType}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveColumn(col.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep("name")}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (columns.length > 0) {
                      setStep("data")
                      setError(null)
                    } else {
                      setError("At least one column is required")
                    }
                  }}
                >
                  Next: Enter Data
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Enter Data */}
          {step === "data" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Dataset: {datasetName}</p>
                <p className="text-xs text-blue-700 mt-1">Columns: {columns.map((c) => c.name).join(", ")}</p>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="font-medium">Data Entry ({rows.length} rows)</h3>
                <Button onClick={handleAddRow} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3 text-left font-medium w-12">Row</th>
                      {columns.map((col) => (
                        <th key={col.id} className="p-3 text-left font-medium">
                          {col.name}
                        </th>
                      ))}
                      <th className="p-3 text-left font-medium w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-muted-foreground">{rowIndex + 1}</td>
                        {columns.map((col) => (
                          <td key={col.id} className="p-3">
                            <input
                              type={col.dataType === "numeric" ? "number" : "text"}
                              value={row[col.id] || ""}
                              onChange={(e) => handleUpdateCell(rowIndex, col.id, e.target.value)}
                              placeholder="Enter value"
                              className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </td>
                        ))}
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveRow(rowIndex)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No data rows yet. Click "Add Row" to start entering data.
                  </p>
                  <Button onClick={handleAddRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Row
                  </Button>
                </div>
              )}

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep("schema")}>
                  Back
                </Button>
                <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                  Create Dataset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
