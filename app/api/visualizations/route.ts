import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { problemType, modelResults, rocCurve, precisionRecallCurve } = body

    // ---------- Basic validation ----------
    if (!modelResults || !Array.isArray(modelResults.predictions)) {
      return NextResponse.json(
        { error: "Missing or invalid predictions in modelResults" },
        { status: 400 }
      )
    }

    // ---------- Build payload for Python ----------
    const payload = {
      problemType,
      predictions: modelResults.predictions,
      yTest: modelResults.yTest ?? [],
      yPredProba: modelResults.yPredProba ?? null,
      rocCurve: rocCurve ?? null,
      precisionRecallCurve: precisionRecallCurve ?? null,
      XTest: modelResults.XTest ?? null,
    }

    // ---------- Spawn Python ----------
    const py = spawn(
      "python",
      [path.join(process.cwd(), "scripts", "visualization.py")],
      { stdio: ["pipe", "pipe", "pipe"] }
    )

    py.stdin.write(JSON.stringify(payload))
    py.stdin.end()

    let stdout = ""
    let stderr = ""

    py.stdout.on("data", (d) => (stdout += d.toString()))
    py.stderr.on("data", (d) => (stderr += d.toString()))

    return await new Promise((resolve) => {
      py.on("close", () => {
        const cleanedStdout = stdout.trim()

        // ❌ Python returned nothing → real failure
        if (!cleanedStdout) {
          resolve(
            NextResponse.json(
              {
                error: "Visualization script returned no output",
                stderr,
              },
              { status: 500 }
            )
          )
          return
        }

        try {
          const parsed = JSON.parse(cleanedStdout)

          // ❌ Python explicitly reported an error
          if (parsed?.error) {
            resolve(
              NextResponse.json(
                { error: parsed.error },
                { status: 500 }
              )
            )
            return
          }

          // ✅ SUCCESS
          // IMPORTANT: return FLAT object (UI expects this)
          resolve(NextResponse.json(parsed, { status: 200 }))
        } catch (err: any) {
          resolve(
            NextResponse.json(
              {
                error: "Invalid JSON from visualization.py",
                stdout: cleanedStdout,
                stderr,
              },
              { status: 500 }
            )
          )
        }
      })
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Visualization request failed" },
      { status: 500 }
    )
  }
}
