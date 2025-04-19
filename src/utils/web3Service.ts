
import { ethers } from 'ethers';
import SHA256 from 'crypto-js/sha256';

// ABI for our smart contract - this would be generated after compiling the contract
// For development purposes, we're using a placeholder
const contractABI = [
  "function registerUser(string memory email, string memory faceHash) public",
  "function verifyUser(string memory faceHash) public view returns (bool)",
  "function getUserAddressByEmail(string memory email) public view returns (address)",
  "function userExists(string memory email) public view returns (bool)"
];

// Contract address - replace this with your deployed contract address
const contractAddress = "0x0000000000000000000000000000000000000000"; // Placeholder

// Convert face descriptor to a hash string
export const hashFaceDescriptor = (descriptor: Float32Array): string => {
  // Convert Float32Array to regular array, then to JSON string for consistent hashing
  const descriptorArray = Array.from(descriptor);
  const descriptorString = JSON.stringify(descriptorArray);
  
  // Generate SHA-256 hash
  return SHA256(descriptorString).toString();
};

// Initialize web3 provider and contract instance
export const initWeb3 = async () => {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask to use this application.");
    }
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    
    return { provider, signer, contract };
  } catch (error) {
    console.error("Error initializing Web3:", error);
    throw error;
  }
};

// Register a user on the blockchain
export const registerUserOnBlockchain = async (email: string, faceDescriptor: Float32Array) => {
  try {
    const { contract } = await initWeb3();
    const faceHash = hashFaceDescriptor(faceDescriptor);
    
    // Call the smart contract to register user
    const tx = await contract.registerUser(email, faceHash);
    await tx.wait(); // Wait for transaction to be mined
    
    return true;
  } catch (error) {
    console.error("Error registering user on blockchain:", error);
    throw error;
  }
};

// Verify a user on the blockchain
export const verifyUserOnBlockchain = async (email: string, faceDescriptor: Float32Array) => {
  try {
    const { contract } = await initWeb3();
    const faceHash = hashFaceDescriptor(faceDescriptor);
    
    // Call the smart contract to verify user
    const isVerified = await contract.verifyUser(faceHash);
    
    return isVerified;
  } catch (error) {
    console.error("Error verifying user on blockchain:", error);
    throw error;
  }
};

// Check if a user exists by email
export const checkUserExistsByEmail = async (email: string) => {
  try {
    const { contract } = await initWeb3();
    
    // Call the smart contract to check if user exists
    const exists = await contract.userExists(email);
    
    return exists;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    throw error;
  }
};

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
