// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CarNFT.sol";
import "./PoolLibrary.sol";
import "./RateOracle.sol";

/**
 * @title CarInsurancePool
 * @dev A comprehensive decentralized insurance system for vehicles with multiple insurance pools
 */
contract CarInsurancePool is AccessControlEnumerable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using PoolLibrary for uint256[];

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ASSESSOR_ROLE = keccak256("ASSESSOR_ROLE");
    bytes32 public constant ACTUARY_ROLE = keccak256("ACTUARY_ROLE");

    // Counters
    Counters.Counter private _membershipIds;
    Counters.Counter private _claimIds;
    Counters.Counter private _poolIds;

    // State variables
    CarNFT public immutable carNFTContract;
    RateOracle public immutable rateOracle;

    // Default USDT stablecoin address
    address public defaultStablecoin;

    // Stablecoin support
    mapping(address => bool) public supportedStablecoins;
    address[] public stablecoinList;

    // Enums
    enum MembershipStatus {
        Inactive,
        Active,
        Suspended
    }

    enum ClaimStatus {
        Pending,
        UnderAssessment,
        AssessorApproved,
        AssessorRejected,
        AdminApproved,
        AdminRejected,
        Paid,
        Expired
    }

    enum PoolStatus {
        Active,
        Paused,
        Discontinued
    }

    // Structs
    struct InsurancePool {
        string name;
        string description;
        uint256 creationDate;
        uint256 balance;
        PoolStatus status;
        uint256 minMonthlyPremiumUsdt; // Changed to USDT
        uint256 maxCoverageMultiplier;
        uint256 assessmentTimeLimit;
        uint256 adminReviewTimeLimit;
        uint256 minConsecutivePayments;
        uint256 riskFactor;
        uint256 memberCount;
        bool specializationRequired;
        string specialization;
        uint256 maxYearsCovered;
        mapping(uint256 => bool) membershipIds;
    }

    struct InsuranceParams {
        uint256 minMonthlyPremiumUsdt; // Changed to USDT
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

    // Pool-related mappings
    mapping(uint256 => InsurancePool) private insurancePools;
    mapping(uint256 => uint256[]) public poolMemberships;
    mapping(uint256 => uint256) public membershipToPool;

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
    event PoolCreated(
        uint256 indexed poolId,
        string name,
        string specialization,
        uint256 minMonthlyPremiumUsdt
    );
    event PoolStatusUpdated(uint256 indexed poolId, PoolStatus status);
    event MemberJoinedPool(
        uint256 indexed poolId,
        uint256 indexed membershipId
    );
    event ActuaryRegistered(
        address indexed actuary,
        string name,
        string credentials
    );
    event ActuaryRevoked(address indexed actuary, string reason);
    event StablecoinAdded(address indexed stablecoin);
    event StablecoinRemoved(address indexed stablecoin);
    event StablecoinPremiumPaid(
        uint256 indexed membershipId,
        address indexed stablecoin,
        uint256 amount,
        uint256 consecutivePayments
    );
    event DefaultStablecoinSet(address indexed stablecoin);
    event ExchangeRateUpdated(string rateName, uint256 newRate);

    /**
     * @dev Constructor with USDT as default and RateOracle integration
     * @param _carNFTAddress Address of the CarNFT contract
     * @param _minMonthlyPremiumUsdt Minimum monthly premium amount in USDT (6 decimals)
     * @param _maxCoverageMultiplier Maximum coverage multiplier
     * @param _defaultStablecoin Address of the default USDT stablecoin
     * @param _rateOracleAddress Address of the RateOracle contract
     */
    constructor(
        address _carNFTAddress,
        uint256 _minMonthlyPremiumUsdt,
        uint256 _maxCoverageMultiplier,
        address _defaultStablecoin,
        address _rateOracleAddress
    ) {
        carNFTContract = CarNFT(_carNFTAddress);
        defaultStablecoin = _defaultStablecoin;
        rateOracle = RateOracle(_rateOracleAddress);

        // Add default stablecoin to supported list
        supportedStablecoins[_defaultStablecoin] = true;
        stablecoinList.push(_defaultStablecoin);

        params = InsuranceParams({
            minMonthlyPremiumUsdt: _minMonthlyPremiumUsdt,
            maxCoverageMultiplier: _maxCoverageMultiplier,
            assessmentTimeLimit: 7 days,
            adminReviewTimeLimit: 3 days,
            minConsecutivePayments: 3,
            poolBalance: 0
        });

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);

        emit DefaultStablecoinSet(_defaultStablecoin);
    }

    /**
     * @dev Set default stablecoin (Admin only)
     * @param _stablecoinAddress New default stablecoin address
     */
    function setDefaultStablecoin(
        address _stablecoinAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(_stablecoinAddress != address(0), "Invalid stablecoin address");

        // Add to supported stablecoins if not already supported
        if (!supportedStablecoins[_stablecoinAddress]) {
            supportedStablecoins[_stablecoinAddress] = true;
            stablecoinList.push(_stablecoinAddress);
            emit StablecoinAdded(_stablecoinAddress);
        }

        defaultStablecoin = _stablecoinAddress;
        emit DefaultStablecoinSet(_stablecoinAddress);
    }

    /**
     * @dev Update exchange rates via the RateOracle (Admin or Actuary only)
     * @param _avaxToUsdtRate New AVAX to USDT rate (6 decimals)
     * @param _usdtToKesRate New USDT to KES rate (6 decimals)
     */
    function updateExchangeRates(
        uint256 _avaxToUsdtRate,
        uint256 _usdtToKesRate
    ) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
                hasRole(ACTUARY_ROLE, msg.sender),
            "Only admin or actuary can update rates"
        );
        require(_avaxToUsdtRate > 0, "AVAX/USDT rate must be > 0");
        require(_usdtToKesRate > 0, "USDT/KES rate must be > 0");

        // Update rates via the RateOracle
        rateOracle.updateRate(rateOracle.AVAX_USDT(), _avaxToUsdtRate);
        rateOracle.updateRate(rateOracle.USDT_KES(), _usdtToKesRate);

        emit ExchangeRateUpdated("AVAX/USDT", _avaxToUsdtRate);
        emit ExchangeRateUpdated("USDT/KES", _usdtToKesRate);
    }

    /**
     * @dev Calculate minimum premium in AVAX based on USDT rate
     * @param usdtAmount Amount in USDT (6 decimals)
     * @return Equivalent amount in AVAX (18 decimals)
     */
    function convertUsdtToAvax(
        uint256 usdtAmount
    ) public view returns (uint256) {
        (uint256 rate, ) = rateOracle.getRate(rateOracle.AVAX_USDT());
        require(rate > 0, "Exchange rate not set");
        // Convert from USDT (6 decimals) to AVAX (18 decimals)
        return (usdtAmount * 1e18) / rate;
    }

    /**
     * @dev Calculate USDT value from AVAX amount
     * @param avaxAmount Amount in AVAX (18 decimals)
     * @return Equivalent amount in USDT (6 decimals)
     */
    function convertAvaxToUsdt(
        uint256 avaxAmount
    ) public view returns (uint256) {
        (uint256 rate, ) = rateOracle.getRate(rateOracle.AVAX_USDT());
        require(rate > 0, "Exchange rate not set");
        // Convert from AVAX (18 decimals) to USDT (6 decimals)
        return (avaxAmount * rate) / 1e18;
    }

    /**
     * @dev Convert KES to USDT
     * @param kesAmount Amount in KES (no decimals)
     * @return Equivalent amount in USDT (6 decimals)
     */
    function convertKesToUsdt(uint256 kesAmount) public view returns (uint256) {
        (uint256 rate, ) = rateOracle.getRate(rateOracle.USDT_KES());
        require(rate > 0, "Exchange rate not set");
        // Convert from KES to USDT (6 decimals)
        return (kesAmount * 1e6) / rate;
    }

    /**
     * @dev Add a supported stablecoin (Admin only)
     * @param stablecoinAddress Address of the stablecoin contract
     */
    function addSupportedStablecoin(
        address stablecoinAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(stablecoinAddress != address(0), "Invalid stablecoin address");
        require(
            !supportedStablecoins[stablecoinAddress],
            "Stablecoin already supported"
        );

        supportedStablecoins[stablecoinAddress] = true;
        stablecoinList.push(stablecoinAddress);

        emit StablecoinAdded(stablecoinAddress);
    }

    /**
     * @dev Remove a supported stablecoin (Admin only)
     * @param stablecoinAddress Address of the stablecoin contract
     */
    function removeSupportedStablecoin(
        address stablecoinAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(
            stablecoinAddress != defaultStablecoin,
            "Cannot remove default stablecoin"
        );
        require(
            supportedStablecoins[stablecoinAddress],
            "Stablecoin not supported"
        );

        supportedStablecoins[stablecoinAddress] = false;

        // Remove from list manually instead of using the library
        for (uint i = 0; i < stablecoinList.length; i++) {
            if (stablecoinList[i] == stablecoinAddress) {
                // Swap with the last element and pop
                stablecoinList[i] = stablecoinList[stablecoinList.length - 1];
                stablecoinList.pop();
                break;
            }
        }

        emit StablecoinRemoved(stablecoinAddress);
    }

    /**
     * @dev Get list of supported stablecoins
     */
    function getSupportedStablecoins()
        external
        view
        returns (address[] memory)
    {
        return stablecoinList;
    }

    /**
     * @dev Create a new insurance pool with USDT as base currency
     * @param name Name of the insurance pool
     * @param description Description of the pool
     * @param minMonthlyPremiumUsdt Minimum monthly premium required in USDT
     * @param maxCoverageMultiplier Maximum coverage multiplier
     * @param assessmentTimeLimit Time limit for assessments in days
     * @param adminReviewTimeLimit Time limit for admin review in days
     * @param minConsecutivePayments Minimum consecutive payments for full benefits
     * @param specializationRequired Whether the pool requires specialization
     * @param specialization Specialization type (e.g., "Electric", "Luxury", "SUV")
     * @param maxYearsCovered Maximum car age covered
     */
    function createInsurancePool(
        string memory name,
        string memory description,
        uint256 minMonthlyPremiumUsdt,
        uint256 maxCoverageMultiplier,
        uint256 assessmentTimeLimit,
        uint256 adminReviewTimeLimit,
        uint256 minConsecutivePayments,
        bool specializationRequired,
        string memory specialization,
        uint256 maxYearsCovered
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(minMonthlyPremiumUsdt > 0, "Premium must be > 0");
        require(maxCoverageMultiplier > 0, "Coverage multiplier must be > 0");
        require(assessmentTimeLimit > 0, "Assessment time limit must be > 0");
        require(
            adminReviewTimeLimit > 0,
            "Admin review time limit must be > 0"
        );
        require(
            minConsecutivePayments > 0,
            "Min consecutive payments must be > 0"
        );

        _poolIds.increment();
        uint256 poolId = _poolIds.current();

        InsurancePool storage newPool = insurancePools[poolId];
        newPool.name = name;
        newPool.description = description;
        newPool.creationDate = block.timestamp;
        newPool.balance = 0;
        newPool.status = PoolStatus.Active;
        newPool.minMonthlyPremiumUsdt = minMonthlyPremiumUsdt; // USDT premium
        newPool.maxCoverageMultiplier = maxCoverageMultiplier;
        newPool.assessmentTimeLimit = assessmentTimeLimit * 1 days;
        newPool.adminReviewTimeLimit = adminReviewTimeLimit * 1 days;
        newPool.minConsecutivePayments = minConsecutivePayments;
        newPool.riskFactor = 100; // Default normal risk
        newPool.memberCount = 0;
        newPool.specializationRequired = specializationRequired;
        newPool.specialization = specialization;
        newPool.maxYearsCovered = maxYearsCovered;

        emit PoolCreated(poolId, name, specialization, minMonthlyPremiumUsdt);

        return poolId;
    }

    // Update pool-related functions to use USDT as primary currency

    /**
     * @dev Join an insurance pool with a vehicle using USDT
     * @param poolId The ID of the pool to join
     * @param tokenId The NFT token ID of the vehicle
     * @param amount Amount of USDT to pay (must be at least minMonthlyPremiumUsdt)
     */
    function joinPoolWithUSDT(
        uint256 poolId,
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant {
        require(
            poolId > 0 && poolId <= _poolIds.current(),
            "Pool does not exist"
        );
        require(
            insurancePools[poolId].status == PoolStatus.Active,
            "Pool not active"
        );
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the vehicle owner"
        );

        InsurancePool storage pool = insurancePools[poolId];
        require(amount >= pool.minMonthlyPremiumUsdt, "Insufficient premium");

        // Transfer USDT from user to contract
        IERC20 usdt = IERC20(defaultStablecoin);
        uint256 balanceBefore = usdt.balanceOf(address(this));
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );
        uint256 balanceAfter = usdt.balanceOf(address(this));
        require(
            balanceAfter - balanceBefore == amount,
            "Incorrect amount received"
        );

        // Check vehicle eligibility if pool has specialization requirements
        if (pool.specializationRequired) {
            CarNFT.CarDetails memory carDetails = carNFTContract.getCarDetails(
                tokenId
            );

            // Check car specialization
            if (
                keccak256(abi.encodePacked(pool.specialization)) ==
                keccak256(abi.encodePacked("Electric"))
            ) {
                require(
                    PoolLibrary.containsString(carDetails.make, "Tesla") ||
                        PoolLibrary.containsString(carDetails.make, "Leaf") ||
                        PoolLibrary.containsString(carDetails.make, "Electric"),
                    "Car does not meet specialization requirements"
                );
            } else if (
                keccak256(abi.encodePacked(pool.specialization)) ==
                keccak256(abi.encodePacked("Luxury"))
            ) {
                require(
                    PoolLibrary.containsString(carDetails.make, "Mercedes") ||
                        PoolLibrary.containsString(carDetails.make, "BMW") ||
                        PoolLibrary.containsString(carDetails.make, "Audi") ||
                        PoolLibrary.containsString(carDetails.make, "Lexus"),
                    "Car does not meet specialization requirements"
                );
            }

            // Check car age
            if (pool.maxYearsCovered > 0) {
                uint256 currentYear = 2025; // Hard-coded current year (matches workspace context date)
                require(
                    (currentYear - carDetails.year) <= pool.maxYearsCovered,
                    "Car exceeds maximum age covered by this pool"
                );
            }
        }

        _membershipIds.increment();
        uint256 membershipId = _membershipIds.current();

        Membership memory newMembership = Membership({
            owner: msg.sender,
            tokenId: tokenId,
            startDate: block.timestamp,
            coverageAmount: PoolLibrary.calculatePoolCoverage(
                amount,
                pool.maxCoverageMultiplier,
                1,
                pool.riskFactor
            ),
            monthlyPremium: amount,
            lastPaymentDate: block.timestamp,
            totalContributions: amount,
            consecutivePayments: 1,
            status: MembershipStatus.Active
        });

        memberships[membershipId] = newMembership;
        membershipsByOwner[msg.sender].push(membershipId);
        membershipToPool[membershipId] = poolId;
        poolMemberships[poolId].push(membershipId);
        pool.membershipIds[membershipId] = true;
        pool.memberCount++;
        pool.balance += amount;

        emit MembershipCreated(membershipId, msg.sender, tokenId);
        emit MemberJoinedPool(poolId, membershipId);
        emit StablecoinPremiumPaid(membershipId, defaultStablecoin, amount, 1);
    }

    /**
     * @dev Join an insurance pool with AVAX (converts to USDT equivalent)
     * @param poolId The ID of the pool to join
     * @param tokenId The NFT token ID of the vehicle
     */
    function joinPool(
        uint256 poolId,
        uint256 tokenId
    ) external payable nonReentrant {
        require(
            poolId > 0 && poolId <= _poolIds.current(),
            "Pool does not exist"
        );
        require(
            insurancePools[poolId].status == PoolStatus.Active,
            "Pool not active"
        );
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the vehicle owner"
        );

        InsurancePool storage pool = insurancePools[poolId];

        // Convert AVAX to USDT for comparison and storage
        uint256 usdtEquivalent = convertAvaxToUsdt(msg.value);
        require(
            usdtEquivalent >= pool.minMonthlyPremiumUsdt,
            "Insufficient premium"
        );

        // Check vehicle eligibility if pool has specialization requirements
        if (pool.specializationRequired) {
            CarNFT.CarDetails memory carDetails = carNFTContract.getCarDetails(
                tokenId
            );

            // Check if car meets specialization requirements (e.g., car type)
            if (
                keccak256(abi.encodePacked(pool.specialization)) ==
                keccak256(abi.encodePacked("Electric"))
            ) {
                require(
                    PoolLibrary.containsString(carDetails.make, "Tesla") ||
                        PoolLibrary.containsString(carDetails.make, "Leaf") ||
                        PoolLibrary.containsString(carDetails.make, "Electric"),
                    "Car does not meet specialization requirements"
                );
            } else if (
                keccak256(abi.encodePacked(pool.specialization)) ==
                keccak256(abi.encodePacked("Luxury"))
            ) {
                require(
                    PoolLibrary.containsString(carDetails.make, "Mercedes") ||
                        PoolLibrary.containsString(carDetails.make, "BMW") ||
                        PoolLibrary.containsString(carDetails.make, "Audi") ||
                        PoolLibrary.containsString(carDetails.make, "Lexus"),
                    "Car does not meet specialization requirements"
                );
            }

            // Check car age if pool has max year requirement
            if (pool.maxYearsCovered > 0) {
                uint256 currentYear = 2025; // Hard-coded current year (matches workspace context date)
                require(
                    (currentYear - carDetails.year) <= pool.maxYearsCovered,
                    "Car exceeds maximum age covered by this pool"
                );
            }
        }

        _membershipIds.increment();
        uint256 membershipId = _membershipIds.current();

        Membership memory newMembership = Membership({
            owner: msg.sender,
            tokenId: tokenId,
            startDate: block.timestamp,
            coverageAmount: PoolLibrary.calculatePoolCoverage(
                usdtEquivalent,
                pool.maxCoverageMultiplier,
                1,
                pool.riskFactor
            ),
            monthlyPremium: usdtEquivalent,
            lastPaymentDate: block.timestamp,
            totalContributions: usdtEquivalent,
            consecutivePayments: 1,
            status: MembershipStatus.Active
        });

        memberships[membershipId] = newMembership;
        membershipsByOwner[msg.sender].push(membershipId);
        membershipToPool[membershipId] = poolId;
        poolMemberships[poolId].push(membershipId);
        pool.membershipIds[membershipId] = true;
        pool.memberCount++;
        pool.balance += usdtEquivalent;

        emit MembershipCreated(membershipId, msg.sender, tokenId);
        emit MemberJoinedPool(poolId, membershipId);
        emit PremiumPaid(membershipId, msg.value, 1);
    }

    /**
     * @dev Pay monthly premium using USDT
     * @param membershipId The ID of the membership
     * @param amount Amount of USDT to pay
     */
    function payPoolPremiumWithUSDT(
        uint256 membershipId,
        uint256 amount
    ) external nonReentrant {
        Membership storage membership = memberships[membershipId];
        require(membership.owner == msg.sender, "Not the membership owner");
        require(
            membership.status != MembershipStatus.Inactive,
            "Membership inactive"
        );

        uint256 poolId = membershipToPool[membershipId];
        require(poolId > 0, "Not in a pool");

        InsurancePool storage pool = insurancePools[poolId];
        require(pool.status != PoolStatus.Discontinued, "Pool discontinued");
        require(amount >= membership.monthlyPremium, "Insufficient premium");

        // Transfer USDT from user to contract
        IERC20 usdt = IERC20(defaultStablecoin);
        uint256 balanceBefore = usdt.balanceOf(address(this));
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );
        uint256 balanceAfter = usdt.balanceOf(address(this));
        require(
            balanceAfter - balanceBefore == amount,
            "Incorrect amount received"
        );

        // Update payment information
        if (block.timestamp <= membership.lastPaymentDate + 30 days) {
            membership.consecutivePayments++;
        } else {
            membership.consecutivePayments = 1;
        }

        membership.lastPaymentDate = block.timestamp;
        membership.totalContributions += amount;
        membership.status = MembershipStatus.Active;

        // Update coverage
        membership.coverageAmount = PoolLibrary.calculatePoolCoverage(
            membership.totalContributions,
            pool.maxCoverageMultiplier,
            membership.consecutivePayments,
            pool.riskFactor
        );

        pool.balance += amount;

        emit StablecoinPremiumPaid(
            membershipId,
            defaultStablecoin,
            amount,
            membership.consecutivePayments
        );
    }

    /**
     * @dev Process claim payout using USDT
     * @param claimId The claim ID to process payout for
     */
    function processPoolPayout(uint256 claimId) internal {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.AdminApproved, "Not approved");

        uint256 membershipId = claim.membershipId;
        uint256 poolId = membershipToPool[membershipId];
        require(poolId > 0, "Not in a pool");

        InsurancePool storage pool = insurancePools[poolId];
        uint256 payoutAmount = claim.adminApprovedAmount;

        require(payoutAmount <= pool.balance, "Insufficient pool balance");

        pool.balance -= payoutAmount;

        claim.status = ClaimStatus.Paid;
        claim.finalPaidAmount = payoutAmount;
        claim.paymentDate = block.timestamp;

        // Transfer USDT to claimant
        IERC20 usdt = IERC20(defaultStablecoin);
        require(
            usdt.transfer(claim.claimant, payoutAmount),
            "USDT transfer failed"
        );

        emit ClaimPaid(claimId, claim.claimant, payoutAmount);
    }

    /**
     * @dev Get pool details
     * @param poolId The ID of the pool
     */
    function getPoolDetails(
        uint256 poolId
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 creationDate,
            uint256 balance,
            PoolStatus status,
            uint256 minMonthlyPremium,
            uint256 maxCoverageMultiplier,
            uint256 riskFactor,
            uint256 memberCount,
            string memory specialization,
            uint256 maxYearsCovered
        )
    {
        require(
            poolId > 0 && poolId <= _poolIds.current(),
            "Pool does not exist"
        );

        InsurancePool storage pool = insurancePools[poolId];

        return (
            pool.name,
            pool.description,
            pool.creationDate,
            pool.balance,
            pool.status,
            pool.minMonthlyPremiumUsdt,
            pool.maxCoverageMultiplier,
            pool.riskFactor,
            pool.memberCount,
            pool.specialization,
            pool.maxYearsCovered
        );
    }

    /**
     * @dev Get all memberships in a pool
     * @param poolId The ID of the pool
     */
    function getPoolMemberships(
        uint256 poolId
    ) external view returns (uint256[] memory) {
        require(
            poolId > 0 && poolId <= _poolIds.current(),
            "Pool does not exist"
        );
        return poolMemberships[poolId];
    }

    /**
     * @dev Check if a string contains a substring (case-insensitive)
     * @param source The source string
     * @param searchFor The substring to search for
     */
    function _containsString(
        string memory source,
        string memory searchFor
    ) internal pure returns (bool) {
        bytes memory sourceBytes = bytes(source);
        bytes memory searchBytes = bytes(searchFor);

        if (searchBytes.length > sourceBytes.length) {
            return false;
        }

        // Convert both strings to lowercase for case-insensitive comparison
        bytes memory lowerSource = new bytes(sourceBytes.length);
        bytes memory lowerSearch = new bytes(searchBytes.length);

        for (uint i = 0; i < sourceBytes.length; i++) {
            // Convert uppercase to lowercase (ASCII only)
            if (sourceBytes[i] >= 0x41 && sourceBytes[i] <= 0x5A) {
                lowerSource[i] = bytes1(uint8(sourceBytes[i]) + 32);
            } else {
                lowerSource[i] = sourceBytes[i];
            }
        }

        for (uint i = 0; i < searchBytes.length; i++) {
            // Convert uppercase to lowercase (ASCII only)
            if (searchBytes[i] >= 0x41 && searchBytes[i] <= 0x5A) {
                lowerSearch[i] = bytes1(uint8(searchBytes[i]) + 32);
            } else {
                lowerSearch[i] = searchBytes[i];
            }
        }

        // Search for the substring
        for (uint i = 0; i <= lowerSource.length - lowerSearch.length; i++) {
            bool found = true;
            for (uint j = 0; j < lowerSearch.length; j++) {
                if (lowerSource[i + j] != lowerSearch[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Calculate coverage amount based on contribution history and pool risk factor
     */
    function calculatePoolCoverage(
        uint256 contributions,
        uint256 maxMultiplier,
        uint256 consecutivePayments,
        uint256 riskFactor
    ) internal pure returns (uint256) {
        // Base multiplier starts at 1 and increases with consecutive payments
        uint256 baseMultiplier = 1;

        // Add up to 1.0 multiplier for consecutive payments (max benefit at 12 months)
        uint256 loyaltyBonus = (consecutivePayments > 12)
            ? 100
            : (consecutivePayments * 100) / 12;

        // Combine base and loyalty bonus (in percentage * 100)
        uint256 combinedMultiplier = baseMultiplier * 100 + loyaltyBonus;

        // Adjust by risk factor (lower risk = higher coverage)
        uint256 adjustedMultiplier = (combinedMultiplier * 100) / riskFactor;

        // Cap at maximum multiplier
        uint256 finalMultiplier = (adjustedMultiplier > maxMultiplier * 100)
            ? maxMultiplier * 100
            : adjustedMultiplier;

        // Calculate coverage (divide by 100 to account for percentage)
        return (contributions * finalMultiplier) / 100;
    }

    /**
     * @dev Override reviewClaim to use pool-specific payout
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
            uint256 membershipId = claim.membershipId;
            uint256 poolId = membershipToPool[membershipId];

            if (poolId > 0) {
                processPoolPayout(claimId);
            } else {
                processPayout(claimId); // Fallback to original pool if not in a specific pool
            }
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

    /**
     * @dev Register a new assessor (Admin only)
     * @param assessorAddress Address of the assessor
     * @param name Name of the assessor
     * @param credentials Professional credentials of the assessor
     * @param specialization Specialization of the assessor (e.g., "Mechanical", "Collision")
     */
    function registerAssessor(
        address assessorAddress,
        string memory name,
        string memory credentials,
        string memory specialization
    ) external onlyRole(ADMIN_ROLE) {
        require(assessorAddress != address(0), "Invalid address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(credentials).length > 0, "Credentials cannot be empty");
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
            reputationScore: 100 // Default starting score
        });

        assessors[assessorAddress] = newAssessor;
        _grantRole(ASSESSOR_ROLE, assessorAddress);

        emit AssessorRegistered(assessorAddress, name, credentials);
    }

    /**
     * @dev Revoke assessor role (Admin only)
     * @param assessorAddress Address of the assessor
     * @param reason Reason for revocation
     */
    function revokeAssessor(
        address assessorAddress,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ASSESSOR_ROLE, assessorAddress), "Not an assessor");

        // Remove assessor from any active claims
        uint256[] memory activeClaims = assessorActiveClaims[assessorAddress];
        for (uint256 i = 0; i < activeClaims.length; i++) {
            uint256 claimId = activeClaims[i];
            Claim storage claim = claims[claimId];

            if (
                claim.assignedAssessor == assessorAddress &&
                (claim.status == ClaimStatus.UnderAssessment ||
                    claim.isAssessorWorking)
            ) {
                claim.assignedAssessor = address(0);
                claim.isAssessorWorking = false;
                claim.status = ClaimStatus.Pending;

                emit AssessorRemovedFromClaim(claimId, assessorAddress, reason);
            }
        }

        // Update assessor status
        assessors[assessorAddress].isActive = false;

        // Revoke role
        _revokeRole(ASSESSOR_ROLE, assessorAddress);

        emit AssessorRevoked(assessorAddress, reason);
    }

    /**
     * @dev Register a new actuary (Admin only)
     * @param actuaryAddress Address of the actuary
     * @param name Name of the actuary
     * @param credentials Professional credentials of the actuary
     */
    function registerActuary(
        address actuaryAddress,
        string memory name,
        string memory credentials
    ) external onlyRole(ADMIN_ROLE) {
        require(actuaryAddress != address(0), "Invalid address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(credentials).length > 0, "Credentials cannot be empty");
        require(!hasRole(ACTUARY_ROLE, actuaryAddress), "Already an actuary");

        // Grant actuary role
        _grantRole(ACTUARY_ROLE, actuaryAddress);

        // We could create an Actuary struct if more detailed info is needed

        emit ActuaryRegistered(actuaryAddress, name, credentials);
    }

    /**
     * @dev Revoke actuary role (Admin only)
     * @param actuaryAddress Address of the actuary
     * @param reason Reason for revocation
     */
    function revokeActuary(
        address actuaryAddress,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ACTUARY_ROLE, actuaryAddress), "Not an actuary");

        // Revoke role
        _revokeRole(ACTUARY_ROLE, actuaryAddress);

        emit ActuaryRevoked(actuaryAddress, reason);
    }

    /**
     * @dev Assign an assessor to a claim (Admin only)
     * @param claimId The ID of the claim
     * @param assessorAddress Address of the assessor
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
        claim.status = ClaimStatus.UnderAssessment;
        claim.isAssessorWorking = true;

        assessorActiveClaims[assessorAddress].push(claimId);
        claimAssessorHistory[claimId].push(assessorAddress);

        emit AssessorAssignedToClaim(claimId, assessorAddress);
    }

    /**
     * @dev Reassign a claim to a different assessor (Admin only)
     * @param claimId The ID of the claim
     * @param newAssessorAddress Address of the new assessor
     * @param reason Reason for reassignment
     */
    function reassignClaim(
        uint256 claimId,
        address newAssessorAddress,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) {
        require(hasRole(ASSESSOR_ROLE, newAssessorAddress), "Not an assessor");
        require(
            assessors[newAssessorAddress].isActive,
            "New assessor not active"
        );

        Claim storage claim = claims[claimId];
        require(
            claim.status == ClaimStatus.UnderAssessment ||
                claim.status == ClaimStatus.Pending,
            "Cannot reassign at current status"
        );

        address oldAssessor = claim.assignedAssessor;
        require(oldAssessor != address(0), "No assessor assigned");
        require(oldAssessor != newAssessorAddress, "Same assessor");

        // Remove from old assessor's active claims
        removeFromActiveClaimsList(oldAssessor, claimId);

        // Update claim
        claim.assignedAssessor = newAssessorAddress;
        claim.assignmentDate = block.timestamp;
        claim.isAssessorWorking = true;
        claim.status = ClaimStatus.UnderAssessment;

        // Add to new assessor's active claims
        assessorActiveClaims[newAssessorAddress].push(claimId);
        claimAssessorHistory[claimId].push(newAssessorAddress);

        emit AssessorRemovedFromClaim(claimId, oldAssessor, reason);
        emit AssessorAssignedToClaim(claimId, newAssessorAddress);
        emit ClaimReassigned(claimId, oldAssessor, newAssessorAddress);
    }

    /**
     * @dev Submit assessment for a claim (Assessor only)
     * @param claimId The ID of the claim
     * @param approved Whether the claim is approved
     * @param approvedAmount Approved amount (if applicable)
     * @param notes Assessment notes
     */
    function assessClaim(
        uint256 claimId,
        bool approved,
        uint256 approvedAmount,
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
        require(claim.isAssessorWorking, "Not marked as working");

        if (approved) {
            require(approvedAmount > 0, "Approved amount must be > 0");
            require(
                approvedAmount <= claim.requestedAmount,
                "Cannot exceed requested amount"
            );

            claim.status = ClaimStatus.AssessorApproved;
            claim.assessorApprovedAmount = approvedAmount;
        } else {
            claim.status = ClaimStatus.AssessorRejected;
            claim.assessorApprovedAmount = 0;
        }

        claim.assessorNotes = notes;
        claim.assessmentDate = block.timestamp;
        claim.isAssessorWorking = false;

        // Remove from active claims
        removeFromActiveClaimsList(msg.sender, claimId);

        // Update assessor stats
        assessors[msg.sender].totalAssessments++;

        emit ClaimAssessed(claimId, msg.sender, approved, approvedAmount);
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
}
