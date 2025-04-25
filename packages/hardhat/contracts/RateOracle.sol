// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RateOracle
 * @dev Contract to store exchange rates fetched from CoinGecko
 * Allows authorized oracles to update rates
 */
contract RateOracle is AccessControl {
    // Role for oracles that can update rates
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Exchange rates with 6 decimals
    // currency pair => rate
    mapping(bytes32 => uint256) private exchangeRates;

    // Timestamps of last updates
    mapping(bytes32 => uint256) private lastUpdated;

    // Currency pair constants
    bytes32 public constant AVAX_USDT = keccak256("AVAX_USDT");
    bytes32 public constant USDT_KES = keccak256("USDT_KES");

    // Events
    event RateUpdated(bytes32 indexed pair, uint256 rate, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);

        // Initial fallback rates
        exchangeRates[AVAX_USDT] = 30 * 1e6; // 1 AVAX = 30 USDT
        exchangeRates[USDT_KES] = 130 * 1e6; // 1 USDT = 130 KES

        lastUpdated[AVAX_USDT] = block.timestamp;
        lastUpdated[USDT_KES] = block.timestamp;
    }

    /**
     * @dev Update exchange rate for a currency pair
     * @param pair The currency pair identifier
     * @param rate The new rate with 6 decimals
     */
    function updateRate(
        bytes32 pair,
        uint256 rate
    ) external onlyRole(ORACLE_ROLE) {
        require(rate > 0, "Rate must be greater than zero");

        exchangeRates[pair] = rate;
        lastUpdated[pair] = block.timestamp;

        emit RateUpdated(pair, rate, block.timestamp);
    }

    /**
     * @dev Update multiple exchange rates in a single transaction
     * @param pairs Array of currency pair identifiers
     * @param rates Array of rates with 6 decimals
     */
    function updateRates(
        bytes32[] calldata pairs,
        uint256[] calldata rates
    ) external onlyRole(ORACLE_ROLE) {
        require(pairs.length == rates.length, "Arrays must have same length");

        for (uint i = 0; i < pairs.length; i++) {
            require(rates[i] > 0, "Rates must be greater than zero");

            exchangeRates[pairs[i]] = rates[i];
            lastUpdated[pairs[i]] = block.timestamp;

            emit RateUpdated(pairs[i], rates[i], block.timestamp);
        }
    }

    /**
     * @dev Get exchange rate for a currency pair
     * @param pair The currency pair identifier
     * @return rate The exchange rate with 6 decimals
     * @return timestamp When the rate was last updated
     */
    function getRate(
        bytes32 pair
    ) external view returns (uint256 rate, uint256 timestamp) {
        rate = exchangeRates[pair];
        timestamp = lastUpdated[pair];

        require(rate > 0, "Rate not available");
    }

    /**
     * @dev Add a new oracle that can update rates
     * @param oracle Address of the new oracle
     */
    function addOracle(address oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ORACLE_ROLE, oracle);
    }

    /**
     * @dev Remove an oracle
     * @param oracle Address of the oracle to remove
     */
    function removeOracle(
        address oracle
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ORACLE_ROLE, oracle);
    }
}
