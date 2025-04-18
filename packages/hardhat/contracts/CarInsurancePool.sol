// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./CarNFT.sol";

/**
 * @title DecentralizedVehicleInsurance
 * @dev A comprehensive decentralized insurance system for vehicles
 */
contract DecentralizedVehicleInsurance is
    AccessControlEnumerable,
    ReentrancyGuard
{
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ASSESSOR_ROLE = keccak256("ASSESSOR_ROLE");

    // Counters
    Counters.Counter private _membershipIds;
    Counters.Counter private _claimIds;

    // State variables
    CarNFT public immutable carNFTContract;

    // Enums
    enum MembershipStatus {
        Inactive,
        Active,
        Suspended
    }

    enum ClaimStatus {
        Pending, // Initial state
        UnderAssessment, // Assigned to assessor
        AssessorApproved, // Approved by assessor
        AssessorRejected, // Rejected by assessor
        AdminApproved, // Approved by admin
        AdminRejected, // Rejected by admin
        Paid, // Claim paid out
        Expired // Claim expired
    }

    // Structs
    struct InsuranceParams {
        uint256 minMonthlyPremium;
        uint256 maxCoverageMultiplier;
        uint256 assessmentTimeLimit;
        uint256 adminReviewTimeLimit;
        uint256 minConsecutivePayments;
        uint256 poolBalance;
    }

    struct Assessor {
        string name;
        string credentials;
        string specialization;
        uint256 registrationDate;
        uint256 totalAssessments;
        bool isActive;
        uint256 reputationScore;
    }

    struct Membership {
        address owner;
        uint256 tokenId; // Vehicle NFT ID
        uint256 startDate;
        uint256 coverageAmount;
        uint256 monthlyPremium;
        uint256 lastPaymentDate;
        uint256 totalContributions;
        uint256 consecutivePayments;
        MembershipStatus status;
    }

    struct Claim {
        uint256 membershipId;
        address claimant;
        uint256 requestedAmount;
        string description;
        string evidenceUri;
        uint256 filingDate;
        ClaimStatus status;
        address assignedAssessor;
        uint256 assignmentDate;
        bool isAssessorWorking;
        uint256 assessorApprovedAmount;
        string assessorNotes;
        uint256 assessmentDate;
        uint256 adminApprovedAmount;
        string adminNotes;
        uint256 adminReviewDate;
        uint256 finalPaidAmount;
        uint256 paymentDate;
    }

    // Mappings
    mapping(uint256 => Membership) public memberships;
    mapping(uint256 => Claim) public claims;
    mapping(address => Assessor) public assessors;
    mapping(address => uint256[]) public membershipsByOwner;
    mapping(uint256 => uint256[]) public claimsByMembership;
    mapping(address => uint256[]) public assessorActiveClaims;
    mapping(uint256 => address[]) public claimAssessorHistory;

    // Insurance parameters
    InsuranceParams public params;

    // Events
    event MembershipCreated(
        uint256 indexed membershipId,
        address indexed owner,
        uint256 tokenId
    );
    event PremiumPaid(
        uint256 indexed membershipId,
        uint256 amount,
        uint256 consecutivePayments
    );
    event MembershipStatusUpdated(
        uint256 indexed membershipId,
        MembershipStatus status
    );
    event ClaimFiled(
        uint256 indexed claimId,
        uint256 indexed membershipId,
        uint256 amount
    );
    event AssessorRegistered(
        address indexed assessor,
        string name,
        string credentials
    );
    event AssessorStatusUpdated(address indexed assessor, bool isActive);
    event AssessorSelfDeactivated(address indexed assessor);
    event AssessorRevoked(address indexed assessor, string reason);
    event AssessorAssignedToClaim(
        uint256 indexed claimId,
        address indexed assessor
    );
    event AssessorRemovedFromClaim(
        uint256 indexed claimId,
        address indexed assessor,
        string reason
    );
    event ClaimReassigned(
        uint256 indexed claimId,
        address indexed oldAssessor,
        address indexed newAssessor
    );
    event ClaimAssessed(
        uint256 indexed claimId,
        address indexed assessor,
        bool approved,
        uint256 amount
    );
    event ClaimReviewed(
        uint256 indexed claimId,
        bool approved,
        uint256 finalAmount
    );
    event ClaimPaid(
        uint256 indexed claimId,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @dev Constructor
     * @param _carNFTAddress Address of the CarNFT contract
     * @param _minMonthlyPremium Minimum monthly premium amount
     * @param _maxCoverageMultiplier Maximum coverage multiplier
     */
    constructor(
        address _carNFTAddress,
        uint256 _minMonthlyPremium,
        uint256 _maxCoverageMultiplier
    ) {
        carNFTContract = CarNFT(_carNFTAddress);

        params = InsuranceParams({
            minMonthlyPremium: _minMonthlyPremium,
            maxCoverageMultiplier: _maxCoverageMultiplier,
            assessmentTimeLimit: 7 days,
            adminReviewTimeLimit: 3 days,
            minConsecutivePayments: 3,
            poolBalance: 0
        });

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create a new insurance membership
     * @param tokenId The NFT token ID of the vehicle
     */
    function createMembership(uint256 tokenId) external payable nonReentrant {
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the vehicle owner"
        );
        require(msg.value >= params.minMonthlyPremium, "Insufficient premium");

        _membershipIds.increment();
        uint256 membershipId = _membershipIds.current();

        Membership memory newMembership = Membership({
            owner: msg.sender,
            tokenId: tokenId,
            startDate: block.timestamp,
            coverageAmount: msg.value * params.maxCoverageMultiplier,
            monthlyPremium: msg.value,
            lastPaymentDate: block.timestamp,
            totalContributions: msg.value,
            consecutivePayments: 1,
            status: MembershipStatus.Active
        });

        memberships[membershipId] = newMembership;
        membershipsByOwner[msg.sender].push(membershipId);
        params.poolBalance += msg.value;

        emit MembershipCreated(membershipId, msg.sender, tokenId);
        emit PremiumPaid(membershipId, msg.value, 1);
    }
    /**
     * @dev Pay monthly premium for existing membership
     * @param membershipId The ID of the membership
     */
    function payPremium(uint256 membershipId) external payable nonReentrant {
        Membership storage membership = memberships[membershipId];
        require(membership.owner == msg.sender, "Not the membership owner");
        require(
            membership.status != MembershipStatus.Inactive,
            "Membership inactive"
        );
        require(msg.value >= membership.monthlyPremium, "Insufficient premium");

        // Update consecutive payments
        if (block.timestamp <= membership.lastPaymentDate + 30 days) {
            membership.consecutivePayments++;
        } else {
            membership.consecutivePayments = 1;
        }

        membership.lastPaymentDate = block.timestamp;
        membership.totalContributions += msg.value;
        membership.status = MembershipStatus.Active;

        // Update coverage based on contribution history
        membership.coverageAmount = calculateCoverage(membership);
        params.poolBalance += msg.value;

        emit PremiumPaid(
            membershipId,
            msg.value,
            membership.consecutivePayments
        );
    }

    /**
     * @dev Register a new assessor (Admin only)
     */
    function registerAssessor(
        address assessorAddress,
        string memory name,
        string memory credentials,
        string memory specialization
    ) external onlyRole(ADMIN_ROLE) {
        require(assessorAddress != address(0), "Invalid address");
        require(
            !hasRole(ASSESSOR_ROLE, assessorAddress),
            "Already an assessor"
        );

        Assessor memory newAssessor = Assessor({
            name: name,
            credentials: credentials,
            specialization: specialization,
            registrationDate: block.timestamp,
            totalAssessments: 0,
            isActive: true,
            reputationScore: 0
        });

        assessors[assessorAddress] = newAssessor;
        _grantRole(ASSESSOR_ROLE, assessorAddress);

        emit AssessorRegistered(assessorAddress, name, credentials);
    }

    /**
     * @dev Allow assessor to deactivate themselves if they have no active claims
     */
    function deactivateSelf() external {
        require(hasRole(ASSESSOR_ROLE, msg.sender), "Not an assessor");
        require(assessors[msg.sender].isActive, "Already inactive");
        require(
            assessorActiveClaims[msg.sender].length == 0,
            "Has active claims"
        );

        assessors[msg.sender].isActive = false;
        emit AssessorSelfDeactivated(msg.sender);
    }

    /**
     * @dev File an insurance claim
     */
    function fileClaim(
        uint256 membershipId,
        uint256 amount,
        string memory description,
        string memory evidenceUri
    ) external nonReentrant returns (uint256) {
        Membership storage membership = memberships[membershipId];
        require(membership.owner == msg.sender, "Not the membership owner");
        require(
            membership.status == MembershipStatus.Active,
            "Membership not active"
        );
        require(amount <= membership.coverageAmount, "Amount exceeds coverage");
        require(
            block.timestamp <= membership.lastPaymentDate + 30 days,
            "Coverage lapsed"
        );

        _claimIds.increment();
        uint256 claimId = _claimIds.current();

        claims[claimId] = Claim({
            membershipId: membershipId,
            claimant: msg.sender,
            requestedAmount: amount,
            description: description,
            evidenceUri: evidenceUri,
            filingDate: block.timestamp,
            status: ClaimStatus.Pending,
            assignedAssessor: address(0),
            assignmentDate: 0,
            isAssessorWorking: false,
            assessorApprovedAmount: 0,
            assessorNotes: "",
            assessmentDate: 0,
            adminApprovedAmount: 0,
            adminNotes: "",
            adminReviewDate: 0,
            finalPaidAmount: 0,
            paymentDate: 0
        });

        claimsByMembership[membershipId].push(claimId);
        emit ClaimFiled(claimId, membershipId, amount);
        return claimId;
    }

    /**
     * @dev Assign assessor to claim (Admin only)
     */
    function assignAssessorToClaim(
        uint256 claimId,
        address assessorAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ASSESSOR_ROLE, assessorAddress), "Not an assessor");
        require(assessors[assessorAddress].isActive, "Assessor not active");

        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        require(claim.assignedAssessor == address(0), "Already assigned");

        claim.assignedAssessor = assessorAddress;
        claim.assignmentDate = block.timestamp;
        claim.isAssessorWorking = true;
        claim.status = ClaimStatus.UnderAssessment;

        assessorActiveClaims[assessorAddress].push(claimId);
        claimAssessorHistory[claimId].push(assessorAddress);

        emit AssessorAssignedToClaim(claimId, assessorAddress);
    }

    /**
     * @dev Remove assessor from claim (Admin only)
     */
    function removeAssessorFromClaim(
        uint256 claimId,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) {
        Claim storage claim = claims[claimId];
        require(claim.assignedAssessor != address(0), "No assessor assigned");
        require(
            claim.status == ClaimStatus.UnderAssessment,
            "Not under assessment"
        );

        address removedAssessor = claim.assignedAssessor;
        removeFromActiveClaimsList(removedAssessor, claimId);

        claim.assignedAssessor = address(0);
        claim.isAssessorWorking = false;
        claim.status = ClaimStatus.Pending;

        emit AssessorRemovedFromClaim(claimId, removedAssessor, reason);
    }

    /**
     * @dev Reassign claim to new assessor (Admin only)
     */
    function reassignClaim(
        uint256 claimId,
        address newAssessorAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ASSESSOR_ROLE, newAssessorAddress), "Not an assessor");
        require(assessors[newAssessorAddress].isActive, "Assessor not active");

        Claim storage claim = claims[claimId];
        address oldAssessor = claim.assignedAssessor;
        require(oldAssessor != newAssessorAddress, "Same assessor");

        if (oldAssessor != address(0)) {
            removeFromActiveClaimsList(oldAssessor, claimId);
        }

        claim.assignedAssessor = newAssessorAddress;
        claim.assignmentDate = block.timestamp;
        claim.isAssessorWorking = true;
        claim.status = ClaimStatus.UnderAssessment;

        assessorActiveClaims[newAssessorAddress].push(claimId);
        claimAssessorHistory[claimId].push(newAssessorAddress);

        emit ClaimReassigned(claimId, oldAssessor, newAssessorAddress);
    }

    /**
     * @dev Assess claim (Assessor only)
     */
    function assessClaim(
        uint256 claimId,
        bool approved,
        uint256 amount,
        string memory notes
    ) external {
        require(hasRole(ASSESSOR_ROLE, msg.sender), "Not an assessor");
        require(assessors[msg.sender].isActive, "Assessor not active");

        Claim storage claim = claims[claimId];
        require(
            claim.assignedAssessor == msg.sender,
            "Not assigned to this claim"
        );
        require(
            claim.status == ClaimStatus.UnderAssessment,
            "Not under assessment"
        );
        require(claim.isAssessorWorking, "Assessment work stopped");

        removeFromActiveClaimsList(msg.sender, claimId);

        claim.status = approved
            ? ClaimStatus.AssessorApproved
            : ClaimStatus.AssessorRejected;
        claim.assessorApprovedAmount = amount;
        claim.assessorNotes = notes;
        claim.assessmentDate = block.timestamp;
        claim.isAssessorWorking = false;

        assessors[msg.sender].totalAssessments++;
        assessors[msg.sender].reputationScore++;

        emit ClaimAssessed(claimId, msg.sender, approved, amount);
    }

    /**
     * @dev Review and finalize claim (Admin only)
     */
    function reviewClaim(
        uint256 claimId,
        bool approved,
        uint256 finalAmount,
        string memory notes
    ) external onlyRole(ADMIN_ROLE) {
        Claim storage claim = claims[claimId];
        require(
            claim.status == ClaimStatus.AssessorApproved,
            "Not assessor approved"
        );
        require(
            finalAmount <= claim.requestedAmount,
            "Exceeds requested amount"
        );

        claim.status = approved
            ? ClaimStatus.AdminApproved
            : ClaimStatus.AdminRejected;
        claim.adminApprovedAmount = finalAmount;
        claim.adminNotes = notes;
        claim.adminReviewDate = block.timestamp;

        emit ClaimReviewed(claimId, approved, finalAmount);

        if (approved) {
            processPayout(claimId);
        }
    }

    /**
     * @dev Process claim payout
     */
    function processPayout(uint256 claimId) internal {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.AdminApproved, "Not approved");
        require(
            claim.adminApprovedAmount <= params.poolBalance,
            "Insufficient pool balance"
        );

        uint256 payoutAmount = claim.adminApprovedAmount;
        params.poolBalance -= payoutAmount;

        claim.status = ClaimStatus.Paid;
        claim.finalPaidAmount = payoutAmount;
        claim.paymentDate = block.timestamp;

        (bool success, ) = payable(claim.claimant).call{value: payoutAmount}(
            ""
        );
        require(success, "Payment failed");

        emit ClaimPaid(claimId, claim.claimant, payoutAmount);
    }

    /**
     * @dev Calculate coverage amount based on contribution history
     */
    function calculateCoverage(
        Membership memory membership
    ) internal pure returns (uint256) {
        uint256 baseMultiplier = 2;
        uint256 loyaltyBonus = (membership.consecutivePayments * 5) / 100; // 5% per consecutive payment
        uint256 totalMultiplier = baseMultiplier + loyaltyBonus;
        return membership.totalContributions * totalMultiplier;
    }

    /**
     * @dev Remove claim from assessor's active claims list
     */
    function removeFromActiveClaimsList(
        address assessorAddress,
        uint256 claimId
    ) internal {
        uint256[] storage activeClaims = assessorActiveClaims[assessorAddress];
        for (uint256 i = 0; i < activeClaims.length; i++) {
            if (activeClaims[i] == claimId) {
                activeClaims[i] = activeClaims[activeClaims.length - 1];
                activeClaims.pop();
                break;
            }
        }
    }

    // Getter functions
    function getMembershipsByOwner(
        address owner
    ) external view returns (uint256[] memory) {
        return membershipsByOwner[owner];
    }

    function getClaimsByMembership(
        uint256 membershipId
    ) external view returns (uint256[] memory) {
        return claimsByMembership[membershipId];
    }

    function getAssessorActiveClaims(
        address assessorAddress
    ) external view returns (uint256[] memory) {
        return assessorActiveClaims[assessorAddress];
    }

    function getClaimAssessorHistory(
        uint256 claimId
    ) external view returns (address[] memory) {
        return claimAssessorHistory[claimId];
    }

    // Receive function to accept ETH payments
    receive() external payable {
        params.poolBalance += msg.value;
    }

    // Fallback function
    fallback() external payable {
        params.poolBalance += msg.value;
    }
}
