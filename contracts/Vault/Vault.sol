// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Vault is Initializable, OwnableUpgradeable {
    /// @notice File metadata stored on-chain
    struct FileData {
        bytes32 fileHash; // 0G Storage hash of the uploaded file
        uint256 timestamp; // upload time
        string category; // short AI-assigned category (on-chain)
        string encryptedKey; // optional per-user key for decryption
        bytes32 insightsCID; // points to AI insights stored off-chain in 0G Storage
    }

    /// @notice Mapping of user address → array of FileData
    mapping(address => FileData[]) private userFiles;

    // --- Events ---
    event FileAdded(
        address indexed user,
        bytes32 fileHash,
        string category,
        bytes32 insightsCID,
        uint256 timestamp
    );
    event FileRemoved(address indexed user, bytes32 fileHash);
    event FileInsightsUpdated(
        address indexed user,
        bytes32 fileHash,
        string category,
        bytes32 insightsCID
    );

    /// @notice Initialize for proxy deployment
    function initialize(address owner_) external initializer {
        __Ownable_init(owner_); // pass owner here
    }

    // --- File management ---

    /// @notice Add a new file metadata entry
    function addFile(
        bytes32 fileHash,
        string memory category,
        string memory encryptedKey,
        bytes32 insightsCID
    ) external {
        userFiles[msg.sender].push(
            FileData({
                fileHash: fileHash,
                timestamp: block.timestamp,
                category: category,
                encryptedKey: encryptedKey,
                insightsCID: insightsCID
            })
        );
        emit FileAdded(
            msg.sender,
            fileHash,
            category,
            insightsCID,
            block.timestamp
        );
    }

    /// @notice Remove a file metadata entry
    function removeFile(bytes32 fileHash) external {
        FileData[] storage files = userFiles[msg.sender];
        for (uint i = 0; i < files.length; i++) {
            if (files[i].fileHash == fileHash) {
                files[i] = files[files.length - 1];
                files.pop();
                emit FileRemoved(msg.sender, fileHash);
                return;
            }
        }
        revert("File not found");
    }

    /// @notice Update AI-generated insights for an existing file
    function updateInsights(
        bytes32 fileHash,
        string memory category,
        bytes32 insightsCID
    ) external {
        FileData[] storage files = userFiles[msg.sender];
        for (uint i = 0; i < files.length; i++) {
            if (files[i].fileHash == fileHash) {
                files[i].category = category;
                files[i].insightsCID = insightsCID;
                emit FileInsightsUpdated(
                    msg.sender,
                    fileHash,
                    category,
                    insightsCID
                );
                return;
            }
        }
        revert("File not found");
    }

    /// @notice Get all files for a user (only callable by owner for privacy)
    function getFiles(address user) external view returns (FileData[] memory) {
        require(msg.sender == user, "Unauthorized");
        return userFiles[user];
    }

    /// @notice Get files by user without requiring msg.sender match
    function viewFilesByUser(
        address user
    ) external view returns (FileData[] memory) {
        return userFiles[user];
    }
}
