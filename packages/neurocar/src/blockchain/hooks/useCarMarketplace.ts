"use client"

import { useState } from 'react';
import { type Address, type Hash, type Abi } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { carmarketplace_abi, carmarketplace_address } from '@/blockchain/abi/neuro';
import { useContractRead } from './useContractReads';

// --- Hook for Listing a Car ---
interface UseListCarProps {
  tokenId: bigint;
  price: bigint;
  description: string;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useListCar() {
  const { address: connectedAddress } = useAccount();
  const [isListing, setIsListing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const listCar = async ({ tokenId, price, description, onSuccess, onError }: UseListCarProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsListing(true);
    setError(null);
    
    // TODO: Add check if user owns the NFT and if marketplace is approved for this NFT
    // This requires reading from CarNFT contract (ownerOf, getApproved)

    try {
      writeContract({
        address: carmarketplace_address as Address,
        abi: carmarketplace_abi,
        functionName: 'listCar',
        args: [tokenId, price, description],
      }, {
        onSuccess: (txHash) => {
          console.log('List car transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('List car error:', err);
          setError(err);
          setIsListing(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send list car transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsListing(false);
      if (onError) onError(error);
    } finally {
      // Consider setting isListing based on confirmation status
    }
  };
  
  const clearError = () => setError(null);

  return { 
    listCar, 
    isListing: isListing || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}


// --- Hook for Purchasing a Car ---
interface UsePurchaseCarProps {
  tokenId: bigint;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function usePurchaseCar() {
  const { address: connectedAddress } = useAccount();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const purchaseCar = async ({ tokenId, onSuccess, onError }: UsePurchaseCarProps) => {
     if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsPurchasing(true);
    setError(null);

    // TODO: Add check for sufficient USDT balance and allowance for the marketplace contract
    // This requires reading from USDT contract (balanceOf, allowance)

    try {
      writeContract({
        address: carmarketplace_address as Address,
        abi: carmarketplace_abi,
        functionName: 'purchaseCar',
        args: [tokenId],
      }, {
        onSuccess: (txHash) => {
          console.log('Purchase car transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Purchase car error:', err);
          setError(err);
          setIsPurchasing(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send purchase car transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsPurchasing(false);
      if (onError) onError(error);
    } finally {
      // Consider setting isPurchasing based on confirmation status
    }
  };
  
  const clearError = () => setError(null);

  return { 
    purchaseCar, 
    isPurchasing: isPurchasing || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Updating Listing Price ---
interface UseUpdateListingPriceProps {
  tokenId: bigint;
  newPrice: bigint;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useUpdateListingPrice() {
  const { address: connectedAddress } = useAccount();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const updatePrice = async ({ tokenId, newPrice, onSuccess, onError }: UseUpdateListingPriceProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsUpdating(true);
    setError(null);

    try {
      writeContract({
        address: carmarketplace_address as Address,
        abi: carmarketplace_abi,
        functionName: 'updateListingPrice',
        args: [tokenId, newPrice],
      }, {
        onSuccess: (txHash) => {
          console.log('Update listing price transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Update listing price error:', err);
          setError(err);
          setIsUpdating(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send update listing price transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsUpdating(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    updatePrice, 
    isUpdating: isUpdating || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Canceling a Listing ---
interface UseCancelListingProps {
  tokenId: bigint;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useCancelListing() {
  const { address: connectedAddress } = useAccount();
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const cancelListing = async ({ tokenId, onSuccess, onError }: UseCancelListingProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsCanceling(true);
    setError(null);

    try {
      writeContract({
        address: carmarketplace_address as Address,
        abi: carmarketplace_abi,
        functionName: 'cancelListing',
        args: [tokenId],
      }, {
        onSuccess: (txHash) => {
          console.log('Cancel listing transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Cancel listing error:', err);
          setError(err);
          setIsCanceling(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send cancel listing transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsCanceling(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    cancelListing, 
    isCanceling: isCanceling || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Read hooks ---

// Get Active Listings
interface Listing {
  tokenId: bigint;
  price: bigint;
  seller: Address;
}

export function useActiveListings(startIndex: bigint = BigInt(0), count: bigint = BigInt(10)) {
  const { data, error, isLoading, refetch } = useContractRead<[bigint[], bigint[], Address[]]>({
    address: carmarketplace_address as Address,
    abi: carmarketplace_abi as Abi,
    functionName: 'getActiveListings',
    args: [startIndex, count],
  });

  // Process the data if needed
  const processedData: Listing[] | undefined = data ? 
    data[0].map((tokenId, index) => ({
      tokenId,
      price: data[1][index],
      seller: data[2][index],
    })) : undefined;

  return { listings: processedData, isLoading, error, refetch };
}

// Get Listing Details
interface ListingDetails {
  price: bigint;
  isActive: boolean;
  listedAt: bigint;
  description: string;
}

export function useListingDetails(tokenId?: bigint) {
  const { data, error, isLoading, refetch } = useContractRead<[bigint, boolean, bigint, string]>({
    address: carmarketplace_address as Address,
    abi: carmarketplace_abi as Abi,
    functionName: 'getListingDetails',
    args: tokenId ? [tokenId] : undefined,
    enabled: !!tokenId,
  });

  // Process the data if needed
  const processedData: ListingDetails | undefined = data ? 
    {
      price: data[0],
      isActive: data[1],
      listedAt: data[2],
      description: data[3],
    } : undefined;

  return { listing: processedData, isLoading, error, refetch };
}
