import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      csvContent,
      algorithm,
      targetVariable,
      trainRatio,
      problemType,
      preprocessingConfig,
      kMeansCluster,
    } = body

    if (!csvContent || !algorithm || !problemType) {
      return NextResponse.json(
        { error: "Missing required training parameters" },
        { status: 400 }
      )
    }

    /* ---------------- Build payload for Python ---------------- */

    const payload: any = {
      csvContent,
      algorithm,
      targetVariable,
      trainRatio,
      problemType,
      preprocessingConfig,
      kMeansCluster,
    }

    const pythonPath = "python"
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "unified_training.py" // ← your training script
    )

    const py = spawn(pythonPath, [scriptPath])

    py.stdin.write(JSON.stringify(payload))
    py.stdin.end()

    let output = ""
    let errorOutput = ""

    py.stdout.on("data", (data) => {
      output += data.toString()
    })

    py.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    return await new Promise((resolve) => {
      py.on("close", () => {
        try {
          const results = JSON.parse(output)

          if (results.error) {
            resolve(
              NextResponse.json(
                { error: results.error },
                { status: 500 }
              )
            )
            return
          }

          resolve(NextResponse.json(results, { status: 200 }))
        } catch (e: any) {
          resolve(
            NextResponse.json(
              {
                error: "Failed to parse training output",
                details: e.message,
                stderr: errorOutput, // optional: keep for debugging
              },
              { status: 500 }
            )
          )
        }


        try {
          const results = JSON.parse(output)

          /* ================= 🔥 CRITICAL FIX ================= */
          /* Ensure XTest is returned for CLUSTERING */

          if (problemType === "Clustering") {
            if (!results.XTest || !Array.isArray(results.XTest)) {
              resolve(
                NextResponse.json(
                  {
                    error:
                      "Training completed, but XTest (feature matrix / PCA) is missing for clustering",
                  },
                  { status: 500 }
                )
              )
              return
            }
          }

          /* =================================================== */

          resolve(NextResponse.json(results, { status: 200 }))
        } catch (e: any) {
          resolve(
            NextResponse.json(
              { error: "Failed to parse training output", details: e.message },
              { status: 500 }
            )
          )
        }
      })
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Training request failed" },
      { status: 500 }
    )
  }
}
