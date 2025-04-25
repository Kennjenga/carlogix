// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./StringUtils.sol";

contract CarNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using StringUtils for uint256;
    Counters.Counter private _tokenIds;

    // Struct to store manufacturer details
    struct Manufacturer {
        string name;
        bool isActive;
    }

    // Struct to store car details
    struct CarDetails {
        string vin;
        string make;
        string model;
        uint256 year;
        string registrationNumber;
        string imageURI;
        uint256 createdAt;
        bool isDeleted;
    }

    // Struct for maintenance records
    struct MaintenanceRecord {
        uint256 timestamp;
        string description;
        string serviceProvider;
        uint256 mileage;
        string documentURI;
    }

    // Simplified IssueReport struct
    struct IssueReport {
        uint256 timestamp;
        string issueType;
        string description;
        bool resolved;
        string evidenceURI;
    }

    // Insurance details struct
    struct InsuranceDetails {
        string policyNumber;
        string provider;
        uint256 startDate;
        uint256 endDate;
        string documentURI;
        bool active;
    }

    // Mappings
    mapping(uint256 => CarDetails) private _carDetails;
    mapping(uint256 => MaintenanceRecord[]) private _maintenanceRecords;
    mapping(uint256 => IssueReport[]) private _issueReports;
    mapping(uint256 => InsuranceDetails) private _insuranceDetails;
    mapping(string => bool) private _vinRegistered;
    mapping(string => uint256) private _vinToTokenId;
    mapping(string => uint256) private _regNumberToTokenId;
    mapping(string => bool) private _regNumberRegistered;
    mapping(address => Manufacturer) private _manufacturers;

    // Events
    event CarMinted(uint256 indexed tokenId, string vin, address owner);
    event MaintenanceAdded(uint256 indexed tokenId, uint256 recordIndex);
    event IssueReported(uint256 indexed tokenId, uint256 reportIndex);
    event IssueResolved(uint256 indexed tokenId, uint256 reportIndex);
    event CarDeleted(uint256 indexed tokenId, string vin);
    event CarUpdated(uint256 indexed tokenId, string field, string newValue);
    event InsuranceAdded(uint256 indexed tokenId, string policyNumber);
    event InsuranceUpdated(uint256 indexed tokenId, string policyNumber);
    event BulkCarsMinted(address indexed manufacturer, uint256 count);
    event ManufacturerAdded(address indexed manufacturer, string name);
    event ManufacturerStatusChanged(
        address indexed manufacturer,
        bool isActive
    );

    // Field selectors for efficient string comparison
    bytes32 private constant REG_NUMBER_SELECTOR =
        keccak256("registrationNumber");
    bytes32 private constant IMAGE_URI_SELECTOR = keccak256("imageURI");
    bytes32 private constant MAKE_SELECTOR = keccak256("make");
    bytes32 private constant MODEL_SELECTOR = keccak256("model");
    bytes32 private constant YEAR_SELECTOR = keccak256("year");

    // Modifier to restrict functions to only active manufacturers
    modifier onlyManufacturer() {
        require(
            _manufacturers[msg.sender].isActive,
            "Not an active manufacturer"
        );
        _;
    }

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
     * @dev Add a new manufacturer
     * @param manufacturerAddress Address of the manufacturer to add
     * @param name Name of the manufacturer
     */
    function addManufacturer(
        address manufacturerAddress,
        string memory name
    ) public onlyOwner {
        require(
            manufacturerAddress != address(0),
            "Invalid manufacturer address"
        );
        require(bytes(name).length > 0, "Manufacturer name cannot be empty");

        _manufacturers[manufacturerAddress] = Manufacturer({
            name: name,
            isActive: true
        });

        emit ManufacturerAdded(manufacturerAddress, name);
    }

    /**
     * @dev Toggle the active status of a manufacturer
     * @param manufacturerAddress Address of the manufacturer
     * @param isActive New active status
     */
    function setManufacturerStatus(
        address manufacturerAddress,
        bool isActive
    ) public onlyOwner {
        require(
            manufacturerAddress != address(0),
            "Invalid manufacturer address"
        );
        require(
            bytes(_manufacturers[manufacturerAddress].name).length > 0,
            "Manufacturer doesn't exist"
        );

        _manufacturers[manufacturerAddress].isActive = isActive;

        emit ManufacturerStatusChanged(manufacturerAddress, isActive);
    }

    /**
     * @dev Check if an address is a registered and active manufacturer
     * @param manufacturerAddress Address to check
     * @return bool True if the address is an active manufacturer
     */
    function isActiveManufacturer(
        address manufacturerAddress
    ) public view returns (bool) {
        return _manufacturers[manufacturerAddress].isActive;
    }

    /**
     * @dev Get manufacturer details
     * @param manufacturerAddress Address of the manufacturer
     * @return name Name of the manufacturer
     * @return isActive Whether the manufacturer is active
     */
    function getManufacturerDetails(
        address manufacturerAddress
    ) public view returns (string memory name, bool isActive) {
        require(
            bytes(_manufacturers[manufacturerAddress].name).length > 0,
            "Manufacturer doesn't exist"
        );
        return (
            _manufacturers[manufacturerAddress].name,
            _manufacturers[manufacturerAddress].isActive
        );
    }

    /**
     * @dev Mint multiple cars in bulk (only for manufacturers or authorized parties)
     * @param to Address array that will own the NFTs
     * @param vin Array of Vehicle Identification Numbers
     * @param make Array of car manufacturers
     * @param model Array of car models
     * @param year Array of manufacturing years
     * @param registrationNumber Array of official registration numbers
     * @param imageURI Array of direct URIs to car images
     */
    function bulkMintCars(
        address[] memory to,
        string[] memory vin,
        string[] memory make,
        string[] memory model,
        uint256[] memory year,
        string[] memory registrationNumber,
        string[] memory imageURI
    ) public onlyManufacturer returns (uint256[] memory) {
        require(to.length > 0, "Must mint at least one car");
        require(
            to.length == vin.length &&
                vin.length == make.length &&
                make.length == model.length &&
                model.length == year.length &&
                year.length == registrationNumber.length &&
                registrationNumber.length == imageURI.length,
            "All input arrays must have the same length"
        );

        uint256[] memory tokenIds = new uint256[](to.length);

        for (uint256 i = 0; i < to.length; i++) {
            require(!_vinRegistered[vin[i]], "VIN already registered");
            require(
                !_regNumberRegistered[registrationNumber[i]],
                "Registration number already registered"
            );
            require(bytes(vin[i]).length > 0, "VIN cannot be empty");
            require(bytes(make[i]).length > 0, "Make cannot be empty");
            require(bytes(model[i]).length > 0, "Model cannot be empty");
            require(year[i] > 0, "Year must be valid");
            require(
                bytes(registrationNumber[i]).length > 0,
                "Registration number cannot be empty"
            );
            require(bytes(imageURI[i]).length > 0, "Image URI cannot be empty");

            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            tokenIds[i] = newTokenId;

            _mint(to[i], newTokenId);

            _carDetails[newTokenId] = CarDetails({
                vin: vin[i],
                make: make[i],
                model: model[i],
                year: year[i],
                registrationNumber: registrationNumber[i],
                imageURI: imageURI[i],
                createdAt: block.timestamp,
                isDeleted: false
            });

            _vinRegistered[vin[i]] = true;
            _vinToTokenId[vin[i]] = newTokenId;

            _regNumberRegistered[registrationNumber[i]] = true;
            _regNumberToTokenId[registrationNumber[i]] = newTokenId;

            emit CarMinted(newTokenId, vin[i], to[i]);
        }

        emit BulkCarsMinted(msg.sender, to.length);

        return tokenIds;
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
     * @dev Add insurance details for a specific car
     * @param tokenId The ID of the car NFT
     * @param policyNumber The insurance policy number
     * @param provider The insurance provider
     * @param startDate The start date of the insurance policy
     * @param endDate The end date of the insurance policy
     * @param documentURI IPFS URI to the insurance document
     */
    function addInsuranceDetails(
        uint256 tokenId,
        string memory policyNumber,
        string memory provider,
        uint256 startDate,
        uint256 endDate,
        string memory documentURI
    ) public {
        require(_exists(tokenId), "Car does not exist");
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        require(
            bytes(policyNumber).length > 0,
            "Policy number cannot be empty"
        );
        require(bytes(provider).length > 0, "Provider cannot be empty");
        require(startDate > 0, "Start date must be valid");
        require(endDate > startDate, "End date must be after start date");

        _insuranceDetails[tokenId] = InsuranceDetails({
            policyNumber: policyNumber,
            provider: provider,
            startDate: startDate,
            endDate: endDate,
            documentURI: documentURI,
            active: true
        });

        emit InsuranceAdded(tokenId, policyNumber);
    }

    /**
     * @dev Update insurance details for a specific car
     * @param tokenId The ID of the car NFT
     * @param policyNumber The insurance policy number
     * @param provider The insurance provider
     * @param startDate The start date of the insurance policy
     * @param endDate The end date of the insurance policy
     * @param documentURI IPFS URI to the insurance document
     * @param active Whether the insurance is active
     */
    function updateInsuranceDetails(
        uint256 tokenId,
        string memory policyNumber,
        string memory provider,
        uint256 startDate,
        uint256 endDate,
        string memory documentURI,
        bool active
    ) public {
        require(_exists(tokenId), "Car does not exist");
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        require(
            bytes(policyNumber).length > 0,
            "Policy number cannot be empty"
        );
        require(bytes(provider).length > 0, "Provider cannot be empty");
        require(startDate > 0, "Start date must be valid");
        require(endDate > startDate, "End date must be after start date");

        _insuranceDetails[tokenId] = InsuranceDetails({
            policyNumber: policyNumber,
            provider: provider,
            startDate: startDate,
            endDate: endDate,
            documentURI: documentURI,
            active: active
        });

        emit InsuranceUpdated(tokenId, policyNumber);
    }

    /**
     * @dev Get insurance details for a car
     * @param tokenId The ID of the car NFT
     */
    function getInsuranceDetails(
        uint256 tokenId
    ) public view returns (InsuranceDetails memory) {
        require(_exists(tokenId), "Car does not exist");
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        return _insuranceDetails[tokenId];
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
     * @dev Update car details (only specific fields)
     * @param tokenId The ID of the car NFT
     * @param field The field to update ("registrationNumber", "imageURI", etc.)
     * @param newValue The new value for the field
     */
    function updateCarDetails(
        uint256 tokenId,
        string memory field,
        string memory newValue
    ) public {
        require(_exists(tokenId), "Car does not exist");
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        require(bytes(newValue).length > 0, "New value cannot be empty");

        bytes32 fieldHash = keccak256(abi.encodePacked(field));

        if (fieldHash == REG_NUMBER_SELECTOR) {
            require(
                !_regNumberRegistered[newValue],
                "Registration number already registered"
            );
            string memory oldRegNumber = _carDetails[tokenId]
                .registrationNumber;
            _regNumberRegistered[oldRegNumber] = false;
            _regNumberRegistered[newValue] = true;
            _regNumberToTokenId[newValue] = tokenId;
            delete _regNumberToTokenId[oldRegNumber];
            _carDetails[tokenId].registrationNumber = newValue;
        } else if (fieldHash == IMAGE_URI_SELECTOR) {
            _carDetails[tokenId].imageURI = newValue;
        } else if (fieldHash == MAKE_SELECTOR) {
            _carDetails[tokenId].make = newValue;
        } else if (fieldHash == MODEL_SELECTOR) {
            _carDetails[tokenId].model = newValue;
        } else {
            revert("Invalid field for update");
        }

        emit CarUpdated(tokenId, field, newValue);
    }

    /**
     * @dev Update car year
     * @param tokenId The ID of the car NFT
     * @param newYear The new year value
     */
    function updateCarYear(uint256 tokenId, uint256 newYear) public {
        require(_exists(tokenId), "Car does not exist");
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "Not owner nor approved"
        );
        require(!_carDetails[tokenId].isDeleted, "Car has been deleted");
        require(newYear > 0, "Year must be valid");

        _carDetails[tokenId].year = newYear;

        emit CarUpdated(tokenId, "year", newYear.toString());
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
