
import { ethers } from 'ethers';
import SHA256 from 'crypto-js/sha256';

// ABI for our smart contract
const contractABI = [
  "function registerUser(string memory email, string memory faceHash) public",
  "function verifyUser(string memory faceHash) public view returns (bool)",
  "function getUserAddressByEmail(string memory email) public view returns (address)",
  "function userExists(string memory email) public view returns (bool)"
];

// Contract address for Sepolia testnet
const contractAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

// Hardhat configuration with private key
const HARDHAT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat private key (DO NOT USE IN PRODUCTION)
const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"; // Example Infura URL

// Convert face descriptor to a hash string
export const hashFaceDescriptor = (descriptor: Float32Array): string => {
  // Convert Float32Array to regular array, then to JSON string for consistent hashing
  const descriptorArray = Array.from(descriptor);
  const descriptorString = JSON.stringify(descriptorArray);
  
  // Generate SHA-256 hash
  return SHA256(descriptorString).toString();
};

// Initialize provider and contract instance using Hardhat configuration
export const initWeb3 = async () => {
  try {
    // Create provider using Sepolia RPC URL
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    
    // Create wallet using private key
    const wallet = new ethers.Wallet(HARDHAT_PRIVATE_KEY, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    return { provider, wallet, contract };
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
    
    // Check if this face already exists in local storage (prevent multiple accounts)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const faceExists = users.some((user: any) => {
      if (!user.faceDescriptor) return false;
      const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
      const distance = faceapi.euclideanDistance(storedDescriptor, faceDescriptor);
      return distance < 0.5;
    });
    
    if (faceExists) {
      throw new Error("This face is already registered. Cannot create multiple accounts with the same face.");
    }
    
    // Try to call the smart contract to register user
    try {
      // First, estimate the gas to check if the transaction might fail
      const estimatedGas = await contract.registerUser.estimateGas(email, faceHash);
      console.log("Estimated gas for registration:", estimatedGas);
      
      // If gas estimation is successful, proceed with transaction
      const tx = await contract.registerUser(email, faceHash);
      await tx.wait(); // Wait for transaction to be mined
      
      // Also store in localStorage for redundancy
      const newUser = {
        id: Date.now().toString(),
        email,
        faceDescriptor: Object.assign({}, faceDescriptor),
        faceHash,
        registeredOnChain: true
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return true;
    } catch (contractError: any) {
      console.error("Contract error:", contractError);
      
      // Always fall back to localStorage regardless of the error
      console.log("Using local storage fallback");
      
      // Store in localStorage as fallback
      const newUser = {
        id: Date.now().toString(),
        email,
        faceDescriptor: Object.assign({}, faceDescriptor),
        faceHash,
        registeredOnChain: false
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      return true;
    }
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
    try {
      const isVerified = await contract.verifyUser(faceHash);
      return isVerified;
    } catch (contractError) {
      console.error("Contract verification error, using fallback:", contractError);
      
      // Fallback for demo: Check local storage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      for (const user of users) {
        if (!user.faceDescriptor) continue;
        
        const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
        const storedHash = hashFaceDescriptor(storedDescriptor);
        const currentHash = hashFaceDescriptor(faceDescriptor);
        
        if (storedHash === currentHash) {
          return true;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error("Error verifying user on blockchain:", error);
    // Fallback to local verification
    return false;
  }
};

// Check if a user exists by email
export const checkUserExistsByEmail = async (email: string) => {
  try {
    const { contract } = await initWeb3();
    
    // Try to call the contract method first
    try {
      const exists = await contract.userExists(email);
      return exists;
    } catch (error) {
      console.log("Contract method error, using fallback:", error);
      
      // Check local storage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      return users.some((user: any) => user.email === email);
    }
  } catch (error) {
    console.error("Error checking if user exists:", error);
    // Check local storage as final fallback
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.some((user: any) => user.email === email);
  }
};

// Check if a face already exists
export const checkFaceExists = async (faceDescriptor: Float32Array) => {
  try {
    // Check local storage first (faster than blockchain check)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    for (const user of users) {
      if (!user.faceDescriptor) continue;
      
      const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
      const distance = faceapi.euclideanDistance(storedDescriptor, faceDescriptor);
      
      if (distance < 0.5) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking if face exists:", error);
    return false;
  }
};

// Type declarations
declare global {
  interface Window {
    ethereum: any;
    faceapi: any;
  }
}

const faceapi = (window as any).faceapi;
