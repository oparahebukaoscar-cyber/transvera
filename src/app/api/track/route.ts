import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Logic to fetch from DB would go here
  return NextResponse.json({
    id,
    status: "moving",
    location: { lat: 40.7128, lng: -74.006 },
  });
}
