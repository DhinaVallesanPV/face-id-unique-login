
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
    function registerUser(string memory email, string memory faceHash) public {
        require(bytes(userFaceHashes[msg.sender]).length == 0, "User already registered");
        require(emailToAddress[email] == address(0), "Email already registered");
        
        userFaceHashes[msg.sender] = faceHash;
        emailToAddress[email] = msg.sender;
        
        emit UserRegistered(msg.sender, email);
    }
    
    // Verify a user's face hash
    function verifyUser(string memory faceHash) public view returns (bool) {
        return keccak256(abi.encodePacked(userFaceHashes[msg.sender])) == 
               keccak256(abi.encodePacked(faceHash));
    }
    
    // Get user address by email (for login process)
    function getUserAddressByEmail(string memory email) public view returns (address) {
        return emailToAddress[email];
    }
    
    // Check if a user exists
    function userExists(string memory email) public view returns (bool) {
        return emailToAddress[email] != address(0);
    }
}
