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
        string metadataURI; // IPFS URI to metadata (including images)
        uint256 createdAt;
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

    // Events
    event CarMinted(uint256 indexed tokenId, string vin, address owner);
    event MaintenanceAdded(uint256 indexed tokenId, uint256 recordIndex);
    event IssueReported(uint256 indexed tokenId, uint256 reportIndex);
    event IssueResolved(uint256 indexed tokenId, uint256 reportIndex);

    constructor() ERC721("Car Digital Logbook", "CDLB") {}

    /**
     * @dev Mint a new car NFT
     * @param to Address that will own the NFT
     * @param vin Vehicle Identification Number
     * @param make Car manufacturer
     * @param model Car model
     * @param year Manufacturing year
     * @param registrationNumber Official registration number
     * @param metadataURI URI to the metadata (IPFS) including car images
     */
    function mintCar(
        address to,
        string memory vin,
        string memory make,
        string memory model,
        uint256 year,
        string memory registrationNumber,
        string memory metadataURI
    ) public returns (uint256) {
        require(!_vinRegistered[vin], "VIN already registered");
        require(bytes(vin).length > 0, "VIN cannot be empty");
        require(bytes(make).length > 0, "Make cannot be empty");
        require(bytes(model).length > 0, "Model cannot be empty");
        require(year > 0, "Year must be valid");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(to, newTokenId);

        _carDetails[newTokenId] = CarDetails({
            vin: vin,
            make: make,
            model: model,
            year: year,
            registrationNumber: registrationNumber,
            metadataURI: metadataURI,
            createdAt: block.timestamp
        });

        _vinRegistered[vin] = true;
        _vinToTokenId[vin] = newTokenId;

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
        return _carDetails[tokenId].metadataURI;
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
        return _vinToTokenId[vin];
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
