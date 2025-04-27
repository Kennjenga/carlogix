"use client"

import { useWriteContract, useAccount, useWatchContractEvent } from 'wagmi';
import { Abi, Address, Log } from 'viem';
import { useState } from 'react';
import { carnft_abi, carnft_address } from '@/blockchain/abi/neuro';
import { CarMintedEvent, MaintenanceAddedEvent } from '@/types';

// Type for Log with specific args property for Car NFT events
interface LogWithArgs extends Log {
  args?: {
    tokenId?: bigint;
    vin?: string;
    owner?: Address;
    recordIndex?: bigint;
    reportIndex?: bigint;
    from?: Address;
    to?: Address;
    manufacturer?: Address;
    name?: string;
    isActive?: boolean;
    count?: bigint;
    policyNumber?: string;
    provider?: string;
    startDate?: bigint;
    endDate?: bigint;
    documentURI?: string;
    active?: boolean;
    make?: string;
    model?: string;
    year?: bigint;
    registrationNumber?: string;
    imageURI?: string;
    mileage?: bigint;
    serviceProvider?: string;
    issueType?: string;
    resolved?: boolean;
  }
}

// Zero address constant for fallbacks
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

export function useCarNFTData(chainId: number = 43113) {
  // First, define hooks and state
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  // State variables
  const [lastCarMintedEvent, setLastCarMintedEvent] = useState<CarMintedEvent | null>(null);
  const [lastMaintenanceAddedEvent, setLastMaintenanceAddedEvent] = useState<MaintenanceAddedEvent | null>(null);
  const [lastIssueReportedEvent, setLastIssueReportedEvent] = useState<{tokenId: bigint, reportIndex: bigint} | null>(null);
  const [lastIssueResolvedEvent, setLastIssueResolvedEvent] = useState<{tokenId: bigint, reportIndex: bigint} | null>(null);
  const [lastManufacturerAddedEvent, setLastManufacturerAddedEvent] = useState<{manufacturer: Address, name: string} | null>(null);
  const [lastManufacturerStatusChangedEvent, setLastManufacturerStatusChangedEvent] = useState<{manufacturer: Address, isActive: boolean} | null>(null);
  const [lastBulkCarsMintedEvent, setLastBulkCarsMintedEvent] = useState<{manufacturer: Address, count: bigint} | null>(null);
  const [lastInsuranceAddedEvent, setLastInsuranceAddedEvent] = useState<{tokenId: bigint, policyNumber: string} | null>(null);
  const [lastInsuranceUpdatedEvent, setLastInsuranceUpdatedEvent] = useState<{tokenId: bigint, policyNumber: string} | null>(null);
  const [lastTransferEvent, setLastTransferEvent] = useState<{from: Address, to: Address, tokenId: bigint} | null>(null);

  // Event watchers
  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'CarMinted',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastCarMintedEvent({
            tokenId: log.args.tokenId || BigInt(0),
            vin: log.args.vin || '',
            owner: log.args.owner || ZERO_ADDRESS
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'Transfer',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastTransferEvent({
            from: log.args.from || ZERO_ADDRESS,
            to: log.args.to || ZERO_ADDRESS,
            tokenId: log.args.tokenId || BigInt(0)
          });
        }
      }
    },
  });

  // Manufacturer event watchers
  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'ManufacturerAdded',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastManufacturerAddedEvent({
            manufacturer: log.args.manufacturer || ZERO_ADDRESS,
            name: log.args.name || ''
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'ManufacturerStatusChanged',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastManufacturerStatusChangedEvent({
            manufacturer: log.args.manufacturer || ZERO_ADDRESS,
            isActive: log.args.isActive || false
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'BulkCarsMinted',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastBulkCarsMintedEvent({
            manufacturer: log.args.manufacturer || ZERO_ADDRESS,
            count: log.args.count || BigInt(0)
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'MaintenanceAdded',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastMaintenanceAddedEvent({
            tokenId: log.args.tokenId || BigInt(0),
            recordIndex: log.args.recordIndex || BigInt(0)
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'IssueReported',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastIssueReportedEvent({
            tokenId: log.args.tokenId || BigInt(0),
            reportIndex: log.args.reportIndex || BigInt(0)
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'IssueResolved',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastIssueResolvedEvent({
            tokenId: log.args.tokenId || BigInt(0),
            reportIndex: log.args.reportIndex || BigInt(0)
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'InsuranceAdded',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastInsuranceAddedEvent({
            tokenId: log.args.tokenId || BigInt(0),
            policyNumber: log.args.policyNumber || ''
          });
        }
      }
    },
  });

  useWatchContractEvent({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    eventName: 'InsuranceUpdated',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastInsuranceUpdatedEvent({
            tokenId: log.args.tokenId || BigInt(0),
            policyNumber: log.args.policyNumber || ''
          });
        }
      }
    },
  });

  // Helper function to handle IPFS URI conversion
  const convertIpfsToGatewayUrl = (ipfsUri: string): string => {
    // List of reliable public gateways (fallback system)
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ];
  
    if (!ipfsUri.startsWith('ipfs://')) {
      console.warn('URI is not in ipfs:// format, using as-is');
      return ipfsUri;
    }
  
    const cidPath = ipfsUri.replace('ipfs://', '');
    
    // Return the first gateway URL
    return `${gateways[0]}${cidPath}`;
  };

  // Mint a new car NFT
  const mintCar = async (
    to: Address,
    vin: string,
    make: string,
    model: string,
    year: bigint | number,
    registrationNumber: string,
    ipfsURI: string
  ) => {
    if (!address) throw new Error('Wallet not connected');
  
    // Convert to HTTPS gateway URL for wallet compatibility
    const gatewayURI = convertIpfsToGatewayUrl(ipfsURI);
  
    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'mintCar',
      args: [
        to, 
        vin, 
        make, 
        model, 
        BigInt(year), 
        registrationNumber, 
        gatewayURI
      ],
      chainId,
    });
  };

  // Add a maintenance record to a car
  const addMaintenanceRecord = async (
    tokenId: bigint | number,
    description: string,
    serviceProvider: string,
    mileage: bigint | number,
    documentURI: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'addMaintenanceRecord',
      args: [BigInt(tokenId), description, serviceProvider, BigInt(mileage), documentURI],
      chainId,
    });
  };

  // Report an issue with a car
  const reportIssue = async (
    tokenId: bigint | number,
    issueType: string,
    description: string,
    evidenceURI: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'reportIssue',
      args: [BigInt(tokenId), issueType, description, evidenceURI],
      chainId,
    });
  };

  // Resolve a previously reported issue
  const resolveIssue = async (
    tokenId: bigint | number,
    reportIndex: bigint | number,
    resolutionNotes: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'resolveIssue',
      args: [BigInt(tokenId), BigInt(reportIndex), resolutionNotes],
      chainId,
    });
  };

  // Update car information
  const updateCarInfo = async (
    tokenId: bigint | number,
    newImageURI: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    const gatewayURI = convertIpfsToGatewayUrl(newImageURI);

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'updateCarURI',
      args: [BigInt(tokenId), gatewayURI],
      chainId,
    });
  };

  // ERC721 standard functions
  const approve = async (to: Address, tokenId: bigint | number) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'approve',
      args: [to, BigInt(tokenId)],
      chainId,
    });
  };

  const setApprovalForAll = async (operator: Address, approved: boolean) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'setApprovalForAll',
      args: [operator, approved],
      chainId,
    });
  };

  const transferFrom = async (from: Address, to: Address, tokenId: bigint | number) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'transferFrom',
      args: [from, to, BigInt(tokenId)],
      chainId,
    });
  };

  const safeTransferFrom = async (from: Address, to: Address, tokenId: bigint | number, data: string = '') => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'safeTransferFrom',
      args: [from, to, BigInt(tokenId), data],
      chainId,
    });
  };

  // Manufacturer role management functions
  
  // Add a new manufacturer with an active status
  const addManufacturer = async (manufacturerAddress: Address, name: string) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'addManufacturer',
      args: [manufacturerAddress, name],
      chainId,
    });
  };

  // Update a manufacturer's active status
  const setManufacturerStatus = async (manufacturerAddress: Address, isActive: boolean) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'setManufacturerStatus',
      args: [manufacturerAddress, isActive],
      chainId,
    });
  };

  // Check if an address is an active manufacturer
  const isActiveManufacturer = async (manufacturerAddress: Address) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'isActiveManufacturer',
      args: [manufacturerAddress],
      chainId,
    });
  };

  // Bulk mint cars (only available for manufacturers)
  const bulkMintCars = async (
    to: Address[], 
    vin: string[], 
    make: string[], 
    model: string[], 
    year: (bigint | number)[], 
    registrationNumber: string[],
    ipfsURIs: string[]
  ) => {
    if (!address) throw new Error('Wallet not connected');
    
    // Convert all ipfs URIs to gateway URLs
    const gatewayURIs = ipfsURIs.map(uri => convertIpfsToGatewayUrl(uri));
    
    // Convert all years to BigInt
    const yearsBigInt = year.map(y => BigInt(y));
    
    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'bulkMintCars',
      args: [to, vin, make, model, yearsBigInt, registrationNumber, gatewayURIs],
      chainId,
    });
  };

  // Insurance management functions
  const addInsuranceDetails = async (
    tokenId: bigint | number,
    policyNumber: string,
    provider: string,
    startDate: bigint | number,
    endDate: bigint | number,
    documentURI: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'addInsuranceDetails',
      args: [BigInt(tokenId), policyNumber, provider, BigInt(startDate), BigInt(endDate), documentURI],
      chainId,
    });
  };

  const updateInsuranceDetails = async (
    tokenId: bigint | number,
    policyNumber: string,
    provider: string,
    startDate: bigint | number,
    endDate: bigint | number,
    documentURI: string,
    active: boolean
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'updateInsuranceDetails',
      args: [BigInt(tokenId), policyNumber, provider, BigInt(startDate), BigInt(endDate), documentURI, active],
      chainId,
    });
  };

  // Vehicle search functions
  const getCarByVIN = async (vin: string) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'getTokenIdByVIN',
      args: [vin],
      chainId,
    });
  };

  const getCarByRegistration = async (registrationNumber: string) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContract({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'getTokenIdByRegistrationNumber',
      args: [registrationNumber],
      chainId,
    });
  };

  return {
    // Car minting and management
    mintCar,
    updateCarInfo,
    addMaintenanceRecord,
    reportIssue,
    resolveIssue,
    
    // Manufacturer methods
    addManufacturer,
    setManufacturerStatus,
    isActiveManufacturer,
    bulkMintCars,

    // Insurance methods
    addInsuranceDetails,
    updateInsuranceDetails,

    // Vehicle search methods
    getCarByVIN,
    getCarByRegistration,

    // ERC721 standard methods
    approve,
    setApprovalForAll,
    transferFrom,
    safeTransferFrom,

    // Events
    lastCarMintedEvent,
    lastMaintenanceAddedEvent,
    lastIssueReportedEvent,
    lastIssueResolvedEvent,
    lastManufacturerAddedEvent,
    lastManufacturerStatusChangedEvent,
    lastBulkCarsMintedEvent,
    lastInsuranceAddedEvent,
    lastInsuranceUpdatedEvent,
    lastTransferEvent,

    // Helper function
    convertIpfsToGatewayUrl,

    // Contract info
    contractAddress: carnft_address,
    userAddress: address,
  };
}