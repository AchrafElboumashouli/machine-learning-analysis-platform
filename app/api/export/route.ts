import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, modelName = "trained_model", format = "pkl" } = body

    if (!model) {
      return NextResponse.json({ error: "No model data provided" }, { status: 400 })
    }

    // Call Python script
    const scriptPath = path.join(process.cwd(), "scripts", "export_model.py")
    const python = spawn("python3", [scriptPath])

    let result = ""
    let error = ""

    // Send data to Python script
    python.stdin.write(JSON.stringify({ model, modelName, format }))
    python.stdin.end()

    // Collect output
    python.stdout.on("data", (data) => {
      result += data.toString()
    })

    python.stderr.on("data", (data) => {
      error += data.toString()
    })

    // Wait for process to complete
    await new Promise((resolve, reject) => {
      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(error || "Python script failed"))
        } else {
          resolve(null)
        }
      })
    })

    // Parse and return results
    const exportResult = JSON.parse(result)
    return NextResponse.json(exportResult)
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export model" }, { status: 500 })
  }
}
