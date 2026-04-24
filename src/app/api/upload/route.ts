import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Logic: In a real app, you'd save body.itemName and body.files to a DB here.
  console.log("Creating shipment for:", body.itemName);

  // Simulate database latency
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return NextResponse.json({ 
    success: true, 
    message: "Shipment registered in the GX-Network",
    timestamp: new Date().toISOString()
  });
}
