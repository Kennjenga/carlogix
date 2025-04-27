"use client"

import { useReadContract } from 'wagmi'
import { Abi, Address } from 'viem'
import { createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { carnft_abi, carnft_address, carinsurance_abi, carinsurance_address, rateoracle_abi, rateoracle_address } from '@/blockchain/abi/neuro'

// Define the correct RPC URL for Avalanche Fuji testnet
const AVAX_RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";

// Client for direct blockchain interactions
export const publicClient = createPublicClient({
  chain: {
    ...avalancheFuji,
    id: 43113,
    name: 'fuji',
    rpcUrls: {
      default: {
        http: [AVAX_RPC_URL],
      },
      public: {
        http: [AVAX_RPC_URL],
      },
    },
  },
  transport: http(AVAX_RPC_URL),
});

// -- Car NFT Read Hooks --

// Get car details
export function useCarDetails(tokenId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'getCarDetails',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    chainId,
    query: {
      enabled: tokenId !== undefined,
    }
  })
}

// Get maintenance records
export function useMaintenanceRecords(tokenId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'getMaintenanceRecords',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    chainId,
    query: {
      enabled: tokenId !== undefined,
      retry: 3,
      staleTime: 60000, // 1 minute
    }
  })
}

// Get multiple maintenance records in a batch
export async function fetchMultipleMaintenanceRecords(tokenIds: number[]) {
  if (!tokenIds.length) return {};

  try {
    // Convert all tokenIds to BigInt for blockchain interaction
    const bigIntTokenIds = tokenIds.map(id => BigInt(id));
    
    // Create an array of contract read calls
    const calls = bigIntTokenIds.map(tokenId => ({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'getMaintenanceRecords',
      args: [tokenId]
    }));
    
    // Execute all calls in parallel using multicall
    const results = await publicClient.multicall({
      contracts: calls,
    });
    
    // Process results into a structured object
    const recordsMap: Record<string, unknown[]> = {};
    
    results.forEach((result, index) => {
      const tokenId = tokenIds[index].toString();
      
      if (result.status === 'success') {
        recordsMap[tokenId] = result.result as unknown[];
      } else {
        console.error(`Failed to fetch records for token ID ${tokenId}:`, result.error);
        recordsMap[tokenId] = [];
      }
    });
    
    return recordsMap;
  } catch (error) {
    console.error('Error in batch fetch operation:', error);
    throw error;
  }
}

// Get issue reports
export function useIssueReports(tokenId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'getIssueReports',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    chainId,
    query: {
      enabled: tokenId !== undefined,
    }
  })
}

// Get token info 
export function useTokenURI(tokenId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    chainId,
    query: {
      enabled: tokenId !== undefined,
    }
  })
}

export function useOwnerOf(tokenId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    chainId,
    query: {
      enabled: tokenId !== undefined,
    }
  })
}

export function useTokenIdByVIN(vin: string | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'getTokenIdByVIN',
    args: vin ? [vin] : undefined,
    chainId,
    query: {
      enabled: !!vin,
    }
  })
}

export function useTokenIdByRegistrationNumber(registrationNumber: string | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'getTokenIdByRegistrationNumber',
    args: registrationNumber ? [registrationNumber] : undefined,
    chainId,
    query: {
      enabled: !!registrationNumber,
    }
  })
}

// -- Car Insurance Read Hooks --

// Role related hooks
export function useAdminRole(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'ADMIN_ROLE',
    chainId,
  })
}

export function useAssessorRole(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'ASSESSOR_ROLE',
    chainId,
  })
}

export function useActuaryRole(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'ACTUARY_ROLE',
    chainId,
  })
}

export function useDefaultAdminRole(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'DEFAULT_ADMIN_ROLE',
    chainId,
  })
}

export function useHasRole(role: string | undefined, account: Address | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'hasRole',
    args: role && account ? [role, account] : undefined,
    chainId,
    query: {
      enabled: !!role && !!account,
    }
  })
}

export function useGetRoleAdmin(role: string | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getRoleAdmin',
    args: role ? [role] : undefined,
    chainId,
    query: {
      enabled: !!role,
    }
  })
}

// Car insurance NFT Contract reference
export function useCarNFTContract(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'carNFTContract',
    chainId,
  })
}

// Pool management hooks
export function usePoolDetails(poolId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getPoolDetails',
    args: poolId !== undefined ? [BigInt(poolId)] : undefined,
    chainId,
    query: {
      enabled: poolId !== undefined,
    }
  })
}

export function useMembershipDetails(
  poolId: bigint | number | undefined, 
  memberAddress: Address | undefined, 
  chainId: number = 43113
) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getMembershipDetails',
    args: poolId !== undefined && memberAddress ? [BigInt(poolId), memberAddress] : undefined,
    chainId,
    query: {
      enabled: poolId !== undefined && !!memberAddress,
    }
  })
}

export function useMemberPools(memberAddress: Address | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getMemberPools',
    args: memberAddress ? [memberAddress] : undefined,
    chainId,
    query: {
      enabled: !!memberAddress,
    }
  })
}

// Claims management hooks
export function useClaimDetails(claimId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getClaimDetails',
    args: claimId !== undefined ? [BigInt(claimId)] : undefined,
    chainId,
    query: {
      enabled: claimId !== undefined,
    }
  })
}

export function useClaimEvaluations(claimId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getClaimEvaluations',
    args: claimId !== undefined ? [BigInt(claimId)] : undefined,
    chainId,
    query: {
      enabled: claimId !== undefined,
    }
  })
}

export function useCarClaims(tokenId: bigint | number | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getCarClaims',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    chainId,
    query: {
      enabled: tokenId !== undefined,
    }
  })
}

// Assessor management hook
export function useAssessorDetails(assessorAddress: Address | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getAssessorDetails',
    args: assessorAddress ? [assessorAddress] : undefined,
    chainId,
    query: {
      enabled: !!assessorAddress,
    }
  })
}

// Actuary management hook
export function useActuaryDetails(actuaryAddress: Address | undefined, chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getActuaryDetails',
    args: actuaryAddress ? [actuaryAddress] : undefined,
    chainId,
    query: {
      enabled: !!actuaryAddress,
    }
  })
}

// Get pool count
export function usePoolCount(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getPoolCount',
    chainId,
  })
}

// RateOracle hooks
export function useExchangeRate(currencyPair: string | undefined, chainId: number = 43113) {
  return useReadContract({
    address: rateoracle_address as Address,
    abi: rateoracle_abi,
    functionName: 'getRate',
    args: currencyPair ? [currencyPair] : undefined,
    chainId,
    query: {
      enabled: !!currencyPair,
    }
  })
}

export function useExchangeRateWithTimestamp(currencyPair: string | undefined, chainId: number = 43113) {
  return useReadContract({
    address: rateoracle_address as Address,
    abi: rateoracle_abi,
    functionName: 'getRateWithTimestamp',
    args: currencyPair ? [currencyPair] : undefined,
    chainId,
    query: {
      enabled: !!currencyPair,
    }
  })
}

// Stablecoin related hooks
export function useSupportedStablecoins(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'getSupportedStablecoins',
    chainId,
  })
}

export function useDefaultStablecoin(chainId: number = 43113) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'defaultStablecoin',
    chainId,
  })
}

// Fetch all active pools
export async function fetchAllPools() {
  try {
    console.log("Fetching all active pools...");
    
    // Since some networks limit log queries, we'll use a sequential approach
    const pools = [];
    let poolId = 1;
    const MAX_POOLS_TO_CHECK = 10; // Safety limit
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3; // Stop after 3 consecutive failures
    
    // Try to fetch pools one by one until we get too many consecutive errors
    for (let i = 0; i < MAX_POOLS_TO_CHECK && consecutiveFailures < MAX_CONSECUTIVE_FAILURES; i++) {
      try {
        console.log(`Checking if pool ${poolId} exists...`);
        
        const poolDetails = await publicClient.readContract({
          address: carinsurance_address as Address,
          abi: carinsurance_abi,
          functionName: 'getPoolDetails',
          args: [BigInt(poolId)]
        });
        
        if (poolDetails) {
          console.log(`Found pool ${poolId}:`, poolDetails);
          
          // Process the pool data
          const poolData = poolDetails as {
            name?: string;
            description?: string;
            minContribution?: bigint;
            coverageMultiplier?: bigint;
            totalBalance?: bigint;
            memberCount?: number;
            createdAt?: bigint;
            active?: boolean;
            creator?: Address;
          };
          
          // Only add the pool if it's active
          if (poolData.active) {
            pools.push({
              id: poolId.toString(),
              name: poolData.name || `Pool ${poolId}`,
              description: poolData.description || "Insurance pool for vehicles",
              minContribution: poolData.minContribution || BigInt(0),
              coverageMultiplier: poolData.coverageMultiplier || BigInt(0),
              totalFunds: poolData.totalBalance || BigInt(0),
              memberCount: poolData.memberCount || 0,
              createdAt: poolData.createdAt || BigInt(0),
              active: true,
              creator: poolData.creator || '0x0000000000000000000000000000000000000000'
            });
          } else {
            console.log(`Pool ${poolId} exists but is inactive, skipping`);
          }
          
          // Reset consecutive failures counter since we found a pool
          consecutiveFailures = 0;
          
          // Move to the next pool ID
          poolId++;
        } else {
          // If we get a null result, we've reached the end of the pools
          console.log(`No more pools found after ${poolId-1}`);
          break;
        }
      } catch (error) {
        // If we get an error for this pool ID, it might not exist
        console.log(`Error checking pool ${poolId}:`, error);
        consecutiveFailures++;
        poolId++;
        
        // If this is the first pool and it doesn't exist, there are no pools
        if (poolId === 1) {
          return [];
        }
      }
    }
    
    console.log(`Fetched ${pools.length} active pools`);
    return pools;
  } catch (error) {
    console.error("Error fetching all pools:", error);
    throw error;
  }
}

// Fetch all registered assessors
export async function fetchAllAssessors() {
  try {
    console.log("Fetching all registered assessors...");
    
    const assessorRole = await publicClient.readContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'ASSESSOR_ROLE'
    });
    
    // Not possible to get all role members with a single call in most contracts
    // Need to implement contract-specific logic or check events
    // This is a placeholder - actual implementation would depend on contract specifics
    
    console.log("Assessor role identifier:", assessorRole);
    return [];
  } catch (error) {
    console.error("Error fetching assessors:", error);
    throw error;
  }
}

// Fetch all registered actuaries
export async function fetchAllActuaries() {
  try {
    console.log("Fetching all registered actuaries...");
    
    const actuaryRole = await publicClient.readContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'ACTUARY_ROLE'
    });
    
    // Not possible to get all role members with a single call in most contracts
    // Need to implement contract-specific logic or check events
    // This is a placeholder - actual implementation would depend on contract specifics
    
    console.log("Actuary role identifier:", actuaryRole);
    return [];
  } catch (error) {
    console.error("Error fetching actuaries:", error);
    throw error;
  }
}