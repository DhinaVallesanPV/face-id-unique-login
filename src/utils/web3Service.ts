
import { ethers } from 'ethers';
import SHA256 from 'crypto-js/sha256';

// ABI for our smart contract
const contractABI = [
  "function registerUser(string memory email, string memory faceHash) public",
  "function verifyUser(string memory faceHash) public view returns (bool)",
  "function getUserAddressByEmail(string memory email) public view returns (address)",
  "function userExists(string memory email) public view returns (bool)"
];

// Contract address for Sepolia testnet - replace with your deployed contract
const contractAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"; // This is a placeholder - deploy your own contract

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
    
    // Request switch to Sepolia testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Chain ID for Sepolia in hex
      });
    } catch (switchError: any) {
      // If Sepolia isn't added to MetaMask, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            },
          ],
        });
      }
    }
    
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
    
    // Try to call the smart contract to register user
    try {
      // First, estimate the gas to check if the transaction might fail
      const estimatedGas = await contract.registerUser.estimateGas(email, faceHash);
      console.log("Estimated gas for registration:", estimatedGas);
      
      // If gas estimation is successful, proceed with transaction
      const tx = await contract.registerUser(email, faceHash);
      await tx.wait(); // Wait for transaction to be mined
      return true;
    } catch (contractError: any) {
      console.error("Contract error:", contractError);
      
      // Check if the error is related to gas fees
      if (contractError.message && (
          contractError.message.includes("insufficient funds") || 
          contractError.message.includes("gas") ||
          contractError.message.includes("fee"))) {
        
        // Fall back to localStorage for development/demo
        console.log("Using local storage fallback due to gas fee issue");
        
        // Store in localStorage as fallback
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const newUser = {
          id: Date.now().toString(),
          email,
          faceDescriptor: Object.assign({}, faceDescriptor),
          faceHash
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        return true;
      }
      
      throw contractError;
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
    // Fallback to local verification for demo purposes
    return false;
  }
};

// Check if a user exists by email
export const checkUserExistsByEmail = async (email: string) => {
  try {
    const { contract } = await initWeb3();
    
    // Instead of trying to call userExists directly, try/catch with a fallback
    try {
      // Call the smart contract to check if user exists
      const exists = await contract.userExists(email);
      return exists;
    } catch (error) {
      console.log("Contract method error, using fallback for demo:", error);
      
      // Fallback for demo/testing: Check local storage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      return users.some((user: any) => user.email === email);
    }
  } catch (error) {
    console.error("Error checking if user exists:", error);
    // Return false to allow registration to continue for testing purposes
    return false;
  }
};

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}
