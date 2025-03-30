// app/api/pinata-upload/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { PinataSDK } from "pinata";

// Initialize the Pinata SDK with your JWT
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT as string,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL as string
});

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from the request
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Create options with metadata for the file
    const options = {
      name: `neurocar/${file.name}`,
      metadata: {
        keyvalues: {
          app: "neurocar",
          timestamp: Date.now().toString()
        }
      }
    };

    // Upload the file to Pinata with the folder prefix in the name
    const { cid } = await pinata.upload.public.file(file, options);
    
    // Get a gateway URL for the uploaded file
    const url = await pinata.gateways.public.convert(cid);
    
    // Return the CID and gateway URL
    return NextResponse.json({ 
      cid, 
      url,
      message: "File uploaded successfully to neurocar folder"
    }, { status: 200 });
    
  } catch (e) {
    console.error("Error uploading to Pinata:", e);
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    );
  }
}