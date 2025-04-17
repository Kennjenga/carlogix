"use client"

// src/blockchain/hooks/useCarNFTData.ts
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
  }
}

// Zero address constant for fallbacks
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

export function useCarNFTData(chainId: number = 43113) {
  // First, define hooks and state
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // State variables
  const [lastCarMintedEvent, setLastCarMintedEvent] = useState<CarMintedEvent | null>(null);
  const [lastMaintenanceAddedEvent, setLastMaintenanceAddedEvent] = useState<MaintenanceAddedEvent | null>(null);
  const [lastIssueReportedEvent, setLastIssueReportedEvent] = useState<{tokenId: bigint, reportIndex: bigint} | null>(null);
  const [lastIssueResolvedEvent, setLastIssueResolvedEvent] = useState<{tokenId: bigint, reportIndex: bigint} | null>(null);

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

  // Write functions for CarNFT contract based on ABI

  // Mint a new car NFT
  const mintCar = async (
    to: Address,
    vin: string,
    make: string,
    model: string,
    year: bigint | number,
    registrationNumber: string,
    ipfsURI: string // Expecting raw ipfs:// URI
  ) => {
    if (!address) throw new Error('Wallet not connected');
  
    // Convert to HTTPS gateway URL for wallet compatibility
    const gatewayURI = convertIpfsToGatewayUrl(ipfsURI);
  
    return await writeContractAsync({
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
        gatewayURI // Using gateway URL for minting
      ],
      chainId,
    });
  };
  
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

  // Add a maintenance record to a car
  const addMaintenanceRecord = async (
    tokenId: bigint | number,
    description: string,
    serviceProvider: string,
    mileage: bigint | number,
    documentURI: string
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
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

    return await writeContractAsync({
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
    reportIndex: bigint | number
  ) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'resolveIssue',
      args: [BigInt(tokenId), BigInt(reportIndex)],
      chainId,
    });
  };

  // ERC721 standard functions
  const approve = async (to: Address, tokenId: bigint | number) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'approve',
      args: [to, BigInt(tokenId)],
      chainId,
    });
  };

  const setApprovalForAll = async (operator: Address, approved: boolean) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'setApprovalForAll',
      args: [operator, approved],
      chainId,
    });
  };

  const transferFrom = async (from: Address, to: Address, tokenId: bigint | number) => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'transferFrom',
      args: [from, to, BigInt(tokenId)],
      chainId,
    });
  };

  const safeTransferFrom = async (from: Address, to: Address, tokenId: bigint | number, data: string = '') => {
    if (!address) throw new Error('Wallet not connected');

    return await writeContractAsync({
      address: carnft_address as Address,
      abi: carnft_abi as Abi,
      functionName: 'safeTransferFrom',
      args: [from, to, BigInt(tokenId), data],
      chainId,
    });
  };

  return {
    // Write methods - specific to CarNFT
    mintCar,
    addMaintenanceRecord,
    reportIssue,
    resolveIssue,
    
    // Write methods - ERC721 standard
    approve,
    setApprovalForAll,
    transferFrom,
    safeTransferFrom,

    // Events
    lastCarMintedEvent,
    lastMaintenanceAddedEvent,
    lastIssueReportedEvent,
    lastIssueResolvedEvent,

    // Contract info
    contractAddress: carnft_address,
    userAddress: address,
  };
}