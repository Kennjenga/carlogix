import { useState } from 'react';
import { prepareContractCall, sendTransaction, waitForReceipt } from 'thirdweb';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { carNFTContract } from '../config/contracts';

// Types for hook parameters
interface UseAddMaintenanceRecordProps {
  tokenId: bigint;
  description: string;
  serviceProvider: string;
  mileage: bigint;
  documentURI: string;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface UseMintCarProps {
  to: string;
  vin: string;
  make: string;
  model: string;
  year: bigint;
  registrationNumber: string;
  imageURI: string;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

interface UseInsuranceDetailsProps {
  tokenId: bigint;
  policyNumber: string;
  provider: string;
  startDate: bigint;
  endDate: bigint;
  documentURI: string;
  isUpdate?: boolean;
  active?: boolean;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export function useAddMaintenanceRecord() {
  const account = useActiveAccount();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { mutateAsync: sendTx } = useSendTransaction();

  const addRecord = async ({ 
    tokenId, 
    description, 
    serviceProvider, 
    mileage, 
    documentURI, 
    onSuccess, 
    onError 
  }: UseAddMaintenanceRecordProps) => {
    if (!account) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsAdding(true);
    setError(null);

    try {
      const transaction = prepareContractCall({
        contract: carNFTContract,
        method: 'addMaintenanceRecord',
        params: [tokenId, description, serviceProvider, mileage, documentURI]
      });

      const { transactionHash } = await sendTx(transaction);
      
      // Wait for transaction confirmation
      await waitForReceipt({
        client: carNFTContract.client,
        chain: carNFTContract.chain,
        transactionHash,
      });

      if (onSuccess) onSuccess(transactionHash);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsAdding(false);
    }
  };

  const clearError = () => setError(null);

  return { 
    addRecord, 
    isAdding, 
    error,
    clearError 
  };
}

export function useMintCar() {
  const account = useActiveAccount();
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { mutateAsync: sendTx } = useSendTransaction();

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
    if (!account) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }

    setIsMinting(true);
    setError(null);

    try {
      const transaction = prepareContractCall({
        contract: carNFTContract,
        method: 'mintCar',
        params: [to, vin, make, model, year, registrationNumber, imageURI]
      });

      const { transactionHash } = await sendTx(transaction);
      
      // Wait for transaction confirmation
      await waitForReceipt({
        client: carNFTContract.client,
        chain: carNFTContract.chain,
        transactionHash,
      });

      if (onSuccess) onSuccess(transactionHash);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsMinting(false);
    }
  };

  const clearError = () => setError(null);

  return { 
    mintCar, 
    isMinting, 
    error,
    clearError 
  };
}

export function useInsuranceDetails() {
  const account = useActiveAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { mutateAsync: sendTx } = useSendTransaction();

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
    if (!account) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (onError) onError(err);
        return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const method = isUpdate ? 'updateInsuranceDetails' : 'addInsuranceDetails';
      const params = isUpdate 
        ? [tokenId, policyNumber, provider, startDate, endDate, documentURI, active]
        : [tokenId, policyNumber, provider, startDate, endDate, documentURI];

      const transaction = prepareContractCall({
        contract: carNFTContract,
        method,
        params
      });

      const { transactionHash } = await sendTx(transaction);
      
      // Wait for transaction confirmation
      await waitForReceipt({
        client: carNFTContract.client,
        chain: carNFTContract.chain,
        transactionHash,
      });

      if (onSuccess) onSuccess(transactionHash);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearError = () => setError(null);

  return { 
    processInsurance, 
    isProcessing, 
    error,
    clearError 
  };
}
