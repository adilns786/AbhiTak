import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log("Feedback received:", data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Feedback error:", err)
    return NextResponse.json({ success: false })
  }
}
