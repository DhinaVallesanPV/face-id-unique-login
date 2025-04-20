
// Contract ABI
export const contractABI = [
  "function registerUser(string memory email, string memory faceHash) public",
  "function verifyUser(string memory faceHash) public view returns (bool)",
  "function getUserAddressByEmail(string memory email) public view returns (address)",
  "function userExists(string memory email) public view returns (bool)"
];

// Contract address for local Hardhat node
export const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Hardhat configuration with private key
export const HARDHAT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Local Hardhat node URL
export const LOCAL_RPC_URL = "http://127.0.0.1:8545";

