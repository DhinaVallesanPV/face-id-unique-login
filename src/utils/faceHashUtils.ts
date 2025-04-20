
import SHA256 from 'crypto-js/sha256';

// Convert face descriptor to a hash string
export const hashFaceDescriptor = (descriptor: Float32Array): string => {
  // Convert Float32Array to regular array, then to JSON string for consistent hashing
  const descriptorArray = Array.from(descriptor);
  const descriptorString = JSON.stringify(descriptorArray);
  
  // Generate SHA-256 hash
  return SHA256(descriptorString).toString();
};

