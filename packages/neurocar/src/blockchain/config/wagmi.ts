import { getDefaultConfig, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { hederaTestnet } from 'wagmi/chains';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http, createStorage, cookieStorage } from 'wagmi';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

const { wallets } = getDefaultWallets();

export const config = getDefaultConfig({
  appName: 'Neurocar',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  wallets: [
    ...wallets,
    {
      groupName: "Other",
      wallets: [argentWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [
    // mainnet,
    // sepolia,
    // polygon,
    // arbitrum,
    // base,
    // optimism,
    hederaTestnet
  ],
  transports: {
    // [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    // [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    // [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    // [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    // [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    // [optimism.id]: http(`https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    [hederaTestnet.id]: http(`https://testnet.mirrornode.hedera.com/api/v1/`),},
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});