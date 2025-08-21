// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AgentNFT is Initializable, ERC721Upgradeable, OwnableUpgradeable {
    uint256 private _tokenIdCounter;

    mapping(uint256 => address) public vaults;

    struct EncryptedMetadata {
        bytes32 encryptedHash;
        address encryptionKeyOwner;
    }
    mapping(uint256 => EncryptedMetadata) private _encryptedData;

    mapping(uint256 => string) public agentDomain;

    event AgentMinted(
        address indexed user,
        uint256 tokenId,
        address vault,
        string domain
    );

    event MetadataUpdated(uint256 tokenId, bytes32 newEncryptedHash);

    /// @notice Initialize for proxy deployment
    function initialize(address owner_) external initializer {
        __ERC721_init("INFT Agent", "AGENT");
        __Ownable_init(owner_);
    }

    function mintAgent(
        address vault,
        bytes32 encryptedHash,
        string memory domain
    ) external returns (uint256) {
        _tokenIdCounter++;
        uint256 newId = _tokenIdCounter;

        _mint(msg.sender, newId);

        vaults[newId] = vault;
        _encryptedData[newId] = EncryptedMetadata({
            encryptedHash: encryptedHash,
            encryptionKeyOwner: msg.sender
        });
        agentDomain[newId] = domain;

        emit AgentMinted(msg.sender, newId, vault, domain);
        return newId;
    }

    function updateMetadata(
        uint256 tokenId,
        bytes32 newEncryptedHash
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _encryptedData[tokenId].encryptedHash = newEncryptedHash;
        emit MetadataUpdated(tokenId, newEncryptedHash);
    }

    function getEncryptedMetadata(
        uint256 tokenId
    ) external view returns (EncryptedMetadata memory) {
        return _encryptedData[tokenId];
    }

    function getAgentDomain(
        uint256 tokenId
    ) external view returns (string memory) {
        return agentDomain[tokenId];
    }

    // Override the _update function to implement custom logic during transfers
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Update encryption key ownership only for single transfers
        if (from != address(0) && to != address(0)) {
            _encryptedData[tokenId].encryptionKeyOwner = to;
        }

        return super._update(to, tokenId, auth);
    }
}
