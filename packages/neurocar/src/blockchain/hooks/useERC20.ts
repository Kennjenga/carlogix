import { useState } from 'react';
import { type Address, type Hash } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { usdt_abi } from '@/blockchain/abi/neuro'; // Assuming USDT ABI is in neuro.ts

interface UseApproveTokenProps {
  tokenAddress: Address;
  spenderAddress: Address;
  amount: bigint;
  onSuccess?: (hash: Hash) => void;
  onError?: (error: Error) => void;
}

export function useApproveToken() {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  const approve = async ({ tokenAddress, spenderAddress, amount, onSuccess, onError }: UseApproveTokenProps) => {
    setIsApproving(true);
    setError(null);
    try {
      writeContract({
        address: tokenAddress,
        abi: usdt_abi, // Use the minimal USDT ABI
        functionName: 'approve',
        args: [spenderAddress, amount],
      }, {
        onSuccess: (txHash) => {
          console.log('Approval transaction sent:', txHash);
          if (onSuccess) onSuccess(txHash);
        },
        onError: (err) => {
          console.error('Approval error:', err);
          setError(err);
          setIsApproving(false);
          if (onError) onError(err);
        },
      });
      // Note: isApproving state might need refinement based on transaction confirmation
      // For now, it reflects sending the transaction. We can use isConfirming/isConfirmed for more detail.
    } catch (err) {
      console.error('Failed to send approval transaction:', err);
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      setIsApproving(false);
      if (onError) onError(error);
    } finally {
       // Consider setting isApproving based on confirmation status if needed
       // setIsApproving(false); // Or keep true until confirmed/failed?
    }
  };
  
   // Reset error state manually if needed
  const clearError = () => setError(null);

  return { 
    approve, 
    isApproving: isApproving || isConfirming, // Combine sending and confirming states
    isConfirmed,
    hash, 
    error,
    clearError 
  };
}

// Example Usage (inside a component):
// const { approve, isApproving, error } = useApproveToken();
// const handleApprove = () => {
//   approve({
//     tokenAddress: usdt_address, // from neuro.ts
//     spenderAddress: carmarketplace_address, // from neuro.ts
//     amount: parseUnits('1000', 6), // Example: Approve 1000 USDT (assuming 6 decimals)
//     onSuccess: (hash) => alert(`Approval successful: ${hash}`),
//     onError: (err) => alert(`Approval failed: ${err.message}`),
//   });
// };
