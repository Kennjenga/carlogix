import { getContract } from "thirdweb";
import { client, avalancheFuji } from "@/app/client";
import { addresses, carnft_abi } from "../abi/neuro";

// Contract addresses from deployed contracts
export const CONTRACT_ADDRESSES = addresses;

// Create contract instances
export const carNFTContract = getContract({
  client,
  chain: avalancheFuji,
  address: CONTRACT_ADDRESSES.carnft,
  abi: carnft_abi,
});
