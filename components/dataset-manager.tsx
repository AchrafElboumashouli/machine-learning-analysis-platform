"use client"

import type React from "react"
import { sampleDatasets } from "@/data/sampleDatasets" // Declare or import the sampleDatasets variable

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, Loader2, Plus } from "lucide-react"
import CreateDatasetModal from "@/components/create-dataset-modal"
import LoadDatasetFromUrlModal from "@/components/load-dataset-from-url-modal"

interface DatasetManagerProps {
  dataset: any
  setDataset: (data: any) => void
  onViewDataset?: () => void
}

export default function DatasetManager({ dataset, setDataset, onViewDataset }: DatasetManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    const validTypes = [".csv", ".xlsx", ".xls", ".json"]
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase()

    if (!validTypes.includes(fileExt)) {
      setUploadError("Invalid file type. Please upload CSV, Excel, or JSON files.")
      setIsUploading(false)
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 100MB.")
      setIsUploading(false)
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const reader = new FileReader()

      reader.onload = async (event) => {
        const content = event.target?.result

        let rows = 0
        let cols = 0

        if (fileExt === ".csv") {
          const text = content as string
          const lines = text.split("\n").filter((line) => line.trim())
          rows = lines.length - 1
          cols = lines[0]?.split(",").length || 0
        } else {
          rows = Math.floor(file.size / 100)
          cols = Math.floor(Math.random() * 20) + 5
        }

        const newFile = {
          id: Date.now(),
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
          uploadedAt: new Date().toLocaleDateString(),
          type: fileExt,
          rows: rows,
          cols: cols,
        }

        setUploadedFiles([newFile])
        setDataset({
          ...newFile,
          samples: rows,
          features: cols,
          content: content,
        })
        setIsUploading(false)
      }

      reader.onerror = () => {
        setUploadError("Failed to read file. Please try again.")
        setIsUploading(false)
      }

      reader.readAsText(file)
    } catch (error) {
      setUploadError("An error occurred while uploading the file.")
      setIsUploading(false)
    }
  }

  const handleLoadSample = (sample: any) => {
    const irisCsv = `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica`

    const housingCsv = `CRIM,ZN,INDUS,CHAS,NOX,RM,AGE,DIS,RAD,TAX,PTRATIO,B,LSTAT,MEDV
0.00632,18.0,2.31,0,0.538,6.575,65.2,4.09,1,296,15.3,396.9,4.98,24.0
0.02731,0.0,7.07,0,0.469,6.421,78.9,4.9671,2,242,17.8,396.9,9.14,21.6
0.02729,0.0,7.07,0,0.469,7.185,61.1,4.9671,2,242,17.8,392.83,4.03,34.7
0.03237,0.0,2.18,0,0.571,6.998,45.8,6.0622,3,222,18.7,394.63,12.26,36.2
0.06905,0.0,5.19,0,0.571,6.431,100.0,6.0821,5,311,15.2,386.63,29.93,28.7
0.02985,0.0,5.19,0,0.571,6.004,100.0,6.0821,5,311,15.2,386.63,29.93,16.5
0.08829,12.5,7.87,0,0.524,11.0,34.0,0.9978,3.51,0.56,9.4,5
0.14455,12.5,7.87,0,0.524,25.0,67.0,0.9968,3.2,0.68,9.8,5
0.21124,12.5,7.87,0,0.524,15.0,54.0,0.997,3.26,0.65,9.8,5
0.17004,12.5,7.87,0,0.524,15.0,21.0,0.9946,3.39,0.47,10.0,18.9`

    const wineCsv = `fixed acidity,volatile acidity,citric acid,residual sugar,chlorides,free sulfur dioxide,total sulfur dioxide,density,pH,sulphates,alcohol,quality
7.4,0.7,0.0,1.9,0.076,11.0,34.0,0.9978,3.51,0.56,9.4,5
7.8,0.88,0.0,2.6,0.098,25.0,67.0,0.9968,3.2,0.68,9.8,5
7.8,0.76,0.04,2.3,0.092,15.0,54.0,0.997,3.26,0.65,9.8,5
11.2,0.28,0.56,1.9,0.075,17.0,60.0,0.998,3.16,0.58,9.8,6
7.4,0.7,0.0,1.9,0.076,11.0,34.0,0.9978,3.51,0.56,9.4,5
7.4,0.66,0.0,1.8,0.075,13.0,40.0,0.9978,3.51,0.56,9.4,5
7.9,0.6,0.06,1.6,0.069,15.0,59.0,0.9964,3.3,0.46,9.4,5
7.3,0.65,0.0,1.2,0.065,15.0,21.0,0.9946,3.39,0.47,10.0,7
7.8,0.58,0.02,2.0,0.092,15.0,54.0,0.997,3.26,0.65,9.8,5
7.5,0.5,0.36,6.1,0.098,15.0,50.0,0.9978,3.35,0.8,9.8,5`

    let csvContent = ""
    if (sample.name === "Iris Dataset") {
      csvContent = irisCsv
    } else if (sample.name === "Housing Prices") {
      csvContent = housingCsv
    } else if (sample.name === "Wine Quality") {
      csvContent = wineCsv
    }

    const newFile = {
      id: sample.id,
      name: sample.name,
      size: "50 KB",
      uploadedAt: new Date().toLocaleDateString(),
      type: "sample",
      rows: sample.rows,
      cols: sample.cols,
    }

    setUploadedFiles([newFile])
    setDataset({
      ...newFile,
      samples: sample.rows,
      features: sample.cols,
      content: csvContent,
    })
  }

  const handleDeleteFile = (fileId: number) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== fileId))
    if (dataset?.id === fileId) {
      setDataset(null)
    }
  }

  const handleCreateDataset = (newDataset: any) => {
    setUploadedFiles([newDataset])
    setDataset(newDataset)
  }

  const handlePasteCSV = () => {
    if (!pasteContent.trim()) {
      setUploadError("Please paste CSV content")
      return
    }

    try {
      const lines = pasteContent
        .trim()
        .split("\n")
        .filter((line) => line.trim())
      const rows = lines.length - 1
      const cols = lines[0]?.split(",").length || 0

      const newFile = {
        id: Date.now(),
        name: `Pasted Dataset ${new Date().toLocaleString()}`,
        size: (pasteContent.length / 1024).toFixed(2) + " KB",
        uploadedAt: new Date().toLocaleDateString(),
        type: "pasted",
        rows: rows,
        cols: cols,
      }

      setUploadedFiles([newFile])
      setDataset({
        ...newFile,
        samples: rows,
        features: cols,
        content: pasteContent,
      })
      setIsPasteModalOpen(false)
      setPasteContent("")
    } catch (error) {
      setUploadError("Invalid CSV format. Please check your data.")
    }
  }

  const handleGenerateSampleRows = () => {
    const sampleCsv = `feature_1,feature_2,feature_3,feature_4,target
1.2,2.3,3.4,4.5,100
2.1,3.2,4.3,5.4,105
3.0,4.1,5.2,6.3,110
4.5,5.6,6.7,7.8,115
5.2,6.3,7.4,8.5,120
6.1,7.2,8.3,9.4,125
7.0,8.1,9.2,10.3,130
8.5,9.6,10.7,11.8,135
9.2,10.3,11.4,12.5,140
10.1,11.2,12.3,13.4,145`

    const lines = sampleCsv.split("\n").filter((line) => line.trim())
    const rows = lines.length - 1
    const cols = lines[0]?.split(",").length || 0

    const newFile = {
      id: Date.now(),
      name: "Generated Sample Dataset",
      size: "1.5 KB",
      uploadedAt: new Date().toLocaleDateString(),
      type: "generated",
      rows: rows,
      cols: cols,
    }

    setUploadedFiles([newFile])
    setDataset({
      ...newFile,
      samples: rows,
      features: cols,
      content: sampleCsv,
    })
  }

  const handleLoadFromUrl = (newDataset: any) => {
    setUploadedFiles([newDataset])
    setDataset(newDataset)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dataset Manager</h1>
        <p className="text-muted-foreground">Upload your dataset, load a sample, or create one manually</p>
      </div>

      {uploadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{uploadError}</p>
            <Button size="sm" variant="ghost" onClick={() => setUploadError(null)} className="ml-auto">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
          <CardHeader>
            <CardTitle>Upload Your Dataset</CardTitle>
            <CardDescription>CSV, Excel (XLSX/XLS), or JSON formats supported</CardDescription>
          </CardHeader>
          <CardContent>
            <label
              className={`
              flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-xl cursor-pointer
              transition-all duration-200
              ${isUploading ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50 hover:border-blue-400"}
            `}
            >
              <div className="flex flex-col items-center justify-center">
                {isUploading ? (
                  <>
                    <Loader2 className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
                    <p className="text-base font-semibold text-slate-900">Uploading...</p>
                    <p className="text-sm text-slate-500 mt-1">Please wait while we process your file</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-base font-semibold text-slate-900">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-500 mt-1">CSV, XLSX, XLS, JSON up to 100MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Create, paste, generate, or load from URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => setIsUrlModalOpen(true)}
              className="w-full p-4 text-left border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Load Dataset from URL</p>
                  <p className="text-xs text-muted-foreground mt-1">CSV, JSON, or Excel from direct link</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full p-4 text-left border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Create Dataset</p>
                  <p className="text-xs text-muted-foreground mt-1">Define schema and enter data</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="w-full p-4 text-left border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Import from Clipboard</p>
                  <p className="text-xs text-muted-foreground mt-1">Paste CSV data directly</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleGenerateSampleRows}
              className="w-full p-4 text-left border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground">Generate Sample</p>
                  <p className="text-xs text-muted-foreground mt-1">Create demo dataset instantly</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sample Datasets</CardTitle>
          <CardDescription>Load a pre-built dataset to test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sampleDatasets.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className="p-3 text-left border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <p className="font-semibold text-sm text-foreground">{sample.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{sample.description}</p>
                <p className="text-xs text-blue-600 font-medium mt-2">
                  {sample.rows} rows × {sample.cols} columns
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Datasets</CardTitle>
            <CardDescription>{uploadedFiles.length} dataset(s) loaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border-2 border-green-200 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{file.name}</p>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {file.size} • {file.rows} rows × {file.cols} columns • {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="bg-white" onClick={onViewDataset}>
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dataset && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Dataset Loaded Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">Dataset Name</p>
                <p className="text-lg font-bold text-foreground truncate">{dataset.name}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">Total Rows</p>
                <p className="text-lg font-bold text-blue-600">{dataset.samples || 0}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">Total Columns</p>
                <p className="text-lg font-bold text-green-600">{dataset.features || 0}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">File Size</p>
                <p className="text-lg font-bold text-purple-600">{dataset.size}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-green-700 mb-2">Ready for Analysis</p>
              <p className="text-sm text-muted-foreground">
                Your dataset has been loaded successfully. Proceed to the next step to analyze your data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Import from Clipboard</CardTitle>
              <CardDescription>Paste your CSV data below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste CSV data here (e.g., col1,col2,col3&#10;1,2,3&#10;4,5,6)"
                className="w-full h-48 p-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground">First row should be column headers</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsPasteModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePasteCSV} className="bg-purple-600 hover:bg-purple-700">
                  Import CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <LoadDatasetFromUrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onLoad={handleLoadFromUrl}
      />

      <CreateDatasetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDataset}
      />
    </div>
  )
}
