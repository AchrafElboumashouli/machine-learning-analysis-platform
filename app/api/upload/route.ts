import { type NextRequest, NextResponse } from "next/server"
import { writeFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { execSync } from "child_process"

export async function POST(request: NextRequest) {
  try {
    const { csvContent } = await request.json()

    if (!csvContent) {
      return NextResponse.json({ error: "CSV content is required" }, { status: 400 })
    }

    const tmpFile = join(tmpdir(), `data_${Date.now()}.csv`)
    writeFileSync(tmpFile, csvContent)

    try {
      const scriptPath = join(process.cwd(), "scripts", "import_data.py")
      const result = execSync(`python3 ${scriptPath} ${tmpFile}`, { encoding: "utf-8", cwd: process.cwd() })

      const parsed = JSON.parse(result)
      return NextResponse.json(parsed)
    } finally {
      try {
        unlinkSync(tmpFile)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
