// /types/contracts.ts
import { Address } from 'viem';

// ======= CarNFT Types =======

export type CarDetails = {
  vin: string;
  make: string;
  model: string;
  year: bigint;
  registrationNumber: string;
  metadataURI: string;
  createdAt: bigint;
}

export type MaintenanceRecord = {
  timestamp: bigint;
  description: string;
  serviceProvider: string;
  mileage: bigint;
  documentURI: string;
}

export type IssueReport = {
  timestamp: bigint;
  issueType: string;
  description: string;
  resolved: boolean;
  evidenceURI: string;
}

export type CarWithId = CarDetails & { tokenId: bigint; id: string; mileage: bigint; };

// ======= Car Insurance Types =======

export enum ClaimStatus {
  Pending = 0,
  UnderAssessment = 1,
  AssessorApproved = 2,
  AssessorRejected = 3,
  Approved = 4,
  Rejected = 5,
  Paid = 6,
  UnderReview
}

export type InsurancePool = {
  name: string;
  description: string;
  minContribution: bigint;
  maxCoverage: bigint;
  totalBalance: bigint;
  memberCount: bigint;
  createdAt: bigint;
  active: boolean;
}

export type PoolMembership = {
  tokenId: bigint;
  contribution: bigint;
  coverageLimit: bigint;
  joinedAt: bigint;
  active: boolean;
}

export type InsuranceClaim = {
  poolId: bigint;
  tokenId: bigint;
  claimant: Address;
  amount: bigint;
  description: string;
  evidenceURI: string;
  createdAt: bigint;
  status: ClaimStatus;
  assignedAssessor: Address;
  recommendedPayout: bigint;
  payoutAmount: bigint;
  rejectionReason: string;
}

export type Assessor = {
  name: string;
  credentials: string;
  registeredAt: bigint;
  active: boolean;
  completedAssessments: bigint;
}

export type AssessorEvaluation = {
  assessor: Address;
  recommendedPayout: bigint;
  evaluationNotes: string;
  timestamp: bigint;
  approved: boolean;
}

// ======= Event Types =======

// CarNFT Events
export type CarMintedEvent = {
  tokenId: bigint;
  vin: string;
  owner: Address;
}

export type MaintenanceAddedEvent = {
  tokenId: bigint;
  recordIndex: bigint;
}

export type IssueReportedEvent = {
  tokenId: bigint;
  reportIndex: bigint;
}

export type IssueResolvedEvent = {
  tokenId: bigint;
  reportIndex: bigint;
}

// Manufacturer Events
export type ManufacturerAddedEvent = {
  manufacturer: Address;
  name: string;
}

export type ManufacturerStatusChangedEvent = {
  manufacturer: Address;
  isActive: boolean;
}

export type BulkCarsMintedEvent = {
  manufacturer: Address;
  count: bigint;
}

// Insurance Events
export type PoolCreatedEvent = {
  poolId: bigint;
  name: string;
  creator: Address;
}

export type MemberJoinedEvent = {
  poolId: bigint;
  member: Address;
  tokenId: bigint;
  contribution: bigint;
}

export type ClaimFiledEvent = {
  claimId: bigint;
  poolId: bigint;
  claimant: Address;
  description: string;
}

export type AssessorRegisteredEvent = {
  assessor: Address;
  name: string;
  credentials: string;
}

export type AssessorStatusChangedEvent = {
  assessor: Address;
  active: boolean;
}

export type AssessorAssignedEvent = {
  claimId: bigint;
  assessor: Address;
}

export type ClaimAssessedEvent = {
  claimId: bigint;
  assessor: Address;
  approved: boolean;
  recommendedPayout: bigint;
}

export type ClaimStatusChangedEvent = {
  claimId: bigint;
  status: ClaimStatus;
}

export type ClaimPaidEvent = {
  claimId: bigint;
  recipient: Address;
  amount: bigint;
}

export type ManufacturerDetails = {
  name: string;
  isActive: boolean;
}

export interface Mechanic {
  id: number;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  rating: number;
  specialization: string;
}