import { getDefaultConfig, getDefaultWallets } from '@rainbow-me/rainbowkit';
// import { sepolia } from 'wagmi/chains';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
  coreWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http, createStorage, cookieStorage, fallback } from 'wagmi'; // Added fallback

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

// Define a custom Fuji testnet chain with multiple RPC URLs
const customFujiTestnet = {
  id: 43113,
  name: 'Avalanche Fuji C-Chain',
  network: 'fuji',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        'https://api.avax-test.network/ext/bc/C/rpc',
        'https://avalanche-fuji-c-chain.publicnode.com',
        'https://rpc.ankr.com/avalanche_fuji',
        'https://endpoints.omniatech.io/v1/avax/fuji/public',
        'https://avalanche-fuji.blockpi.network/v1/rpc/public'
      ],
    },
    public: {
      http: [
        'https://api.avax-test.network/ext/bc/C/rpc',
        'https://avalanche-fuji-c-chain.publicnode.com',
        'https://rpc.ankr.com/avalanche_fuji',
        'https://endpoints.omniatech.io/v1/avax/fuji/public',
        'https://avalanche-fuji.blockpi.network/v1/rpc/public'
      ],
    },
  },
  blockExplorers: {
    default: {
      name: 'SnowTrace',
      url: 'https://testnet.snowtrace.io',
    },
  },
  testnet: true,
};

const { wallets } = getDefaultWallets();

// Create transport with retries and fallback
const createTransport = (urls: string[]) => {
  return fallback(
    urls.map(url => 
      http(url, {
        timeout: 10_000, // 10s timeout
        retryCount: 3,
        retryDelay: 1000, // 1s between retries
      })
    )
  );
};

export const config = getDefaultConfig({
  appName: 'Neurocar',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  wallets: [
    ...wallets,
    {
      groupName: "Other",
      wallets: [coreWallet, argentWallet, trustWallet, ledgerWallet], 
    },
  ],
  chains: [
    customFujiTestnet
  ],
  transports: {
    [customFujiTestnet.id]: createTransport(customFujiTestnet.rpcUrls.public.http),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});