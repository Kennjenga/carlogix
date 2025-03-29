// utils/config.ts
"use server";

import { PinataSDK } from "pinata";

// Create a new instance of the Pinata SDK
export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT as string,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL as string
});