// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StringUtils
 * @dev Library with utility functions for string operations
 */
library StringUtils {
    /**
     * @dev Convert a uint256 to a string
     * @param value The uint256 to convert
     * @return The string representation of the uint256
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
