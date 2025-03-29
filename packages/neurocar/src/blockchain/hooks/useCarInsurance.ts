"use client"

// src/blockchain/hooks/useCarInsuranceData.ts
import { useWriteContract, useAccount, useWatchContractEvent } from 'wagmi'
import { Address, Log } from 'viem'
import { useState } from 'react'
import { carinsurance_abi, carinsurance_address } from '@/blockchain/abi/neuro'
import {
  ClaimStatus,
  PoolCreatedEvent,
  MemberJoinedEvent,
  ClaimFiledEvent,
  AssessorRegisteredEvent,
  AssessorStatusChangedEvent,
  AssessorAssignedEvent,
  ClaimAssessedEvent,
  ClaimStatusChangedEvent,
  ClaimPaidEvent
} from '@/types'

// Type for Log with specific args property for insurance events
interface LogWithArgs extends Log {
  args?: {
    credentials: string
    poolId?: bigint
    name?: string
    creator?: Address
    member?: Address
    tokenId?: bigint
    contribution?: bigint
    claimId?: bigint
    claimant?: Address
    amount?: bigint
    description?: string
    assessor?: Address
    approved?: boolean
    active?: boolean
    recommendedPayout?: bigint
    recipient?: Address
    status?: number
    role?: string
    account?: Address
    sender?: Address
  }
}

// Zero address constant for fallbacks
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

export function useCarInsuranceData(chainId: number = 296) {
  // First, define hooks
  const { address } = useAccount()
  const { writeContract } = useWriteContract()

  // State variables for events
  const [lastPoolCreatedEvent, setLastPoolCreatedEvent] = useState<PoolCreatedEvent | null>(null)
  const [lastMemberJoinedEvent, setLastMemberJoinedEvent] = useState<MemberJoinedEvent | null>(null)
  const [lastClaimFiledEvent, setLastClaimFiledEvent] = useState<ClaimFiledEvent | null>(null)
  const [lastAssessorRegisteredEvent, setLastAssessorRegisteredEvent] = useState<AssessorRegisteredEvent | null>(null)
  const [lastAssessorStatusChangedEvent, setLastAssessorStatusChangedEvent] = useState<AssessorStatusChangedEvent | null>(null)
  const [lastAssessorAssignedEvent, setLastAssessorAssignedEvent] = useState<AssessorAssignedEvent | null>(null)
  const [lastClaimAssessedEvent, setLastClaimAssessedEvent] = useState<ClaimAssessedEvent | null>(null)
  const [lastClaimStatusChangedEvent, setLastClaimStatusChangedEvent] = useState<ClaimStatusChangedEvent | null>(null)
  const [lastClaimPaidEvent, setLastClaimPaidEvent] = useState<ClaimPaidEvent | null>(null)
  const [lastRoleGrantedEvent, setLastRoleGrantedEvent] = useState<{role: string, account: Address, sender: Address} | null>(null)
  const [lastRoleRevokedEvent, setLastRoleRevokedEvent] = useState<{role: string, account: Address, sender: Address} | null>(null)

  // Event watchers
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'PoolCreated',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastPoolCreatedEvent({
            poolId: log.args.poolId || BigInt(0),
            name: log.args.name || '',
            creator: log.args.creator || ZERO_ADDRESS
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'MemberJoined',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastMemberJoinedEvent({
            poolId: log.args.poolId || BigInt(0),
            member: log.args.member || ZERO_ADDRESS,
            tokenId: log.args.tokenId || BigInt(0),
            contribution: log.args.contribution || BigInt(0)
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'ClaimFiled',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastClaimFiledEvent({
            claimId: log.args.claimId || BigInt(0),
            poolId: log.args.poolId || BigInt(0),
            claimant: log.args.claimant || ZERO_ADDRESS,
            description: log.args.description || ''
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'AssessorRegistered',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastAssessorRegisteredEvent({
            assessor: log.args.assessor || ZERO_ADDRESS,
            name: log.args.name || '',
            credentials: log.args.credentials || ''
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'AssessorStatusChanged',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastAssessorStatusChangedEvent({
            assessor: log.args.assessor || ZERO_ADDRESS,
            active: log.args.active !== undefined ? log.args.active : false
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'AssessorAssigned',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastAssessorAssignedEvent({
            claimId: log.args.claimId || BigInt(0),
            assessor: log.args.assessor || ZERO_ADDRESS
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'ClaimAssessed',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastClaimAssessedEvent({
            claimId: log.args.claimId || BigInt(0),
            assessor: log.args.assessor || ZERO_ADDRESS,
            approved: log.args.approved !== undefined ? log.args.approved : false,
            recommendedPayout: log.args.recommendedPayout || BigInt(0)
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'ClaimStatusChanged',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastClaimStatusChangedEvent({
            claimId: log.args.claimId || BigInt(0),
            status: (log.args.status !== undefined ? log.args.status : 0) as ClaimStatus
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'ClaimPaid',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastClaimPaidEvent({
            claimId: log.args.claimId || BigInt(0),
            recipient: log.args.recipient || ZERO_ADDRESS,
            amount: log.args.amount || BigInt(0)
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'RoleGranted',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastRoleGrantedEvent({
            role: log.args.role || '',
            account: log.args.account || ZERO_ADDRESS,
            sender: log.args.sender || ZERO_ADDRESS
          });
        }
      }
    },
  })
  
  useWatchContractEvent({
    address: carinsurance_address as Address,
    abi: carinsurance_abi,
    eventName: 'RoleRevoked',
    chainId,
    onLogs(logs) {
      if (logs.length > 0) {
        const log = logs[0] as LogWithArgs;
        if (log && log.args) {
          setLastRoleRevokedEvent({
            role: log.args.role || '',
            account: log.args.account || ZERO_ADDRESS,
            sender: log.args.sender || ZERO_ADDRESS
          });
        }
      }
    },
  })

  // Write functions based on ABI

  // Pool Management
  const createPool = async (
    name: string,
    description: string,
    minContribution: bigint | number,
    maxCoverage: bigint | number
  ) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'createPool',
      args: [name, description, BigInt(minContribution), BigInt(maxCoverage)],
      chainId,
    })
  }

  const joinPool = async (
    poolId: bigint | number,
    tokenId: bigint | number,
    contributionAmount: bigint | number
  ) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'joinPool',
      args: [BigInt(poolId), BigInt(tokenId)],
      value: BigInt(contributionAmount),
      chainId,
    })
  }

  const leavePool = async (poolId: bigint | number) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'leavePool',
      args: [BigInt(poolId)],
      chainId,
    })
  }

  // Claims Management
  const fileClaim = async (
    poolId: bigint | number,
    amount: bigint | number,
    description: string,
    evidenceURI: string
  ) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'fileClaim',
      args: [BigInt(poolId), BigInt(amount), description, evidenceURI],
      chainId,
    })
  }

  const finalizeAssessorApprovedClaim = async (claimId: bigint | number) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'finalizeAssessorApprovedClaim',
      args: [BigInt(claimId)],
      chainId,
    })
  }

  const rejectClaim = async (claimId: bigint | number) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'rejectClaim',
      args: [BigInt(claimId)],
      chainId,
    })
  }

  // Assessor Management
  const registerAssessor = async (
    assessorAddress: Address,
    name: string,
    credentials: string
  ) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'registerAssessor',
      args: [assessorAddress, name, credentials],
      chainId,
    })
  }

  const setAssessorStatus = async (
    assessorAddress: Address,
    active: boolean
  ) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'setAssessorStatus',
      args: [assessorAddress, active],
      chainId,
    })
  }

  const assignAssessor = async (
    claimId: bigint | number,
    assessorAddress: Address
  ) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'assignAssessor',
      args: [BigInt(claimId), assessorAddress],
      chainId,
    })
  }

  const submitAssessment = async (
    claimId: bigint | number,
    approved: boolean,
    recommendedPayout: bigint | number,
    evaluationNotes: string
  ) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'submitAssessment',
      args: [BigInt(claimId), approved, BigInt(recommendedPayout), evaluationNotes],
      chainId,
    })
  }

  // Role Management
  const grantRole = async (role: string, account: Address) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'grantRole',
      args: [role, account],
      chainId,
    })
  }
  
  const revokeRole = async (role: string, account: Address) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'revokeRole',
      args: [role, account],
      chainId,
    })
  }
  
  const renounceRole = async (role: string, account: Address) => {
    if (!address) throw new Error('Wallet not connected')

    return writeContract({
      address: carinsurance_address as Address,
      abi: carinsurance_abi,
      functionName: 'renounceRole',
      args: [role, account],
      chainId,
    })
  }

  return {
    // Write operations - Pool management
    createPool,
    joinPool,
    leavePool,
    
    // Write operations - Claims management
    fileClaim,
    finalizeAssessorApprovedClaim,
    rejectClaim,

    // Write operations - Assessor management
    registerAssessor,
    setAssessorStatus,
    assignAssessor,
    submitAssessment,
    
    // Write operations - Role management
    grantRole,
    revokeRole,
    renounceRole,

    // Events
    lastPoolCreatedEvent,
    lastMemberJoinedEvent,
    lastClaimFiledEvent,
    lastAssessorRegisteredEvent,
    lastAssessorStatusChangedEvent,
    lastAssessorAssignedEvent,
    lastClaimAssessedEvent,
    lastClaimStatusChangedEvent,
    lastClaimPaidEvent,
    lastRoleGrantedEvent,
    lastRoleRevokedEvent,

    // Contract address and user info
    contractAddress: carinsurance_address,
    userAddress: address,
  }
}