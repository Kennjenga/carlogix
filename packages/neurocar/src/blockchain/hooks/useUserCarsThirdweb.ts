import { useState, useEffect } from 'react';
import { readContract } from 'thirdweb';
import { useActiveAccount } from 'thirdweb/react';
import { carNFTContract } from '../config/contracts';
import { CarDetails, CarWithId, MaintenanceRecord, InsuranceDetail } from '@/types';

export function useUserCars(ownerAddress?: string, chainId: number = 43113) {
  const account = useActiveAccount();
  const [cars, setCars] = useState<CarWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use the provided address or fall back to the connected wallet address
  const targetAddress = ownerAddress || account?.address;

  useEffect(() => {
    const fetchUserCars = async () => {
      if (!targetAddress) {
        setCars([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 1. Get the balance (number of NFTs owned by this address)
        const balance = await readContract({
          contract: carNFTContract,
          method: 'balanceOf',
          params: [targetAddress]
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
            const tokenId = await readContract({
              contract: carNFTContract,
              method: 'tokenOfOwnerByIndex',
              params: [targetAddress, BigInt(i)]
            }) as bigint;
            
            // Get car details for this token
            const carDetails = await readContract({
              contract: carNFTContract,
              method: 'getCarDetails',
              params: [tokenId]
            }) as CarDetails;
            
            // Get the latest maintenance record to display current mileage
            let currentMileage = BigInt(0);
            try {
              const maintenanceRecords = await readContract({
                contract: carNFTContract,
                method: 'getMaintenanceRecords',
                params: [tokenId]
              }) as MaintenanceRecord[];
              
              if (maintenanceRecords.length > 0) {
                // Sort by timestamp descending to get the latest record
                const sortedRecords = [...maintenanceRecords].sort(
                  (a, b) => Number(b.timestamp - a.timestamp)
                );
                currentMileage = sortedRecords[0].mileage;
              }
            } catch (error) {
              console.error(`Error fetching maintenance records for car ${tokenId}:`, error);
            }
            
            // Get insurance details if available
            let insuranceData = null;
            try {
              const insuranceDetails = await readContract({
                contract: carNFTContract,
                method: 'getInsuranceDetails',
                params: [tokenId]
              }) as InsuranceDetail;
              
              insuranceData = insuranceDetails;
            } catch {
              console.warn(`No insurance details found for car ${tokenId}`);
            }
            
            userCars.push({
              id: tokenId.toString(),
              tokenId: tokenId,
              mileage: currentMileage,
              insuranceDetails: insuranceData,
              ...carDetails
            });
          } catch (error) {
            console.error(`Error fetching car at index ${i}:`, error);
          }
        }
        
        setCars(userCars);
      } catch (error) {
        console.error("Error fetching user cars:", error);
        setError(
          "Failed to connect to the blockchain. Please check your network connection and try again."
        );
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
    setTimeout(() => {
      setCars(prev => [...prev]);
    }, 100);
  };

  return { cars, loading, error, refreshCars };
}
