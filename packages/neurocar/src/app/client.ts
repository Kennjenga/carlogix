"use client"

import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import {
  inAppWallet,
  createWallet,
} from "thirdweb/wallets";

// Replace this with your client ID string
// refer to https://portal.thirdweb.com/typescript/v5/client on how to get a client ID
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

if (!clientId) {
  throw new Error("No Thirdweb client ID provided. Please set NEXT_PUBLIC_TEMPLATE_CLIENT_ID in your environment variables.");
}

export const client = createThirdwebClient({
  clientId: clientId,
});

// Define Avalanche Fuji testnet chain
export const avalancheFuji = defineChain({
  id: 43113,
  name: "Avalanche Fuji C-Chain",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  rpc: "https://api.avax-test.network/ext/bc/C/rpc",
  blockExplorers: [
    {
      name: "SnowTrace",
      url: "https://testnet.snowtrace.io",
    },
  ],
  testnet: true,
});

export const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "email",
        "passkey",
        "phone",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];