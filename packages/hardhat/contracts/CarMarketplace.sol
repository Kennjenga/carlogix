// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CarNFT.sol";

contract CarMarketplace is Ownable {
    // State variables
    CarNFT public carNFTContract;
    address public defaultStablecoin;

    // Struct for marketplace listings
    struct Listing {
        uint256 price; // Price in USDT (6 decimals)
        bool isActive; // Whether the listing is active
        uint256 listedAt; // Timestamp when the car was listed
        string description; // Optional listing description
    }

    // Mappings
    mapping(uint256 => Listing) private _listings; // TokenId => Listing

    // Events
    event CarListed(uint256 indexed tokenId, uint256 price, string description);
    event ListingUpdated(uint256 indexed tokenId, uint256 newPrice);
    event ListingCanceled(uint256 indexed tokenId);
    event CarSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    constructor(address _carNFTContract, address _defaultStablecoin) Ownable() {
        require(_carNFTContract != address(0), "Invalid CarNFT address");
        require(_defaultStablecoin != address(0), "Invalid stablecoin address");
        carNFTContract = CarNFT(_carNFTContract);
        defaultStablecoin = _defaultStablecoin;
    }

    /**
     * @dev Update the default stablecoin address
     * @param _defaultStablecoin New stablecoin contract address
     */
    function updateDefaultStablecoin(
        address _defaultStablecoin
    ) external onlyOwner {
        require(_defaultStablecoin != address(0), "Invalid stablecoin address");
        defaultStablecoin = _defaultStablecoin;
    }

    /**
     * @dev List a car for sale
     * @param tokenId The ID of the car NFT to list
     * @param price The price in USDT (6 decimals)
     * @param description Optional description for the listing
     */
    function listCar(
        uint256 tokenId,
        uint256 price,
        string memory description
    ) public {
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the car owner"
        );
        require(!_listings[tokenId].isActive, "Car already listed");
        require(price > 0, "Price must be greater than 0");

        _listings[tokenId] = Listing({
            price: price,
            isActive: true,
            listedAt: block.timestamp,
            description: description
        });

        emit CarListed(tokenId, price, description);
    }

    /**
     * @dev Update the price of a listed car
     * @param tokenId The ID of the listed car NFT
     * @param newPrice The new price in USDT (6 decimals)
     */
    function updateListingPrice(uint256 tokenId, uint256 newPrice) public {
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the car owner"
        );
        require(_listings[tokenId].isActive, "Car not listed");
        require(newPrice > 0, "Price must be greater than 0");

        _listings[tokenId].price = newPrice;
        emit ListingUpdated(tokenId, newPrice);
    }

    /**
     * @dev Cancel a car listing
     * @param tokenId The ID of the listed car NFT
     */
    function cancelListing(uint256 tokenId) public {
        require(
            carNFTContract.ownerOf(tokenId) == msg.sender,
            "Not the car owner"
        );
        require(_listings[tokenId].isActive, "Car not listed");

        delete _listings[tokenId];
        emit ListingCanceled(tokenId);
    }

    /**
     * @dev Purchase a listed car using USDT
     * @param tokenId The ID of the car NFT to purchase
     */
    function purchaseCar(uint256 tokenId) public {
        require(_listings[tokenId].isActive, "Car not listed for sale");
        address seller = carNFTContract.ownerOf(tokenId);
        require(msg.sender != seller, "Cannot buy your own car");

        uint256 price = _listings[tokenId].price;

        // First approve USDT transfer
        IERC20 usdt = IERC20(defaultStablecoin);
        require(
            usdt.transferFrom(msg.sender, seller, price),
            "USDT transfer failed"
        );

        // Transfer the NFT
        carNFTContract.transferFrom(seller, msg.sender, tokenId);

        // Remove the listing
        delete _listings[tokenId];

        emit CarSold(tokenId, seller, msg.sender, price);
    }

    /**
     * @dev Get all active listings
     * @param startIndex Start index for pagination
     * @param count Number of listings to return
     */
    function getActiveListings(
        uint256 startIndex,
        uint256 count
    )
        public
        view
        returns (
            uint256[] memory tokenIds,
            uint256[] memory prices,
            address[] memory sellers
        )
    {
        uint256 totalSupply = carNFTContract.totalSupply();
        require(startIndex < totalSupply, "Start index out of bounds");

        uint256 actualCount = 0;
        // First pass: count active listings
        for (
            uint256 i = startIndex;
            i < startIndex + count && i < totalSupply;
            i++
        ) {
            uint256 tokenId = carNFTContract.tokenByIndex(i);
            if (_listings[tokenId].isActive) {
                actualCount++;
            }
        }

        // Initialize return arrays
        tokenIds = new uint256[](actualCount);
        prices = new uint256[](actualCount);
        sellers = new address[](actualCount);

        // Second pass: populate arrays
        uint256 currentIndex = 0;
        for (
            uint256 i = startIndex;
            i < startIndex + count &&
                i < totalSupply &&
                currentIndex < actualCount;
            i++
        ) {
            uint256 tokenId = carNFTContract.tokenByIndex(i);
            if (_listings[tokenId].isActive) {
                tokenIds[currentIndex] = tokenId;
                prices[currentIndex] = _listings[tokenId].price;
                sellers[currentIndex] = carNFTContract.ownerOf(tokenId);
                currentIndex++;
            }
        }

        return (tokenIds, prices, sellers);
    }

    /**
     * @dev Get listing details for a specific car
     * @param tokenId The ID of the car NFT
     */
    function getListingDetails(
        uint256 tokenId
    )
        public
        view
        returns (
            uint256 price,
            bool isActive,
            uint256 listedAt,
            string memory description
        )
    {
        Listing memory listing = _listings[tokenId];
        return (
            listing.price,
            listing.isActive,
            listing.listedAt,
            listing.description
        );
    }
}
