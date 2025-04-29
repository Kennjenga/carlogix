"use client"

import { useState } from 'react';
import { type Address, type Hash, type Abi } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { rateoracle_abi, rateoracle_address } from '@/blockchain/abi/neuro';
import { useContractRead } from './useContractReads';

// --- Hook for Getting Exchange Rate ---
// Refine the hook to handle proper bytes32 values for the rate pair constants

export function useGetRate(pair: 'AVAX_USDT' | 'USDT_KES') {
  // Constants from the contract
  const AVAX_USDT = '0x415641585f555344540000000000000000000000000000000000000000000000';
  const USDT_KES = '0x555344545f4b4553000000000000000000000000000000000000000000000000';
  
  const pairBytes32 = pair === 'AVAX_USDT' ? AVAX_USDT : USDT_KES;

  const { data, error, isLoading, refetch } = useContractRead<[bigint, bigint]>({
    address: rateoracle_address as Address,
    abi: rateoracle_abi as Abi,
    functionName: 'getRate',
    args: [pairBytes32],
    watch: true, // Automatically refetch on interval
  });

  // Process the data
  const rate = data?.[0];
  const timestamp = data?.[1];

  return { 
    rate, 
    timestamp, 
    isLoading, 
    error, 
    refetch,
    // Helper method to format the rate as a decimal (assumes 18 decimals, adjust if different)
    formattedRate: rate ? Number(rate) / 10**18 : undefined 
  };
}

// --- Hook for Updating Rates (For oracles/admins) ---
interface UseUpdateRateProps {
  pair: 'AVAX_USDT' | 'USDT_KES';
  rate: bigint;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useUpdateRate() {
  const { address: connectedAddress } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const updateRate = async ({ pair, rate, onSuccess, onError }: UseUpdateRateProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsUpdating(true);
    setError(null);

    // Constants from the contract
    const AVAX_USDT = '0x415641585f555344540000000000000000000000000000000000000000000000';
    const USDT_KES = '0x555344545f4b4553000000000000000000000000000000000000000000000000';
    
    const pairBytes32 = pair === 'AVAX_USDT' ? AVAX_USDT : USDT_KES;

    try {
      writeContract({
        address: rateoracle_address as Address,
        abi: rateoracle_abi as Abi,
        functionName: 'updateRate',
        args: [pairBytes32, rate],
      }, {
        onSuccess: (txHash) => {
          console.log('Update rate transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Update rate error:', err);
          setError(err);
          setIsUpdating(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send update rate transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsUpdating(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    updateRate, 
    isUpdating: isUpdating || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Batch Updating Multiple Rates (For oracles/admins) ---
interface UseUpdateRatesProps {
  pairs: ('AVAX_USDT' | 'USDT_KES')[];
  rates: bigint[];
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useUpdateRates() {
  const { address: connectedAddress } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const updateRates = async ({ pairs, rates, onSuccess, onError }: UseUpdateRatesProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    if (pairs.length !== rates.length) {
        const err = new Error('Pairs and rates arrays must have the same length');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsUpdating(true);
    setError(null);

    // Constants from the contract
    const AVAX_USDT = '0x415641585f555344540000000000000000000000000000000000000000000000';
    const USDT_KES = '0x555344545f4b4553000000000000000000000000000000000000000000000000';
    
    const pairsBytes32 = pairs.map(pair => pair === 'AVAX_USDT' ? AVAX_USDT : USDT_KES);

    try {
      writeContract({
        address: rateoracle_address as Address,
        abi: rateoracle_abi as Abi,
        functionName: 'updateRates',
        args: [pairsBytes32, rates],
      }, {
        onSuccess: (txHash) => {
          console.log('Update rates transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Update rates error:', err);
          setError(err);
          setIsUpdating(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send update rates transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsUpdating(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    updateRates, 
    isUpdating: isUpdating || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}
