import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { problemType, yTest, predictions, XTest } = body

    if (!problemType || !yTest || !predictions) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Call Python script
    const scriptPath = path.join(process.cwd(), 'scripts', 'evaluation.py')
    const python = spawn('python3', [scriptPath])

    let result = ''
    let error = ''

    // Send data to Python script
    python.stdin.write(JSON.stringify({ problemType, yTest, predictions, XTest }))
    python.stdin.end()

    // Collect output
    python.stdout.on('data', (data) => {
      result += data.toString()
    })

    python.stderr.on('data', (data) => {
      error += data.toString()
    })

    // Wait for process to complete
    await new Promise((resolve, reject) => {
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(error || 'Python script failed'))
        } else {
          resolve(null)
        }
      })
    })

    // Parse and return results
    const metrics = JSON.parse(result)
    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate model' },
      { status: 500 }
    )
  }
}
