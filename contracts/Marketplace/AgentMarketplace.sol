// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAgentNft is IERC721 {
    function agentByOwner(address owner) external view returns (uint256);
}

/**
 * @title AgentMarketplace
 * @notice Non-custodial listings for Concierge Agentic IDs.
 *         Sales: seller approves marketplace; buy() pays seller + transferFrom in one tx.
 *         Rentals: ownership stays with lessor; time-bound access recorded onchain.
 *         Platform fee (default 2.5%) sent to treasury on sale and rent payments.
 */
contract AgentMarketplace is ReentrancyGuard {
    IAgentNft public immutable agentNft;
    address public immutable treasury;
    uint256 public immutable feeBps;

    uint256 public constant MAX_FEE_BPS = 1000; // 10% cap
    uint256 public constant DEFAULT_FEE_BPS = 250; // 2.5%

    struct SaleListing {
        address seller;
        uint256 priceWei;
        bool active;
    }

    struct RentListing {
        address owner;
        uint256 priceWei;
        uint64 durationSec;
        bool active;
    }

    struct Rental {
        address renter;
        uint64 expiresAt;
    }

    mapping(uint256 => SaleListing) public sales;
    mapping(uint256 => RentListing) public rents;
    mapping(uint256 => Rental) public rentals;

    uint256[] private _saleTokenIds;
    uint256[] private _rentTokenIds;

    event ListedForSale(uint256 indexed tokenId, address indexed seller, uint256 priceWei);
    event SaleCancelled(uint256 indexed tokenId, address indexed seller);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 priceWei);

    event ListedForRent(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 priceWei,
        uint64 durationSec
    );
    event RentCancelled(uint256 indexed tokenId, address indexed owner);
    event Rented(
        uint256 indexed tokenId,
        address indexed owner,
        address indexed renter,
        uint64 expiresAt,
        uint256 priceWei
    );

    event PlatformFeeCollected(
        uint256 indexed tokenId,
        address indexed payer,
        address indexed payee,
        uint256 feeWei,
        bytes32 kind
    );

    constructor(address agentNft_, address treasury_, uint256 feeBps_) {
        require(agentNft_ != address(0), "bad agent");
        require(treasury_ != address(0), "bad treasury");
        uint256 bps = feeBps_ == 0 ? DEFAULT_FEE_BPS : feeBps_;
        require(bps <= MAX_FEE_BPS, "fee too high");
        agentNft = IAgentNft(agentNft_);
        treasury = treasury_;
        feeBps = bps;
    }

    function _splitFee(uint256 amount) internal view returns (uint256 net, uint256 fee) {
        fee = (amount * feeBps) / 10_000;
        net = amount - fee;
    }

    function _payoutFees(
        uint256 tokenId,
        address payer,
        address payee,
        uint256 net,
        uint256 fee,
        bytes32 kind
    ) internal {
        if (fee > 0) {
            (bool okFee, ) = payable(treasury).call{value: fee}("");
            require(okFee, "fee payout failed");
            emit PlatformFeeCollected(tokenId, payer, treasury, fee, kind);
        }
        (bool ok, ) = payable(payee).call{value: net}("");
        require(ok, "payout failed");
    }

    // -------- Sales --------

    function listForSale(uint256 tokenId, uint256 priceWei) external {
        require(priceWei > 0, "price=0");
        require(agentNft.ownerOf(tokenId) == msg.sender, "not owner");
        require(
            agentNft.getApproved(tokenId) == address(this) ||
                agentNft.isApprovedForAll(msg.sender, address(this)),
            "approve marketplace first"
        );

        bool wasActive = sales[tokenId].active;
        sales[tokenId] = SaleListing({
            seller: msg.sender,
            priceWei: priceWei,
            active: true
        });
        if (!wasActive) _saleTokenIds.push(tokenId);

        if (rents[tokenId].active) {
            rents[tokenId].active = false;
            emit RentCancelled(tokenId, msg.sender);
        }

        emit ListedForSale(tokenId, msg.sender, priceWei);
    }

    function cancelSale(uint256 tokenId) external {
        SaleListing storage listing = sales[tokenId];
        require(listing.active, "not listed");
        require(listing.seller == msg.sender, "not seller");
        listing.active = false;
        emit SaleCancelled(tokenId, msg.sender);
    }

    function buy(uint256 tokenId) external payable nonReentrant {
        SaleListing storage listing = sales[tokenId];
        require(listing.active, "not listed");
        require(msg.value == listing.priceWei, "bad payment");
        address seller = listing.seller;
        require(seller != msg.sender, "self buy");
        require(agentNft.ownerOf(tokenId) == seller, "seller lost ownership");
        require(agentNft.agentByOwner(msg.sender) == 0, "buyer already has agent");

        listing.active = false;
        uint256 price = listing.priceWei;
        (uint256 sellerAmount, uint256 fee) = _splitFee(price);

        agentNft.transferFrom(seller, msg.sender, tokenId);

        _payoutFees(tokenId, msg.sender, seller, sellerAmount, fee, "sale");

        emit Sold(tokenId, seller, msg.sender, price);
    }

    // -------- Rentals (no ownership transfer) --------

    function listForRent(
        uint256 tokenId,
        uint256 priceWei,
        uint64 durationSec
    ) external {
        require(priceWei > 0, "price=0");
        require(durationSec >= 1 hours && durationSec <= 365 days, "bad duration");
        require(agentNft.ownerOf(tokenId) == msg.sender, "not owner");

        bool wasActive = rents[tokenId].active;
        rents[tokenId] = RentListing({
            owner: msg.sender,
            priceWei: priceWei,
            durationSec: durationSec,
            active: true
        });
        if (!wasActive) _rentTokenIds.push(tokenId);

        if (sales[tokenId].active) {
            sales[tokenId].active = false;
            emit SaleCancelled(tokenId, msg.sender);
        }

        emit ListedForRent(tokenId, msg.sender, priceWei, durationSec);
    }

    function cancelRent(uint256 tokenId) external {
        RentListing storage listing = rents[tokenId];
        require(listing.active, "not listed");
        require(listing.owner == msg.sender, "not owner");
        listing.active = false;
        emit RentCancelled(tokenId, msg.sender);
    }

    function rent(uint256 tokenId) external payable nonReentrant {
        RentListing storage listing = rents[tokenId];
        require(listing.active, "not listed");
        require(msg.value == listing.priceWei, "bad payment");
        require(listing.owner != msg.sender, "self rent");
        require(agentNft.ownerOf(tokenId) == listing.owner, "owner changed");

        Rental storage current = rentals[tokenId];
        require(
            current.renter == address(0) || current.expiresAt < block.timestamp,
            "already rented"
        );

        uint64 expiresAt = uint64(block.timestamp) + listing.durationSec;
        rentals[tokenId] = Rental({renter: msg.sender, expiresAt: expiresAt});

        address owner_ = listing.owner;
        uint256 price = listing.priceWei;
        (uint256 ownerAmount, uint256 fee) = _splitFee(price);

        _payoutFees(tokenId, msg.sender, owner_, ownerAmount, fee, "rent");

        emit Rented(tokenId, owner_, msg.sender, expiresAt, price);
    }

    /// @notice Owner or active renter has access (for board / compute gates).
    function hasAccess(uint256 tokenId, address user) external view returns (bool) {
        if (user == address(0)) return false;
        if (agentNft.ownerOf(tokenId) == user) return true;
        Rental memory r = rentals[tokenId];
        return r.renter == user && r.expiresAt >= block.timestamp;
    }

    function getActiveSaleIds() external view returns (uint256[] memory ids) {
        uint256 n;
        for (uint256 i = 0; i < _saleTokenIds.length; i++) {
            if (sales[_saleTokenIds[i]].active) n++;
        }
        ids = new uint256[](n);
        uint256 j;
        for (uint256 i = 0; i < _saleTokenIds.length; i++) {
            uint256 id = _saleTokenIds[i];
            if (sales[id].active) ids[j++] = id;
        }
    }

    function getActiveRentIds() external view returns (uint256[] memory ids) {
        uint256 n;
        for (uint256 i = 0; i < _rentTokenIds.length; i++) {
            if (rents[_rentTokenIds[i]].active) n++;
        }
        ids = new uint256[](n);
        uint256 j;
        for (uint256 i = 0; i < _rentTokenIds.length; i++) {
            uint256 id = _rentTokenIds[i];
            if (rents[id].active) ids[j++] = id;
        }
    }
}
