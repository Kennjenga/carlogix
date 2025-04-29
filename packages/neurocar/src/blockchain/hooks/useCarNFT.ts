"use client"

import { useState } from 'react';
import { type Address, type Hash, type Abi } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { carnft_abi, carnft_address } from '@/blockchain/abi/neuro';
import { useContractRead } from './useContractReads';
import { MaintenanceRecord, InsuranceDetail, IssueReport } from '@/types';

// --- Hook for Adding Maintenance Record ---
interface UseAddMaintenanceRecordProps {
  tokenId: bigint;
  description: string;
  serviceProvider: string; // Could be an address or name
  mileage: bigint;
  documentURI: string; // IPFS hash or URL
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useAddMaintenanceRecord() {
  const { address: connectedAddress } = useAccount();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const addRecord = async ({ 
    tokenId, 
    description, 
    serviceProvider, 
    mileage, 
    documentURI, 
    onSuccess, 
    onError 
  }: UseAddMaintenanceRecordProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    // TODO: Add check if connectedAddress is owner or approved mechanic/admin
    
    setIsAdding(true);
    setError(null);

    try {
      writeContract({
        address: carnft_address as Address,
        abi: carnft_abi as Abi,
        functionName: 'addMaintenanceRecord',
        args: [tokenId, description, serviceProvider, mileage, documentURI],
      }, {
        onSuccess: (txHash) => {
          console.log('Add maintenance record transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Add maintenance record error:', err);
          setError(err);
          setIsAdding(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send add maintenance record transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsAdding(false);
      if (onError) onError(error);
    } finally {
      // Consider setting isAdding based on confirmation status
    }
  };
  
  const clearError = () => setError(null);

  return { 
    addRecord, 
    isAdding: isAdding || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Minting a New Car ---
interface UseMintCarProps {
  to: Address;
  vin: string;
  make: string;
  model: string;
  year: bigint;
  registrationNumber: string;
  imageURI: string;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useMintCar() {
  const { address: connectedAddress } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const mintCar = async ({ 
    to, 
    vin, 
    make, 
    model, 
    year, 
    registrationNumber, 
    imageURI, 
    onSuccess, 
    onError 
  }: UseMintCarProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsMinting(true);
    setError(null);

    // TODO: Check if connected address has manufacturer or admin role 
    
    try {
      writeContract({
        address: carnft_address as Address,
        abi: carnft_abi as Abi,
        functionName: 'mintCar',
        args: [to, vin, make, model, year, registrationNumber, imageURI],
      }, {
        onSuccess: (txHash) => {
          console.log('Mint car transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Mint car error:', err);
          setError(err);
          setIsMinting(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send mint car transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsMinting(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    mintCar, 
    isMinting: isMinting || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Adding or Updating Insurance ---
interface UseInsuranceDetailsProps {
  tokenId: bigint;
  policyNumber: string;
  provider: string;
  startDate: bigint; // timestamp
  endDate: bigint; // timestamp
  documentURI: string;
  isUpdate?: boolean;
  active?: boolean; // Only used for updates
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useInsuranceDetails() {
  const { address: connectedAddress } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const processInsurance = async ({ 
    tokenId, 
    policyNumber, 
    provider, 
    startDate, 
    endDate, 
    documentURI, 
    isUpdate = false,
    active = true,
    onSuccess, 
    onError 
  }: UseInsuranceDetailsProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const functionName = isUpdate ? 'updateInsuranceDetails' : 'addInsuranceDetails';
      const args = isUpdate 
        ? [tokenId, policyNumber, provider, startDate, endDate, documentURI, active]
        : [tokenId, policyNumber, provider, startDate, endDate, documentURI];
        
      writeContract({
        address: carnft_address as Address,
        abi: carnft_abi as Abi,
        functionName,
        args,
      }, {
        onSuccess: (txHash) => {
          console.log(`${isUpdate ? 'Update' : 'Add'} insurance transaction sent:`, txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error(`${isUpdate ? 'Update' : 'Add'} insurance error:`, err);
          setError(err);
          setIsProcessing(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error(`Failed to send ${isUpdate ? 'update' : 'add'} insurance transaction:`, err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsProcessing(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    processInsurance, 
    isProcessing: isProcessing || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Reporting Issues ---
interface UseReportIssueProps {
  tokenId: bigint;
  issueType: string;
  description: string;
  evidenceURI: string;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useReportIssue() {
  const { address: connectedAddress } = useAccount();
  const [isReporting, setIsReporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const reportIssue = async ({ 
    tokenId, 
    issueType, 
    description, 
    evidenceURI, 
    onSuccess, 
    onError 
  }: UseReportIssueProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsReporting(true);
    setError(null);

    try {
      writeContract({
        address: carnft_address as Address,
        abi: carnft_abi as Abi,
        functionName: 'reportIssue',
        args: [tokenId, issueType, description, evidenceURI],
      }, {
        onSuccess: (txHash) => {
          console.log('Report issue transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Report issue error:', err);
          setError(err);
          setIsReporting(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send report issue transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsReporting(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    reportIssue, 
    isReporting: isReporting || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Hook for Resolving Issues ---
interface UseResolveIssueProps {
  tokenId: bigint;
  reportIndex: bigint;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useResolveIssue() {
  const { address: connectedAddress } = useAccount();
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const resolveIssue = async ({ 
    tokenId, 
    reportIndex, 
    onSuccess, 
    onError 
  }: UseResolveIssueProps) => {
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsResolving(true);
    setError(null);

    try {
      writeContract({
        address: carnft_address as Address,
        abi: carnft_abi as Abi,
        functionName: 'resolveIssue',
        args: [tokenId, reportIndex],
      }, {
        onSuccess: (txHash) => {
          console.log('Resolve issue transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Resolve issue error:', err);
          setError(err);
          setIsResolving(false);
          if (onError) onError(err);
        },
      });
    } catch (err) {
      console.error('Failed to send resolve issue transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsResolving(false);
      if (onError) onError(error);
    }
  };
  
  const clearError = () => setError(null);

  return { 
    resolveIssue, 
    isResolving: isResolving || isConfirming, 
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// --- Read Hooks ---

// Get Car Details
export function useCarDetails(tokenId?: bigint) {
  return useContractRead({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    functionName: 'getCarDetails',
    args: tokenId ? [tokenId] : undefined,
    enabled: !!tokenId,
  });
}

// Get Maintenance Records
export function useMaintenanceRecords(tokenId?: bigint) {
  return useContractRead<MaintenanceRecord[]>({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    functionName: 'getMaintenanceRecords',
    args: tokenId ? [tokenId] : undefined,
    enabled: !!tokenId,
  });
}

// Get Insurance Details
export function useInsuranceDetails2(tokenId?: bigint) {
  return useContractRead<InsuranceDetail>({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    functionName: 'getInsuranceDetails',
    args: tokenId ? [tokenId] : undefined,
    enabled: !!tokenId,
  });
}

// Get Issue Reports
export function useIssueReports(tokenId?: bigint) {
  return useContractRead<IssueReport[]>({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    functionName: 'getIssueReports',
    args: tokenId ? [tokenId] : undefined,
    enabled: !!tokenId,
  });
}

// Get TokenId by VIN
export function useTokenIdByVIN(vin?: string) {
  return useContractRead<bigint>({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    functionName: 'getTokenIdByVIN',
    args: vin ? [vin] : undefined,
    enabled: !!vin,
  });
}

// Get TokenId by Registration Number
export function useTokenIdByRegistration(registrationNumber?: string) {
  return useContractRead<bigint>({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    functionName: 'getTokenIdByRegistrationNumber',
    args: registrationNumber ? [registrationNumber] : undefined,
    enabled: !!registrationNumber,
  });
}