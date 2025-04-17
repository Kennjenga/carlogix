// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CarNFT
 * @dev Contract for representing cars as NFTs with maintenance and issue tracking
 * Enhanced with ERC721Enumerable for easy token ownership enumeration
 */
contract CarNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Struct to store car details
    struct CarDetails {
        string vin;
        string make;
        string model;
        uint256 year;
        string registrationNumber;
        string imageURI; // Direct path to the car image
        uint256 createdAt;
        bool isDeleted; // Flag to mark if a car is deleted
    }

    // Struct for maintenance records
    struct MaintenanceRecord {
        uint256 timestamp;
        string description;
        string serviceProvider;
        uint256 mileage;
        string documentURI; // IPFS hash to maintenance documents
    }

    // Simplified IssueReport struct - removed diagnosis and symptoms
    struct IssueReport {
        uint256 timestamp;
        string issueType;
        string description; // Detailed description for AI to analyze
        bool resolved;
        string evidenceURI; // IPFS hash to issue evidence
    }

    // Mapping from token ID to car details
    mapping(uint256 => CarDetails) private _carDetails;

    // Mapping from token ID to maintenance records
    mapping(uint256 => MaintenanceRecord[]) private _maintenanceRecords;

    // Mapping from token ID to issue reports
    mapping(uint256 => IssueReport[]) private _issueReports;

    // Mapping to track VIN to prevent duplicates
    mapping(string => bool) private _vinRegistered;

    // Mapping from VIN to token ID for easy lookup
    mapping(string => uint256) private _vinToTokenId;

    // Mapping from registration number to token ID for easy lookup
    mapping(string => uint256) private _regNumberToTokenId;

    // Mapping to track registration numbers to prevent duplicates
    mapping(string => bool) private _regNumberRegistered;

    // Events
    event CarMinted(uint256 indexed tokenId, string vin, address owner);
    event MaintenanceAdded(uint256 indexed tokenId, uint256 recordIndex);
    event IssueReported(uint256 indexed tokenId, uint256 reportIndex);
    event IssueResolved(uint256 indexed tokenId, uint256 reportIndex);
    event CarDeleted(uint256 indexed tokenId, string vin);

    constructor() ERC721("Car Digital Logbook", "CDLB") {}

    /**
     * @dev Mint a new car NFT
     * @param to Address that will own the NFT
     * @param vin Vehicle Identification Number
     * @param make Car manufacturer
     * @param model Car model
     * @param year Manufacturing year
     * @param registrationNumber Official registration number
     * @param imageURI Direct URI to the car image
     */
    function mintCar(
        address to,
        string memory vin,
        string memory make,
        string memory model,
        uint256 year,
        string memory registrationNumber,
        string memory imageURI
    ) public returns (uint256) {
        require(!_vinRegistered[vin], "VIN already registered");
        require(
            !_regNumberRegistered[registrationNumber],
            "Registration number already registered"
        );
        require(bytes(vin).length > 0, "VIN cannot be empty");
        require(bytes(make).length > 0, "Make cannot be empty");
        require(bytes(model).length > 0, "Model cannot be empty");
        require(year > 0, "Year must be valid");
        require(
            bytes(registrationNumber).length > 0,
            "Registration number cannot be empty"
        );
        require(bytes(imageURI).length > 0, "Image URI cannot be empty");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(to, newTokenId);

        _carDetails[newTokenId] = CarDetails({
            vin: vin,
            make: make,
            model: model,
            year: year,
            registrationNumber: registrationNumber,
            imageURI: imageURI,
            createdAt: block.timestamp,
            isDeleted: false
        });

        _vinRegistered[vin] = true;
        _vinToTokenId[vin] = newTokenId;

        _regNumberRegistered[registrationNumber] = true;
        _regNumberToTokenId[registrationNumber] = newTokenId;

        emit CarMinted(newTokenId, vin, to);

        return newTokenId;
    }

    /**
     * @dev Get token URI (required for ERC721 metadata standard)
     * @param tokenId The ID of the NFT to get URI for
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        // For simplicity, we're directly returning the image URI as the token URI
        return _carDetails[tokenId].imageURI;
    }

    /**
     * @dev Delete a car NFT (logical deletion)
     * @param tokenId The ID of the car NFT to delete
     */
    function deleteCar(uint256 tokenId) public {
        require(_exists(tokenId), "Car does not exist");
        require(
            ownerOf(tokenId) == msg.sender || owner() == msg.sender,
            "Only owner or contract owner can delete"
        );
        require(!_carDetails[tokenId].isDeleted, "Car already deleted");

        // Mark the car as deleted
        _carDetails[tokenId].isDeleted = true;

        // Free up the VIN and registration number for future use
        string memory vin = _carDetails[tokenId].vin;
        string memory regNumber = _carDetails[tokenId].registrationNumber;

        _vinRegistered[vin] = false;
        _regNumberRegistered[regNumber] = false;

        emit CarDeleted(tokenId, vin);
    }

    /**
     * @dev Add a maintenance record to a car's history
     * @param tokenId The ID of the car NFT
     * @param description Description of the maintenance
     * @param serviceProvider Name of the service provider
     * @param mileage Current mileage of the car
     * @param documentURI IPFS URI to maintenance documents
     */
    function addMaintenanceRecord(
        uint256 tokenId,
        string memory description,
        string memory serviceProvider,
        uint256 mileage,
        string memory documentURI
    ) public {
        require(_exists(tokenId), "Car does not exist");
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );

        MaintenanceRecord memory newRecord = MaintenanceRecord({
            timestamp: block.timestamp,
            description: description,
            serviceProvider: serviceProvider,
            mileage: mileage,
            documentURI: documentURI
        });

        _maintenanceRecords[tokenId].push(newRecord);

        emit MaintenanceAdded(tokenId, _maintenanceRecords[tokenId].length - 1);
    }

    /**
     * @dev Report an issue with a car
     * @param tokenId The ID of the car NFT
     * @param issueType Type of issue (mechanical, electrical, etc.)
     * @param description Detailed description of the issue for AI diagnosis
     * @param evidenceURI IPFS URI to issue evidence (images, videos)
     */
    function reportIssue(
        uint256 tokenId,
        string memory issueType,
        string memory description,
        string memory evidenceURI
    ) public {
        require(_exists(tokenId), "Car does not exist");
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );

        IssueReport memory newReport = IssueReport({
            timestamp: block.timestamp,
            issueType: issueType,
            description: description,
            resolved: false,
            evidenceURI: evidenceURI
        });

        _issueReports[tokenId].push(newReport);

        emit IssueReported(tokenId, _issueReports[tokenId].length - 1);
    }

    /**
     * @dev Mark an issue as resolved
     * @param tokenId The ID of the car NFT
     * @param reportIndex The index of the issue report
     */
    function resolveIssue(uint256 tokenId, uint256 reportIndex) public {
        require(_exists(tokenId), "Car does not exist");
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );
        require(
            reportIndex < _issueReports[tokenId].length,
            "Report does not exist"
        );
        require(
            !_issueReports[tokenId][reportIndex].resolved,
            "Issue already resolved"
        );

        _issueReports[tokenId][reportIndex].resolved = true;

        emit IssueResolved(tokenId, reportIndex);
    }

    /**
     * @dev Get token ID by VIN
     * @param vin Vehicle Identification Number
     * @return tokenId The token ID for the given VIN
     */
    function getTokenIdByVIN(string memory vin) public view returns (uint256) {
        require(_vinRegistered[vin], "VIN not registered");
        uint256 tokenId = _vinToTokenId[vin];
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        return tokenId;
    }

    /**
     * @dev Get token ID by registration number
     * @param registrationNumber The official registration number
     * @return tokenId The token ID for the given registration number
     */
    function getTokenIdByRegistrationNumber(
        string memory registrationNumber
    ) public view returns (uint256) {
        require(
            _regNumberRegistered[registrationNumber],
            "Registration number not registered"
        );
        uint256 tokenId = _regNumberToTokenId[registrationNumber];
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        return tokenId;
    }

    /**
     * @dev Search car by VIN and get vehicle details
     * @param vin Vehicle Identification Number
     * @return make The car manufacturer
     * @return model The car model
     * @return year The manufacturing year
     * @return imageURI Direct URI to the car image
     */
    function searchByVIN(
        string memory vin
    )
        public
        view
        returns (
            string memory make,
            string memory model,
            uint256 year,
            string memory imageURI
        )
    {
        require(_vinRegistered[vin], "VIN not registered");
        uint256 tokenId = _vinToTokenId[vin];
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");

        CarDetails memory car = _carDetails[tokenId];
        return (car.make, car.model, car.year, car.imageURI);
    }

    /**
     * @dev Search car by registration number and get vehicle details
     * @param registrationNumber The official registration number
     * @return make The car manufacturer
     * @return model The car model
     * @return year The manufacturing year
     * @return imageURI Direct URI to the car image
     */
    function searchByRegistrationNumber(
        string memory registrationNumber
    )
        public
        view
        returns (
            string memory make,
            string memory model,
            uint256 year,
            string memory imageURI
        )
    {
        require(
            _regNumberRegistered[registrationNumber],
            "Registration number not registered"
        );
        uint256 tokenId = _regNumberToTokenId[registrationNumber];
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");

        CarDetails memory car = _carDetails[tokenId];
        return (car.make, car.model, car.year, car.imageURI);
    }

    // Getter functions

    /**
     * @dev Get car details
     * @param tokenId The ID of the car NFT
     */
    function getCarDetails(
        uint256 tokenId
    ) public view returns (CarDetails memory) {
        require(_exists(tokenId), "Car does not exist");
        return _carDetails[tokenId];
    }

    /**
     * @dev Get all maintenance records for a car
     * @param tokenId The ID of the car NFT
     */
    function getMaintenanceRecords(
        uint256 tokenId
    ) public view returns (MaintenanceRecord[] memory) {
        require(_exists(tokenId), "Car does not exist");
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        return _maintenanceRecords[tokenId];
    }

    /**
     * @dev Get all issue reports for a car
     * @param tokenId The ID of the car NFT
     */
    function getIssueReports(
        uint256 tokenId
    ) public view returns (IssueReport[] memory) {
        require(_exists(tokenId), "Car does not exist");
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        return _issueReports[tokenId];
    }

    /**
     * @dev Override _beforeTokenTransfer to handle the ERC721Enumerable logic
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Required override for supportsInterface function
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
