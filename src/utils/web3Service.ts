
import { ethers } from 'ethers';
import SHA256 from 'crypto-js/sha256';

// ABI for our smart contract
const contractABI = [
  "function registerUser(string memory email, string memory faceHash) public",
  "function verifyUser(string memory faceHash) public view returns (bool)",
  "function getUserAddressByEmail(string memory email) public view returns (address)",
  "function userExists(string memory email) public view returns (bool)"
];

// Contract address for local Hardhat node
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default first address on Hardhat

// Hardhat configuration with private key
const HARDHAT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default Hardhat private key (DO NOT USE IN PRODUCTION)

// Local Hardhat node URL
const LOCAL_RPC_URL = "http://127.0.0.1:8545"; // Standard Hardhat node URL

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
    // First attempt local Hardhat node
    let provider;
    try {
      provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
      // Test connection with a simple call
      await provider.getBlockNumber();
      console.log("Connected to local Hardhat node");
    } catch (localError) {
      console.error("Failed to connect to local Hardhat node:", localError);
      
      // Fall back to in-memory provider if local node is unavailable
      provider = new ethers.JsonRpcProvider(); // In-memory provider
      console.log("Using in-memory provider as fallback");
    }
    
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
    
    let registeredOnChain = false;
    const faceHash = hashFaceDescriptor(faceDescriptor);
    
    // Try to call the smart contract to register user
    try {
      const { contract } = await initWeb3();
      
      // First, estimate the gas to check if the transaction might fail
      const estimatedGas = await contract.registerUser.estimateGas(email, faceHash);
      console.log("Estimated gas for registration:", estimatedGas);
      
      // If gas estimation is successful, proceed with transaction
      const tx = await contract.registerUser(email, faceHash);
      await tx.wait(); // Wait for transaction to be mined
      
      registeredOnChain = true;
      console.log("Successfully registered on blockchain");
    } catch (contractError: any) {
      console.error("Contract error, using local storage fallback:", contractError);
      registeredOnChain = false;
    }
    
    // Store in localStorage (always do this, whether blockchain worked or not)
    const newUser = {
      id: Date.now().toString(),
      email,
      faceDescriptor: Object.assign({}, faceDescriptor),
      faceHash,
      registeredOnChain
    };
    
    // Check if email already exists to prevent duplicate accounts
    const emailExists = users.some((user: any) => user.email === email);
    if (emailExists) {
      throw new Error("This email is already registered. Please use a different email address.");
    }
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return true;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

// Verify a user on the blockchain
export const verifyUserOnBlockchain = async (email: string, faceDescriptor: Float32Array) => {
  try {
    const faceHash = hashFaceDescriptor(faceDescriptor);
    
    // Try blockchain verification first
    try {
      const { contract } = await initWeb3();
      const isVerified = await contract.verifyUser(faceHash);
      if (isVerified) {
        console.log("User verified on blockchain");
        return true;
      }
    } catch (contractError) {
      console.error("Contract verification error, using fallback:", contractError);
    }
    
    console.log("Falling back to local storage verification");
    // Fallback to local storage verification
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    for (const user of users) {
      if (!user.faceDescriptor) continue;
      
      const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
      const distance = faceapi.euclideanDistance(storedDescriptor, faceDescriptor);
      
      if (distance < 0.5) {
        console.log("User verified in local storage");
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error verifying user:", error);
    // Fallback to local verification
    return false;
  }
};

// Check if a user exists by email
export const checkUserExistsByEmail = async (email: string) => {
  try {
    // Try blockchain check first
    try {
      const { contract } = await initWeb3();
      const exists = await contract.userExists(email);
      if (exists) {
        return true;
      }
    } catch (error) {
      console.log("Contract method error, using fallback:", error);
    }
    
    // Check local storage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.some((user: any) => user.email === email);
  } catch (error) {
    console.error("Error checking if user exists:", error);
    // Final fallback
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.some((user: any) => user.email === email);
  }
};

// Check if a face already exists
export const checkFaceExists = async (faceDescriptor: Float32Array) => {
  try {
    // Check local storage (faster than blockchain check)
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
