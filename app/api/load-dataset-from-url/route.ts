import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid or missing URL" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DataLab-AI/1.0",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const content = await response.text()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "The downloaded file is empty" }, { status: 400 })
    }

    // Get file size
    const sizeInBytes = new Blob([content]).size

    return NextResponse.json({
      success: true,
      content,
      size: sizeInBytes,
      contentType: response.headers.get("content-type"),
    })
  } catch (error: any) {
    console.error("[API] Error loading dataset from URL:", error)
    const errorMessage = error.message || "An error occurred while downloading the dataset from the URL"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
