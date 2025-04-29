"use client"

import { useState } from 'react';
import { type Address, type Hash, type Abi } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { carinsurance_abi, carinsurance_address } from '@/blockchain/abi/neuro';
import { useContractRead } from './useContractReads';

// --- Hook for Joining Insurance Pool with USDT ---
interface UseJoinPoolWithUSDTProps {
  poolId: bigint;
  tokenId: bigint;
  amount: bigint; // The initial premium amount in USDT
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useJoinPoolWithUSDT() {
  const { address: connectedAddress } = useAccount();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const joinPool = async ({ poolId, tokenId, amount, onSuccess, onError }: UseJoinPoolWithUSDTProps) => {
     if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsJoining(true);
    setError(null);

    // TODO: Add check for sufficient USDT balance and allowance for the insurance contract
    // This requires reading from USDT contract (balanceOf, allowance)

    try {
      writeContract({
        address: carinsurance_address as Address,
        abi: carinsurance_abi as Abi,
        functionName: 'joinPoolWithUSDT',
        args: [poolId, tokenId, amount],
      }, {
        onSuccess: (txHash) => {
          console.log('Join pool transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Join pool error:', err);
          setError(err);
          setIsJoining(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send join pool transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsJoining(false);
      if (onError) onError(error);
    } finally {
      // Consider setting isJoining based on confirmation status
    }
  };
  
  const clearError = () => setError(null);

  return { 
    joinPool, 
    isJoining: isJoining || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Joining Insurance Pool with Native Currency (AVAX) ---
interface UseJoinPoolProps {
  poolId: bigint;
  tokenId: bigint;
  amount: bigint; // Native currency amount (in wei)
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useJoinPool() {
  const { address: connectedAddress } = useAccount();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const joinPool = async ({ poolId, tokenId, amount, onSuccess, onError }: UseJoinPoolProps) => {
     if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsJoining(true);
    setError(null);

    try {
      writeContract({
        address: carinsurance_address as Address,
        abi: carinsurance_abi as Abi,
        functionName: 'joinPool',
        args: [poolId, tokenId],
        value: amount,
      }, {
        onSuccess: (txHash) => {
          console.log('Join pool transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Join pool error:', err);
          setError(err);
          setIsJoining(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send join pool transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsJoining(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    joinPool, 
    isJoining: isJoining || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Paying Premium with USDT ---
interface UsePayPremiumProps {
  membershipId: bigint;
  amount: bigint; // The premium amount in USDT
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function usePayPremium() {
  const { address: connectedAddress } = useAccount();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const payPremium = async ({ membershipId, amount, onSuccess, onError }: UsePayPremiumProps) => {
     if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsPaying(true);
    setError(null);

    // TODO: Add check for sufficient USDT balance and allowance for the insurance contract

    try {
      writeContract({
        address: carinsurance_address as Address,
        abi: carinsurance_abi as Abi,
        functionName: 'payPoolPremiumWithUSDT',
        args: [membershipId, amount],
      }, {
        onSuccess: (txHash) => {
          console.log('Pay premium transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Pay premium error:', err);
          setError(err);
          setIsPaying(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send pay premium transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsPaying(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    payPremium, 
    isPaying: isPaying || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Filing a Claim ---
interface UseFileClaimProps {
  membershipId: bigint;
  amount: bigint;
  description: string;
  evidenceUri: string;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useFileClaim() {
  const { address: connectedAddress } = useAccount();
  const [isFiling, setIsFiling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  // This function is not directly exposed in the ABI, but we can call it via contract interaction
  // It might require role-based access control, so this implementation is tentative
  const fileClaim = async ({ 
    membershipId, 
    amount, 
    description, 
    evidenceUri, 
    onSuccess, 
    onError 
  }: UseFileClaimProps) => {
     if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsFiling(true);
    setError(null);

    try {
      // Note: This is a placeholder. The actual function name and args
      // should be validated against the contract code.
      writeContract({
        address: carinsurance_address as Address,
        abi: carinsurance_abi as Abi,
        functionName: 'fileClaim', // Check if this function exists and has this name
        args: [membershipId, amount, description, evidenceUri],
      }, {
        onSuccess: (txHash) => {
          console.log('File claim transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('File claim error:', err);
          setError(err);
          setIsFiling(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send file claim transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsFiling(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    fileClaim, 
    isFiling: isFiling || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Read hooks ---

// Get Pool Details
interface PoolDetails {
  name: string;
  description: string;
  creationDate: bigint;
  balance: bigint;
  status: number; // enum value
  minMonthlyPremium: bigint;
  maxCoverageMultiplier: bigint;
  riskFactor: bigint;
  memberCount: bigint;
  specialization: string;
  maxYearsCovered: bigint;
}

type PoolDetailsTuple = [
  string,      // name
  string,      // description
  bigint,      // creationDate
  bigint,      // balance
  number,      // status
  bigint,      // minMonthlyPremium
  bigint,      // maxCoverageMultiplier
  bigint,      // riskFactor
  bigint,      // memberCount
  string,      // specialization
  bigint       // maxYearsCovered
];

export function usePoolDetails(poolId?: bigint) {
  const { data, error, isLoading, refetch } = useContractRead<PoolDetailsTuple>({
    address: carinsurance_address as Address,
    abi: carinsurance_abi as Abi,
    functionName: 'getPoolDetails',
    args: poolId ? [poolId] : undefined,
    enabled: !!poolId,
  });

  // Process the data
  const processedData: PoolDetails | undefined = data ? 
    {
      name: data[0],
      description: data[1],
      creationDate: data[2],
      balance: data[3],
      status: data[4],
      minMonthlyPremium: data[5],
      maxCoverageMultiplier: data[6],
      riskFactor: data[7],
      memberCount: data[8],
      specialization: data[9],
      maxYearsCovered: data[10],
    } : undefined;

  return { pool: processedData, isLoading, error, refetch };
}

// Get Memberships By Owner
export function useMembershipsByOwner(owner?: Address) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = owner || connectedAddress;

  const { data, error, isLoading, refetch } = useContractRead<bigint[]>({
    address: carinsurance_address as Address,
    abi: carinsurance_abi as Abi,
    functionName: 'getMembershipsByOwner',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress,
  });

  return { membershipIds: data, isLoading, error, refetch };
}

// Get Claims By Membership
export function useClaimsByMembership(membershipId?: bigint) {
  const { data, error, isLoading, refetch } = useContractRead<bigint[]>({
    address: carinsurance_address as Address,
    abi: carinsurance_abi as Abi,
    functionName: 'getClaimsByMembership',
    args: membershipId ? [membershipId] : undefined,
    enabled: !!membershipId,
  });

  return { claimIds: data, isLoading, error, refetch };
}

// Get Pool Memberships
export function usePoolMemberships(poolId?: bigint) {
  const { data, error, isLoading, refetch } = useContractRead<bigint[]>({
    address: carinsurance_address as Address,
    abi: carinsurance_abi as Abi,
    functionName: 'getPoolMemberships',
    args: poolId ? [poolId] : undefined,
    enabled: !!poolId,
  });

  return { membershipIds: data, isLoading, error, refetch };
}