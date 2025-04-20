
import { ethers } from 'ethers';
import { contractABI, contractAddress, HARDHAT_PRIVATE_KEY, LOCAL_RPC_URL } from './contractConfig';

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
      provider = new ethers.JsonRpcProvider();
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

