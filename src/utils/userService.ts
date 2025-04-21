
import { hashFaceDescriptor } from './faceHashUtils';
import { initWeb3 } from './blockchainService';

declare global {
  interface Window {
    faceapi: any;
  }
}

const faceapi = (window as any).faceapi;

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
      try {
        const estimatedGas = await contract.registerUser.estimateGas(email, faceHash);
        console.log("Estimated gas for registration:", estimatedGas);
        
        // If gas estimation is successful, proceed with transaction
        const tx = await contract.registerUser(email, faceHash);
        await tx.wait(); // Wait for transaction to be mined
        
        registeredOnChain = true;
        console.log("Successfully registered on blockchain");
      } catch (gasError) {
        console.error("Gas estimation error, using local storage fallback:", gasError);
        // Continue with local storage
      }
    } catch (contractError) {
      console.error("Contract error, using local storage fallback:", contractError);
      // Continue with local storage
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
    return false;
  }
};

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

