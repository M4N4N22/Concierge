// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @notice Minimal Vault interface for off-chain verification / tooling
interface IVault {
    struct FileData {
        bytes32 fileHash;
        uint256 timestamp;
        string category;
        string encryptedKey;
        bytes32 insightsCID;
    }

    function viewFilesByUser(
        address user
    ) external view returns (FileData[] memory);
}

/**
 * @title INFTAgent
 * @dev INFT representing a user's personal AI agent bound to their Vault.
 *      Upgradeable pattern compatible.
 */
contract INFTAgent is Initializable, ERC721Upgradeable, OwnableUpgradeable {
    uint256 private _tokenIdCounter;

    /// @notice vault address associated with tokenId
    mapping(uint256 => address) public vaults;

    /// @notice one-to-one mapping from owner address to tokenId (0 == none)
    mapping(address => uint256) public agentByOwner;

    /// @notice Encrypted metadata containing a hash and who owns the encryption key (off-chain key owner)
    struct EncryptedMetadata {
        bytes32 encryptedHash; // e.g., keccak256 of model/embedding or encrypted blob
        address encryptionKeyOwner;
    }
    mapping(uint256 => EncryptedMetadata) private _encryptedData;

    /// @notice Agent domain / namespace (e.g., "finance.ai")
    mapping(uint256 => string) public agentDomain;

    /// @notice Optional profile containing embeddings URI and AI signature/version
    struct AgentProfile {
        string embeddingURI; // 0G Storage CID or URL pointing to embeddings or model summary
        string aiSignature; // model id / fingerprint (e.g., "model_v1.2")
    }
    mapping(uint256 => AgentProfile) public profiles;

    // --- Events ---
    event AgentMinted(
        address indexed user,
        uint256 indexed tokenId,
        address indexed vault,
        string domain,
        bytes32 encryptedHash,
        string embeddingURI,
        string aiSignature
    );

    event MetadataUpdated(uint256 indexed tokenId, bytes32 newEncryptedHash);
    event ProfileUpdated(
        uint256 indexed tokenId,
        string embeddingURI,
        string aiSignature
    );
    event AgentBurned(address indexed user, uint256 indexed tokenId);

    /// @notice Initialize for proxy deployment
    function initialize(address owner_) external initializer {
        __ERC721_init("INFT Agent", "AGENT");
        __Ownable_init(owner_);
        _tokenIdCounter = 0; // start counter at 0; first token will be 1
    }

    // --------------------
    // Minting / Metadata
    // --------------------

    /**
     * @notice Mint a new INFT agent for the caller.
     * @dev Each owner can only mint one agent (agentByOwner enforces 1:1).
     * @param vault Address of the user's Vault contract (can be shared or per-user)
     * @param encryptedHash keccak256 or encrypted blob hash that fingerprints the trained model/embeddings
     * @param domain Agent domain / namespace
     * @param embeddingURI 0G Storage CID or URI pointing to the embedding/model summary (optional)
     * @param aiSignature Model fingerprint / version string (optional)
     * @return newId The minted tokenId
     */
    function mintAgent(
        address vault,
        bytes32 encryptedHash,
        string memory domain,
        string memory embeddingURI,
        string memory aiSignature
    ) external returns (uint256) {
        require(
            agentByOwner[msg.sender] == 0,
            "Agent already exists for owner"
        );

        _tokenIdCounter += 1;
        uint256 newId = _tokenIdCounter;

        // Mint the ERC721 token to the caller
        _mint(msg.sender, newId);

        // link vault and metadata
        vaults[newId] = vault;
        _encryptedData[newId] = EncryptedMetadata({
            encryptedHash: encryptedHash,
            encryptionKeyOwner: msg.sender
        });
        agentDomain[newId] = domain;
        profiles[newId] = AgentProfile({
            embeddingURI: embeddingURI,
            aiSignature: aiSignature
        });

        // map owner -> agent
        agentByOwner[msg.sender] = newId;

        emit AgentMinted(
            msg.sender,
            newId,
            vault,
            domain,
            encryptedHash,
            embeddingURI,
            aiSignature
        );
        return newId;
    }

    /**
     * @notice Update the encrypted metadata fingerprint for a token.
     * @dev Only token owner can update; used when the agent is retrained and fingerprint changes.
     */
    function updateMetadata(
        uint256 tokenId,
        bytes32 newEncryptedHash
    ) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _encryptedData[tokenId].encryptedHash = newEncryptedHash;
        emit MetadataUpdated(tokenId, newEncryptedHash);
    }

    /**
     * @notice Update the AgentProfile (embedding URI and signature).
     * @dev Only token owner can update.
     */
    function updateProfile(
        uint256 tokenId,
        string memory embeddingURI,
        string memory aiSignature
    ) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        profiles[tokenId] = AgentProfile({
            embeddingURI: embeddingURI,
            aiSignature: aiSignature
        });
        emit ProfileUpdated(tokenId, embeddingURI, aiSignature);
    }

    // --------------------
    // Getters
    // --------------------

    function getEncryptedMetadata(
        uint256 tokenId
    ) external view returns (EncryptedMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _encryptedData[tokenId];
    }

    function getAgentDomain(
        uint256 tokenId
    ) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return agentDomain[tokenId];
    }

    function getAgentProfile(
        uint256 tokenId
    ) external view returns (AgentProfile memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return profiles[tokenId];
    }

    function getVault(uint256 tokenId) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return vaults[tokenId];
    }

    // --------------------
    // Transfers / Burn
    // --------------------

    /**
     * @dev Override hook to update encryptionKeyOwner after transfers.
     * When token changes owner, rotate the encryptionKeyOwner to the new owner.
     */
    function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
) internal virtual {
    // Update encryption key owner when transferred between users
    if (from != address(0) && to != address(0)) {
        _encryptedData[tokenId].encryptionKeyOwner = to;
    }

    // If token is burned
    if (to == address(0) && from != address(0)) {
        if (agentByOwner[from] == tokenId) {
            agentByOwner[from] = 0;
        }
        emit AgentBurned(from, tokenId);
    }
}

    /**
     * @notice Burn an agent token. Only token owner can burn.
     */
    function burnAgent(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        address owner_ = ownerOf(tokenId);
        require(owner_ == msg.sender, "Not token owner");

        // Clear mappings
        if (agentByOwner[owner_] == tokenId) {
            agentByOwner[owner_] = 0;
        }

        delete vaults[tokenId];
        delete _encryptedData[tokenId];
        delete profiles[tokenId];
        delete agentDomain[tokenId];

        _burn(tokenId);
        emit AgentBurned(owner_, tokenId);
    }

    // --------------------
    // Admin helpers
    // --------------------

    /**
     * @notice Admin can set token counter (useful for upgrades/testing) - only owner.
     * @dev Careful with this; reserved for migration/upgrade flows.
     */
    function adminSetTokenCounter(uint256 newCounter) external onlyOwner {
        require(
            newCounter >= _tokenIdCounter,
            "New counter must be >= current"
        );
        _tokenIdCounter = newCounter;
    }

    /**
     * @notice Get the current token counter (last minted id)
     */
    function tokenCounter() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
