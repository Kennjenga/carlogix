"use client"

import { useReadContract } from 'wagmi';
import { type Address, type Abi } from 'viem';

interface UseReadContractProps<T, TArgs = unknown, TData = unknown> {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: TArgs[];
  enabled?: boolean;
  watch?: boolean;
  select?: (data: TData) => T;
}

export function useContractRead<T, TArgs = unknown, TData = unknown>({
  address,
  abi,
  functionName,
  args = [],
  enabled = true,
  watch = false,
  select,
}: UseReadContractProps<T, TArgs, TData>) {
  return useReadContract({
    address,
    abi,
    functionName,
    args,
    query: {
      enabled,
      select: select as ((data: unknown) => T) | undefined,
      ...(watch ? { refetchInterval: 5000 } : {}),
    },
  });
}