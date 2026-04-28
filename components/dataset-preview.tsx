"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Database } from "lucide-react"

interface DatasetPreviewProps {
  data: Array<Record<string, any>>
  headers: string[]
  title?: string
  maxRows?: number
}

export function DatasetPreview({ data, headers, title = "Dataset Preview", maxRows = 5 }: DatasetPreviewProps) {
  if (!data || data.length === 0 || !headers || headers.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="py-8 text-center">
          <Database className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No data available to preview</p>
        </CardContent>
      </Card>
    )
  }

  const previewData = data.slice(0, maxRows)

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          {title}
        </CardTitle>
        <p className="text-xs text-gray-600 mt-1">
          Showing {previewData.length} of {data.length} rows
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHead>
              <TableRow className="bg-blue-100 hover:bg-blue-100">
                {headers.map((header) => (
                  <TableHeader key={header} className="text-xs font-semibold text-blue-900 h-8 p-2">
                    {header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-blue-100/50">
                  {headers.map((header) => (
                    <TableCell key={`${idx}-${header}`} className="text-xs p-2 text-gray-700">
                      {typeof row[header] === "number" ? row[header].toFixed(4) : String(row[header] || "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
