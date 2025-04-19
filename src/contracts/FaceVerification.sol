
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract FaceVerification {
    // Maps user addresses to their facial hash
    mapping(address => string) private userFaceHashes;
    
    // Maps email to address for lookup
    mapping(string => address) private emailToAddress;
    
    // Events
    event UserRegistered(address indexed userAddress, string email);
    event UserVerified(address indexed userAddress, bool success);
    
    // Register a new user with their face hash
    function registerUser(string calldata email, string calldata faceHash) public {
        require(bytes(userFaceHashes[msg.sender]).length == 0, "User already registered");
        require(emailToAddress[email] == address(0), "Email already registered");
        
        userFaceHashes[msg.sender] = faceHash;
        emailToAddress[email] = msg.sender;
        
        emit UserRegistered(msg.sender, email);
    }
    
    // Verify a user's face hash
    function verifyUser(string calldata faceHash) public view returns (bool) {
        string memory storedHash = userFaceHashes[msg.sender];
        
        // Compare hashes using keccak256
        return keccak256(abi.encodePacked(storedHash)) == 
               keccak256(abi.encodePacked(faceHash));
    }
    
    // Get user address by email (for login process)
    function getUserAddressByEmail(string calldata email) public view returns (address) {
        return emailToAddress[email];
    }
    
    // Check if a user exists
    function userExists(string calldata email) public view returns (bool) {
        return emailToAddress[email] != address(0);
    }
}
