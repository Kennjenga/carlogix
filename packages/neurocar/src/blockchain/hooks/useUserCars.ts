import { useState, useEffect } from 'react';
import { Address, createPublicClient, PublicClient, Chain, http } from 'viem';
import { avalancheFuji, sepolia } from 'viem/chains';
import { useAccount } from 'wagmi';
import { carnft_abi, carnft_address } from '@/blockchain/abi/neuro';
import { CarDetails, CarWithId, MaintenanceRecord, InsuranceDetail } from '@/types';

// Define multiple fallback RPC endpoints for Avalanche Fuji
const AVALANCHE_FUJI_RPC_ENDPOINTS = [
  'https://api.avax-test.network/ext/bc/C/rpc',
  'https://avalanche-fuji-c-chain.publicnode.com',
  'https://avalanche-fuji.blockpi.network/v1/rpc/public',
  'https://rpc.ankr.com/avalanche_fuji'
];

// Create client with fallback endpoints using standard Viem http transport
const createClientWithFallbacks = (chain: Chain) => {
  // For Avalanche Fuji, use our defined endpoints with fallbacks
  if (chain.id === 43113) {
    return AVALANCHE_FUJI_RPC_ENDPOINTS.map(endpoint => 
      createPublicClient({
        chain,
        transport: http(endpoint)
      })
    );
  }
  
  // For other chains, just use the default endpoint
  return [createPublicClient({
    chain,
    transport: http()
  })];
};

// Function to try an operation with multiple clients until one succeeds
const tryWithFallbacks = async <T>(
  clients: PublicClient[],
  operation: (client: PublicClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError;
  
  // Try each client
  for (const client of clients) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation(client);
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed, ${error instanceof Error ? error.message : 'unknown error'}`);
        // Add a small delay before retry
        if (attempt < maxRetries - 1) await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  // If all clients failed, throw the last error
  throw lastError;
};

export function useUserCars(ownerAddress?: Address, chainId: number = 43113) {
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
        setError(null);
        
        // Select the chain
        const chain = chainId === 43113 ? avalancheFuji : sepolia;
        
        // Create clients with fallbacks using standard http transport
        const clients = createClientWithFallbacks(chain);
        
        // 1. Get the balance (number of NFTs owned by this address)
        const balance = await tryWithFallbacks(clients, async (client) => {
          return await client.readContract({
            address: carnft_address as Address,
            abi: carnft_abi,
            functionName: 'balanceOf',
            args: [targetAddress]
          }) as bigint;
        });
        
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
            const tokenId = await tryWithFallbacks(clients, async (client) => {
              return await client.readContract({
                address: carnft_address as Address,
                abi: carnft_abi,
                functionName: 'tokenOfOwnerByIndex',
                args: [targetAddress, BigInt(i)]
              }) as bigint;
            });
            
            // Get car details for this token
            const carDetails = await tryWithFallbacks(clients, async (client) => {
              return await client.readContract({
                address: carnft_address as Address,
                abi: carnft_abi,
                functionName: 'getCarDetails',
                args: [tokenId]
              }) as CarDetails;
            });
            
            // Get the latest maintenance record to display current mileage
            let currentMileage = BigInt(0);
            try {
              const maintenanceRecords = await tryWithFallbacks(clients, async (client) => {
                return await client.readContract({
                  address: carnft_address as Address,
                  abi: carnft_abi,
                  functionName: 'getMaintenanceRecords',
                  args: [tokenId]
                }) as MaintenanceRecord[];
              });
              
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
              const insuranceDetails = await tryWithFallbacks(clients, async (client) => {
                return await client.readContract({
                  address: carnft_address as Address,
                  abi: carnft_abi,
                  functionName: 'getInsuranceDetails',
                  args: [tokenId]
                }) as InsuranceDetail;
              });
              
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