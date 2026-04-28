import { type NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "import_data.py")
    const result = execSync(`python ${scriptPath}`, { encoding: "utf-8" })
    return NextResponse.json(JSON.parse(result))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
