"use client";

import { useState, useEffect } from 'react';
import { Address, createPublicClient, http } from 'viem';
import { hederaTestnet, sepolia } from 'viem/chains';
import { useAccount } from 'wagmi';
import { carnft_abi, carnft_address } from '@/blockchain/abi/neuro';
import { CarDetails, CarWithId, MaintenanceRecord } from '@/types';

export function useUserCars(ownerAddress?: Address, chainId: number = 296) {
  const { address: connectedAddress } = useAccount();
  const [cars, setCars] = useState<CarWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the provided address or fall back to the connected wallet address
  const targetAddress = ownerAddress || connectedAddress;

  useEffect(() => {
    const fetchUserCars = async () => {
      if (!targetAddress) {
        setCars([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Create a client to interact with the blockchain
        const client = createPublicClient({
          chain: chainId === 296 ? hederaTestnet : sepolia,
          transport: http()
        });
        
        // 1. Get the balance (number of NFTs owned by this address)
        const balance = await client.readContract({
          address: carnft_address as Address,
          abi: carnft_abi,
          functionName: 'balanceOf',
          args: [targetAddress]
        }) as bigint;
        
        if (balance === BigInt(0)) {
          setCars([]);
          setLoading(false);
          return;
        }
        
        const userCars: CarWithId[] = [];
        
        // 2. For each token index, get the token ID and then the car details
        for (let i = 0; i < Number(balance); i++) {
          try {
            // Get token ID at index i for this owner
            const tokenId = await client.readContract({
              address: carnft_address as Address,
              abi: carnft_abi,
              functionName: 'tokenOfOwnerByIndex',
              args: [targetAddress, BigInt(i)]
            }) as bigint;
            
            // Get car details for this token
            const carDetails = await client.readContract({
              address: carnft_address as Address,
              abi: carnft_abi,
              functionName: 'getCarDetails',
              args: [tokenId]
            }) as CarDetails;
            
            // Get the latest maintenance record to display current mileage
            let currentMileage = BigInt(0);
            try {
              const maintenanceRecords = await client.readContract({
                address: carnft_address as Address,
                abi: carnft_abi,
                functionName: 'getMaintenanceRecords',
                args: [tokenId]
              }) as MaintenanceRecord[];
              
              if (maintenanceRecords.length > 0) {
                // Sort by timestamp descending to get the latest record
                const sortedRecords = [...maintenanceRecords].sort(
                  (a, b) => Number(b.timestamp - a.timestamp)
                );
                currentMileage = sortedRecords[0].mileage;
              }
            } catch (err) {
              console.error(`Error fetching maintenance records for car ${tokenId}:`, err);
            }
            
            userCars.push({
              id: tokenId.toString(),
              tokenId: tokenId,
              mileage: currentMileage,
              ...carDetails
            });
          } catch (e) {
            console.error(`Error fetching car at index ${i}:`, e);
          }
        }
        
        setCars(userCars);
      } catch (err) {
        console.error("Error fetching user cars:", err);
        setError("Failed to load your vehicles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserCars();
  }, [targetAddress, chainId]);

  const refreshCars = () => {
    setLoading(true);
    setError(null);
    // This will trigger the useEffect to run again
    // by creating a new function reference
    setTimeout(() => {
      setCars(prev => [...prev]);
    }, 100);
  };

  return { cars, loading, error, refreshCars };
}