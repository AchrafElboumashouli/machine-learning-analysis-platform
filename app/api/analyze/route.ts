import { type NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import { writeFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

export async function POST(request: NextRequest) {
  let tmpFile: string | null = null

  try {
    const { csvContent } = await request.json()

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json({ error: "CSV content is required and must be a string" }, { status: 400 })
    }

    tmpFile = join(tmpdir(), `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.csv`)
    writeFileSync(tmpFile, csvContent, "utf-8")

    try {
      const result = execSync(`python3 scripts/analysis.py "${tmpFile}"`, {
        encoding: "utf-8",
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      })

      const stats = JSON.parse(result)
      return NextResponse.json(stats)
    } catch (execError: any) {
      console.error("Python execution error:", execError.message)
      return NextResponse.json({ error: "Analysis failed: " + (execError.message || "Unknown error") }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 })
  } finally {
    if (tmpFile) {
      try {
        unlinkSync(tmpFile)
      } catch (e) {
        console.error("Cleanup error:", e)
      }
    }
  }
}
