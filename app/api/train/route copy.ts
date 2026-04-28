import { type NextRequest, NextResponse } from "next/server"
import { execSync } from "child_process"
import { writeFileSync, unlinkSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

export async function POST(request: NextRequest) {
  let tmpFile: string | null = null

  try {
    const { csvContent, algorithm, targetVariable, trainRatio, problemType, kMeansCluster } = await request.json()

    if (!csvContent || !algorithm || (problemType !== "Clustering" && !targetVariable)) {
      return NextResponse.json(
        { error: "Missing required parameters: csvContent, algorithm, targetVariable" },
        { status: 400 },
      )
    }

    const ratio = Math.min(Math.max(Number(trainRatio) || 80, 10), 90)

    tmpFile = join(tmpdir(), `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.csv`)
    writeFileSync(tmpFile, csvContent, "utf-8")

    try {
      const clusterParam = algorithm === "K-Means" && kMeansCluster ? ` "${kMeansCluster}"` : ""
      const result = execSync(
        `python3 scripts/unified_training.py "${tmpFile}" "${algorithm}" "${targetVariable}" "${ratio}" "${problemType || "Classification"}"${clusterParam}`,
        {
          encoding: "utf-8",
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
        },
      )

      // This handles cases where debug logs are mixed with the JSON response
      let trainingResults
      try {
        trainingResults = JSON.parse(result)
      } catch {
        // Try to extract JSON from the output by finding the last { and last }
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error(`No valid JSON found in output. Raw output: ${result.substring(0, 500)}`)
        }
        trainingResults = JSON.parse(jsonMatch[0])
      }

      let finalResults = { ...trainingResults }

      if (problemType === "Regression" || problemType === "Clustering" || problemType === "Classification") {
        const metrics = trainingResults.metrics || {}

        const vizPayload = {
          problemType: problemType || "Classification",
          yTest: metrics.yTest || trainingResults.yTest || [],
          predictions: metrics.predictions || trainingResults.predictions || [],
          XTest: metrics.xTest || trainingResults.xTest || null,
          yPredProba: metrics.yPredProba || trainingResults.yPredProba || null,
          rocCurve: metrics.rocCurve || trainingResults.rocCurve || [],
          precisionRecallCurve: metrics.precisionRecallCurve || trainingResults.precisionRecallCurve || [],
          rocAuc: metrics.rocAuc || trainingResults.rocAuc || null,
          confusionMatrix: metrics.confusionMatrix || trainingResults.confusionMatrix || [],
          classDistribution: metrics.classDistribution || trainingResults.classDistribution || [],
        }

        try {
          const vizResult = execSync(`python3 scripts/visualization.py`, {
            encoding: "utf-8",
            input: JSON.stringify(vizPayload),
            cwd: process.cwd(),
            maxBuffer: 10 * 1024 * 1024,
          })
          let visualizationData
          try {
            visualizationData = JSON.parse(vizResult)
          } catch {
            const vizJsonMatch = vizResult.match(/\{[\s\S]*\}/)
            if (vizJsonMatch) {
              visualizationData = JSON.parse(vizJsonMatch[0])
            } else {
              visualizationData = {}
            }
          }
          if (!visualizationData.error) {
            finalResults = {
              ...finalResults,
              ...visualizationData,
              ...metrics,
            }
          }
        } catch (vizError: any) {
          console.error("Visualization generation failed:", vizError.message)
        }
      }

      return NextResponse.json(finalResults)
    } catch (execError: any) {
      console.error("Python execution error:", execError.message)
      return NextResponse.json({ error: "Training failed: " + (execError.message || "Unknown error") }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Training error:", error)
    return NextResponse.json({ error: error.message || "Training failed" }, { status: 500 })
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
