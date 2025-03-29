"use client"

// src/blockchain/hooks/useContractReads.ts
import { useReadContract } from 'wagmi'
import { Address } from 'viem'
import { carnft_abi, carnft_address, carinsurance_abi, carinsurance_address } from '@/blockchain/abi/neuro'

// -- Car NFT Read Hooks --

// Get car details
export function useCarDetails(tokenId: bigint | number | undefined, chainId: number = 296) {
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
export function useMaintenanceRecords(tokenId: bigint | number | undefined, chainId: number = 296) {
  return useReadContract({
    address: carnft_address as Address,
    abi: carnft_abi,
    functionName: 'getMaintenanceRecords',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    chainId,
    query: {
      enabled: tokenId !== undefined,
    }
  })
}

// Get issue reports
export function useIssueReports(tokenId: bigint | number | undefined, chainId: number = 296) {
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
export function useTokenURI(tokenId: bigint | number | undefined, chainId: number = 296) {
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

export function useOwnerOf(tokenId: bigint | number | undefined, chainId: number = 296) {
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

export function useTokenIdByVIN(vin: string | undefined, chainId: number = 296) {
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

// -- Car Insurance Read Hooks --

// Role related hooks
export function useAdminRole(chainId: number = 296) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'ADMIN_ROLE',
    chainId,
  })
}

export function useAssessorRole(chainId: number = 296) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'ASSESSOR_ROLE',
    chainId,
  })
}

export function useDefaultAdminRole(chainId: number = 296) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'DEFAULT_ADMIN_ROLE',
    chainId,
  })
}

export function useHasRole(role: string | undefined, account: Address | undefined, chainId: number = 296) {
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

export function useGetRoleAdmin(role: string | undefined, chainId: number = 296) {
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
export function useCarNFTContract(chainId: number = 296) {
  return useReadContract({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    functionName: 'carNFTContract',
    chainId,
  })
}

// Pool management hooks
export function usePoolDetails(poolId: bigint | number | undefined, chainId: number = 296) {
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
  chainId: number = 296
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

export function useMemberPools(memberAddress: Address | undefined, chainId: number = 296) {
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
export function useClaimDetails(claimId: bigint | number | undefined, chainId: number = 296) {
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

export function useClaimEvaluations(claimId: bigint | number | undefined, chainId: number = 296) {
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

export function useCarClaims(tokenId: bigint | number | undefined, chainId: number = 296) {
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

// Assessor management hooks
export function useAssessorDetails(assessorAddress: Address | undefined, chainId: number = 296) {
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