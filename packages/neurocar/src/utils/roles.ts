import { Address } from "viem";
import { carinsurance_abi, carinsurance_address } from "@/blockchain/abi/neuro";
import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";

// Create a public client for reading contract data
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
});

export const USER_ROLES = {
  DEFAULT_ADMIN: "DEFAULT_ADMIN_ROLE",
  ADMIN: "ADMIN_ROLE",
  ASSESSOR: "ASSESSOR_ROLE",
  ACTUARY: "ACTUARY_ROLE",
} as const;

export const hasRole = async (role: string, account: Address): Promise<boolean> => {
  try {
    const hasRole = await publicClient.readContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: "hasRole",
      args: [role, account],
    });
    return !!hasRole;
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
};

export const isAddressAdmin = async (address: Address): Promise<boolean> => {
  try {
    // First check if address has DEFAULT_ADMIN_ROLE
    const defaultAdminRole = await publicClient.readContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: "DEFAULT_ADMIN_ROLE",
    });

    const isDefaultAdmin = await hasRole(defaultAdminRole as string, address);
    if (isDefaultAdmin) return true;

    // Then check if address has ADMIN_ROLE
    const adminRole = await publicClient.readContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: "ADMIN_ROLE",
    });

    return await hasRole(adminRole as string, address);
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};