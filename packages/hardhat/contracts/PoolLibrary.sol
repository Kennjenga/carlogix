// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PoolLibrary
 * @dev Library containing utility functions for the CarInsurancePool contract
 */
library PoolLibrary {
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
     * @dev Check if a string contains a substring (case-insensitive)
     * @param source The source string
     * @param searchFor The substring to search for
     */
    function containsString(
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
     * @dev Remove item from an array by swapping with the last element
     * @param array The array to modify 
     * @param itemToRemove The item to remove from the array
     */
    function removeFromArray(uint256[] storage array, uint256 itemToRemove) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == itemToRemove) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }
}