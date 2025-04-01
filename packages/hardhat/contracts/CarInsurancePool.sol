// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./CarNFT.sol";

/**
 * @title CarInsurancePool
 * @dev Contract for managing decentralized car insurance pools with certified assessors
 */
contract CarInsurancePool is AccessControlEnumerable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ASSESSOR_ROLE = keccak256("ASSESSOR_ROLE");

    // Counter for pool IDs
    Counters.Counter private _poolIds;

    // Counter for claim IDs
    Counters.Counter private _claimIds;

    // Reference to the CarNFT contract
    CarNFT public carNFTContract;

    // Struct for certified assessor details
    struct Assessor {
        string name;
        string credentials;
        uint256 registeredAt;
        bool active;
        uint256 completedAssessments;
    }

    // Struct for assessor evaluation
    struct AssessorEvaluation {
        address assessor;
        uint256 recommendedPayout;
        string evaluationNotes;
        uint256 timestamp;
        bool approved;
    }

    // Struct for insurance pool
    struct InsurancePool {
        string name;
        string description;
        uint256 minContribution;
        uint256 maxCoverage;
        uint256 totalBalance;
        uint256 memberCount;
        uint256 createdAt;
        bool active;
    }

    // Struct for pool membership
    struct PoolMembership {
        uint256 tokenId; // Car NFT token ID
        uint256 contribution;
        uint256 coverageLimit;
        uint256 joinedAt;
        bool active;
    }

    // Claim status
    enum ClaimStatus {
        Pending,
        UnderAssessment,
        AssessorApproved,
        AssessorRejected,
        Approved,
        Rejected,
        Paid
    }

    // Struct for insurance claim
    struct InsuranceClaim {
        uint256 poolId;
        uint256 tokenId;
        address claimant;
        uint256 amount;
        string description;
        string evidenceURI;
        uint256 createdAt;
        ClaimStatus status;
        address assignedAssessor;
        uint256 recommendedPayout;
        uint256 payoutAmount;
        string rejectionReason;
    }

    // Struct for contribution record
    struct ContributionRecord {
        uint256 timestamp;
        uint256 amount;
        uint256 poolId;
        string contributionType; // "Initial", "Monthly", etc.
    }

    // Mapping from address to assessor details
    mapping(address => Assessor) private _assessors;

    // Mapping from claim ID to assessor evaluations
    mapping(uint256 => AssessorEvaluation[]) private _claimEvaluations;

    // Mapping from pool ID to pool details
    mapping(uint256 => InsurancePool) private _insurancePools;

    // Mapping from pool ID to member address to membership details
    mapping(uint256 => mapping(address => PoolMembership))
        private _poolMemberships;

    // Mapping from claim ID to claim details
    mapping(uint256 => InsuranceClaim) private _insuranceClaims;

    // Mapping from pool ID to member addresses
    mapping(uint256 => address[]) private _poolMembers;

    // Mapping from address to array of pool IDs they're members of
    mapping(address => uint256[]) private _memberPools;

    // Mapping from tokenId to array of claim IDs
    mapping(uint256 => uint256[]) private _tokenClaims;

    // Mapping from pool ID to member address to contribution records
    mapping(uint256 => mapping(address => ContributionRecord[]))
        private _contributionRecords;

    // Events
    event PoolCreated(uint256 indexed poolId, string name, address creator);
    event MemberJoined(
        uint256 indexed poolId,
        address indexed member,
        uint256 tokenId,
        uint256 contribution
    );
    event ClaimFiled(
        uint256 indexed claimId,
        uint256 indexed poolId,
        address indexed claimant,
        string description
    );
    event AssessorRegistered(
        address indexed assessor,
        string name,
        string credentials
    );
    event AssessorStatusChanged(address indexed assessor, bool active);
    event AssessorAssigned(uint256 indexed claimId, address indexed assessor);
    event ClaimAssessed(
        uint256 indexed claimId,
        address indexed assessor,
        bool approved,
        uint256 recommendedPayout
    );
    event ClaimStatusChanged(uint256 indexed claimId, ClaimStatus status);
    event ClaimPaid(
        uint256 indexed claimId,
        address indexed recipient,
        uint256 amount
    );
    event AdditionalContribution(
        uint256 indexed poolId,
        address indexed member,
        uint256 amount
    );
    event AssessorRoleRevoked(address indexed assessor);

    /**
     * @dev Constructor
     * @param _carNFTAddress Address of the CarNFT contract
     */
    constructor(address _carNFTAddress) {
        carNFTContract = CarNFT(_carNFTAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Assessor management functions

    /**
     * @dev Register a new certified assessor
     * @param assessor Address of the assessor
     * @param name Name of the assessor
     * @param credentials Professional credentials
     */
    function registerAssessor(
        address assessor,
        string memory name,
        string memory credentials
    ) public onlyRole(ADMIN_ROLE) {
        require(assessor != address(0), "Invalid assessor address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(credentials).length > 0, "Credentials cannot be empty");

        _assessors[assessor] = Assessor({
            name: name,
            credentials: credentials,
            registeredAt: block.timestamp,
            active: true,
            completedAssessments: 0
        });

        _grantRole(ASSESSOR_ROLE, assessor);

        emit AssessorRegistered(assessor, name, credentials);
    }

    /**
     * @dev Set the status of an assessor (active or inactive)
     * @param assessor Address of the assessor
     * @param active Whether the assessor should be active
     */
    function setAssessorStatus(
        address assessor,
        bool active
    ) public onlyRole(ADMIN_ROLE) {
        require(hasRole(ASSESSOR_ROLE, assessor), "Not an assessor");

        Assessor storage assessorData = _assessors[assessor];
        assessorData.active = active;

        emit AssessorStatusChanged(assessor, active);
    }

    /**
     * @dev Revoke assessor role completely
     * @param assessor Address of the assessor to revoke
     */
    function revokeAssessorRole(address assessor) public onlyRole(ADMIN_ROLE) {
        require(hasRole(ASSESSOR_ROLE, assessor), "Not an assessor");

        // Revoke the role
        revokeRole(ASSESSOR_ROLE, assessor);

        // Update the assessor's status
        Assessor storage assessorData = _assessors[assessor];
        assessorData.active = false;

        emit AssessorRoleRevoked(assessor);
    }

    /**
     * @dev Get assessor details
     * @param assessor Address of the assessor
     */
    function getAssessorDetails(
        address assessor
    ) public view returns (Assessor memory) {
        return _assessors[assessor];
    }

    // Pool management functions

    /**
     * @dev Create a new insurance pool
     * @param name Name of the pool
     * @param description Description of the pool
     * @param minContribution Minimum contribution required to join
     * @param maxCoverage Maximum coverage limit per member
     */
    function createPool(
        string memory name,
        string memory description,
        uint256 minContribution,
        uint256 maxCoverage
    ) public onlyRole(ADMIN_ROLE) returns (uint256) {
        require(
            minContribution > 0,
            "Minimum contribution must be greater than 0"
        );
        require(
            maxCoverage > minContribution,
            "Maximum coverage must be greater than minimum contribution"
        );

        _poolIds.increment();
        uint256 newPoolId = _poolIds.current();

        _insurancePools[newPoolId] = InsurancePool({
            name: name,
            description: description,
            minContribution: minContribution,
            maxCoverage: maxCoverage,
            totalBalance: 0,
            memberCount: 0,
            createdAt: block.timestamp,
            active: true
        });

        emit PoolCreated(newPoolId, name, msg.sender);

        return newPoolId;
    }

    /**
     * @dev Join an insurance pool
     * @param poolId ID of the pool to join
     * @param tokenId ID of the car NFT
     */
    function joinPool(
        uint256 poolId,
        uint256 tokenId
    ) public payable nonReentrant {
        InsurancePool storage pool = _insurancePools[poolId];
        require(pool.active, "Pool is not active");
        require(
            msg.value >= pool.minContribution,
            "Contribution below minimum"
        );
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the owner of the car NFT"
        );

        // Calculate coverage limit based on contribution
        uint256 coverageLimit = (msg.value * pool.maxCoverage) /
            pool.minContribution;
        if (coverageLimit > pool.maxCoverage) {
            coverageLimit = pool.maxCoverage;
        }

        // Check if already a member
        PoolMembership storage membership = _poolMemberships[poolId][
            msg.sender
        ];
        if (membership.tokenId == 0) {
            // New member
            _poolMembers[poolId].push(msg.sender);
            _memberPools[msg.sender].push(poolId);
            pool.memberCount++;
        }

        // Update or create membership
        _poolMemberships[poolId][msg.sender] = PoolMembership({
            tokenId: tokenId,
            contribution: msg.value,
            coverageLimit: coverageLimit,
            joinedAt: block.timestamp,
            active: true
        });

        // Update pool balance
        pool.totalBalance += msg.value;

        // Record the initial contribution
        _contributionRecords[poolId][msg.sender].push(
            ContributionRecord({
                timestamp: block.timestamp,
                amount: msg.value,
                poolId: poolId,
                contributionType: "Initial"
            })
        );

        emit MemberJoined(poolId, msg.sender, tokenId, msg.value);
    }

    /**
     * @dev File an insurance claim
     * @param poolId ID of the insurance pool
     * @param amount Claim amount
     * @param description Detailed description of the incident
     * @param evidenceURI IPFS URI to evidence documents and images
     */
    function fileClaim(
        uint256 poolId,
        uint256 amount,
        string memory description,
        string memory evidenceURI
    ) public nonReentrant returns (uint256) {
        InsurancePool storage pool = _insurancePools[poolId];
        require(pool.active, "Pool is not active");

        PoolMembership storage membership = _poolMemberships[poolId][
            msg.sender
        ];
        require(membership.active, "Not an active member of this pool");
        require(
            amount <= membership.coverageLimit,
            "Claim amount exceeds coverage limit"
        );
        require(
            amount <= pool.totalBalance,
            "Claim amount exceeds pool balance"
        );

        // Check if the car exists and is owned by the claimant
        uint256 tokenId = membership.tokenId;
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the owner of the car NFT"
        );

        _claimIds.increment();
        uint256 newClaimId = _claimIds.current();

        // Get the member's contribution percentage of the pool
        uint256 contributionPercentage = (membership.contribution * 100) /
            pool.totalBalance;

        // Calculate the claim amount based on contribution percentage and pool balance
        uint256 claimAmount = (contributionPercentage * pool.totalBalance) /
            100;

        // Cap the claim amount based on coverage limit and requested amount
        uint256 maxClaimAmount = (claimAmount < membership.coverageLimit)
            ? claimAmount
            : membership.coverageLimit;
        maxClaimAmount = (maxClaimAmount < amount) ? maxClaimAmount : amount;

        _insuranceClaims[newClaimId] = InsuranceClaim({
            poolId: poolId,
            tokenId: tokenId,
            claimant: msg.sender,
            amount: maxClaimAmount,
            description: description,
            evidenceURI: evidenceURI,
            createdAt: block.timestamp,
            status: ClaimStatus.Pending,
            assignedAssessor: address(0),
            recommendedPayout: 0,
            payoutAmount: 0,
            rejectionReason: ""
        });

        _tokenClaims[tokenId].push(newClaimId);

        // Store the contribution-adjusted amount
        _insuranceClaims[newClaimId].amount = maxClaimAmount;

        emit ClaimFiled(newClaimId, poolId, msg.sender, description);

        return newClaimId;
    }

    /**
     * @dev Assign an assessor to a claim
     * @param claimId ID of the claim
     * @param assessor Address of the assessor
     */
    function assignAssessor(
        uint256 claimId,
        address assessor
    ) public onlyRole(ADMIN_ROLE) {
        InsuranceClaim storage claim = _insuranceClaims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");
        require(hasRole(ASSESSOR_ROLE, assessor), "Not a certified assessor");
        require(_assessors[assessor].active, "Assessor is not active");

        claim.assignedAssessor = assessor;
        claim.status = ClaimStatus.UnderAssessment;

        emit AssessorAssigned(claimId, assessor);
        emit ClaimStatusChanged(claimId, ClaimStatus.UnderAssessment);
    }

    /**
     * @dev Submit an assessment for a claim
     * @param claimId ID of the claim
     * @param approved Whether the claim is approved
     * @param recommendedPayout Recommended payout amount
     * @param evaluationNotes Notes about the assessment
     */
    function submitAssessment(
        uint256 claimId,
        bool approved,
        uint256 recommendedPayout,
        string memory evaluationNotes
    ) public {
        InsuranceClaim storage claim = _insuranceClaims[claimId];
        require(
            claim.status == ClaimStatus.UnderAssessment,
            "Claim is not under assessment"
        );
        require(
            claim.assignedAssessor == msg.sender,
            "Not the assigned assessor"
        );
        require(hasRole(ASSESSOR_ROLE, msg.sender), "Not a certified assessor");

        if (approved) {
            require(
                recommendedPayout > 0,
                "Recommended payout must be greater than 0"
            );
            require(
                recommendedPayout <= claim.amount,
                "Payout cannot exceed claim amount"
            );

            InsurancePool storage pool = _insurancePools[claim.poolId];
            require(
                recommendedPayout <= pool.totalBalance,
                "Payout exceeds pool balance"
            );

            claim.recommendedPayout = recommendedPayout;
            claim.status = ClaimStatus.AssessorApproved;
        } else {
            claim.status = ClaimStatus.AssessorRejected;
            claim.rejectionReason = evaluationNotes;
        }

        // Record the evaluation
        _claimEvaluations[claimId].push(
            AssessorEvaluation({
                assessor: msg.sender,
                recommendedPayout: recommendedPayout,
                evaluationNotes: evaluationNotes,
                timestamp: block.timestamp,
                approved: approved
            })
        );

        // Update assessor statistics
        _assessors[msg.sender].completedAssessments++;

        emit ClaimAssessed(claimId, msg.sender, approved, recommendedPayout);
        emit ClaimStatusChanged(claimId, claim.status);
    }

    /**
     * @dev Finalize an assessor-approved claim
     * @param claimId ID of the claim
     */
    function finalizeAssessorApprovedClaim(
        uint256 claimId
    ) public onlyRole(ADMIN_ROLE) {
        InsuranceClaim storage claim = _insuranceClaims[claimId];
        require(
            claim.status == ClaimStatus.AssessorApproved,
            "Claim is not assessor-approved"
        );

        claim.status = ClaimStatus.Approved;
        emit ClaimStatusChanged(claimId, ClaimStatus.Approved);

        // Process payment
        InsurancePool storage pool = _insurancePools[claim.poolId];
        uint256 payoutAmount = claim.recommendedPayout;

        pool.totalBalance -= payoutAmount;
        claim.payoutAmount = payoutAmount;
        claim.status = ClaimStatus.Paid;

        emit ClaimStatusChanged(claimId, ClaimStatus.Paid);
        emit ClaimPaid(claimId, claim.claimant, payoutAmount);

        // Transfer funds to claimant
        (bool success, ) = payable(claim.claimant).call{value: payoutAmount}(
            ""
        );
        require(success, "Transfer failed");
    }

    /**
     * @dev Reject a claim even if assessor approved it
     * @param claimId ID of the claim
     */
    function rejectClaim(uint256 claimId) public onlyRole(ADMIN_ROLE) {
        InsuranceClaim storage claim = _insuranceClaims[claimId];
        require(
            claim.status == ClaimStatus.AssessorApproved ||
                claim.status == ClaimStatus.AssessorRejected,
            "Claim is not assessed yet"
        );

        claim.status = ClaimStatus.Rejected;
        emit ClaimStatusChanged(claimId, ClaimStatus.Rejected);
    }

    /**
     * @dev Get assessor evaluations for a claim
     * @param claimId ID of the claim
     */
    function getClaimEvaluations(
        uint256 claimId
    ) public view returns (AssessorEvaluation[] memory) {
        return _claimEvaluations[claimId];
    }

    /**
     * @dev Get claim details
     * @param claimId ID of the claim
     */
    function getClaimDetails(
        uint256 claimId
    ) public view returns (InsuranceClaim memory) {
        return _insuranceClaims[claimId];
    }

    /**
     * @dev Get all claims for a car
     * @param tokenId ID of the car NFT
     */
    function getCarClaims(
        uint256 tokenId
    ) public view returns (uint256[] memory) {
        return _tokenClaims[tokenId];
    }

    /**
     * @dev Get pool details
     * @param poolId ID of the pool
     */
    function getPoolDetails(
        uint256 poolId
    ) public view returns (InsurancePool memory) {
        return _insurancePools[poolId];
    }

    /**
     * @dev Get membership details
     * @param poolId ID of the pool
     * @param member Address of the member
     */
    function getMembershipDetails(
        uint256 poolId,
        address member
    ) public view returns (PoolMembership memory) {
        return _poolMemberships[poolId][member];
    }

    /**
     * @dev Get all pools a member is part of
     * @param member Address of the member
     */
    function getMemberPools(
        address member
    ) public view returns (uint256[] memory) {
        return _memberPools[member];
    }

    /**
     * @dev Leave an insurance pool
     * @param poolId ID of the pool to leave
     */
    function leavePool(uint256 poolId) public nonReentrant {
        PoolMembership storage membership = _poolMemberships[poolId][
            msg.sender
        ];
        require(membership.active, "Not an active member of this pool");

        // Check for any pending claims
        uint256 tokenId = membership.tokenId;
        for (uint256 i = 0; i < _tokenClaims[tokenId].length; i++) {
            uint256 claimId = _tokenClaims[tokenId][i];
            InsuranceClaim storage claim = _insuranceClaims[claimId];
            if (claim.poolId == poolId) {
                require(
                    claim.status != ClaimStatus.Pending &&
                        claim.status != ClaimStatus.UnderAssessment,
                    "Cannot leave with pending or under assessment claims"
                );
            }
        }

        // Deactivate membership
        membership.active = false;

        // Adjust member count
        InsurancePool storage pool = _insurancePools[poolId];
        pool.memberCount--;

        // Calculate refund amount (95% of contribution)
        uint256 refundAmount = (membership.contribution * 95) / 100;

        // Calculate admin fee (5% of contribution)
        uint256 adminFee = membership.contribution - refundAmount;

        if (refundAmount > 0 && refundAmount <= pool.totalBalance) {
            pool.totalBalance -= membership.contribution;

            // Transfer refund to member
            (bool successRefund, ) = payable(msg.sender).call{
                value: refundAmount
            }("");
            require(successRefund, "Refund transfer failed");

            // Transfer fee to admin
            (bool successFee, ) = payable(
                this.getRoleMember(DEFAULT_ADMIN_ROLE, 0)
            ).call{value: adminFee}("");
            require(successFee, "Admin fee transfer failed");
        }
    }

    /**
     * @dev Make an additional contribution to a pool you're already a member of
     * @param poolId ID of the pool to contribute to
     */
    function contributeToPool(uint256 poolId) public payable nonReentrant {
        require(_insurancePools[poolId].active, "Pool is not active");

        PoolMembership storage membership = _poolMemberships[poolId][
            msg.sender
        ];
        require(membership.active, "Not a member of this pool");

        // Update the pool balance
        _insurancePools[poolId].totalBalance += msg.value;

        // Update the member's contribution
        membership.contribution += msg.value;

        // Update coverage limit based on new contribution
        membership.coverageLimit =
            (membership.contribution * _insurancePools[poolId].maxCoverage) /
            _insurancePools[poolId].minContribution;

        // Record the contribution
        _contributionRecords[poolId][msg.sender].push(
            ContributionRecord({
                timestamp: block.timestamp,
                amount: msg.value,
                poolId: poolId,
                contributionType: "Monthly"
            })
        );

        // Emit an event for the contribution
        emit AdditionalContribution(poolId, msg.sender, msg.value);
    }

    /**
     * @dev Get contribution history for a member
     * @param poolId ID of the pool
     * @param member Address of the member
     */
    function getMemberContributionHistory(
        uint256 poolId,
        address member
    ) public view returns (ContributionRecord[] memory) {
        return _contributionRecords[poolId][member];
    }
}
