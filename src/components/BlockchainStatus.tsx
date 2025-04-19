
import { useEffect, useState } from "react";
import { initWeb3 } from "@/utils/web3Service";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const BlockchainStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        toast({
          variant: "destructive",
          title: "MetaMask not found",
          description: "Please install MetaMask to use blockchain features.",
        });
        return;
      }

      const { provider, signer } = await initWeb3();
      const address = await signer.getAddress();
      setWalletAddress(address);
      
      const network = await provider.getNetwork();
      setNetworkName(network.name);
      
      setIsConnected(true);
      
      toast({
        title: "Blockchain connected",
        description: `Connected to ${network.name} network`,
      });
    } catch (error) {
      console.error("Error connecting to blockchain:", error);
      setIsConnected(false);
      
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect to blockchain. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing connection
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        checkConnection();
      });
      
      window.ethereum.on('chainChanged', () => {
        checkConnection();
      });
      
      // Initial connection check
      checkConnection();
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg z-50">
      <div className="flex items-center space-x-2">
        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">
          {isConnected ? `Connected: ${networkName}` : 'Blockchain Not Connected'}
        </span>
      </div>
      
      {isConnected && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 truncate max-w-[200px]">
            {walletAddress}
          </p>
        </div>
      )}
      
      {!isConnected && (
        <Button 
          size="sm" 
          className="mt-2 w-full"
          onClick={checkConnection}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
              <span>Connecting...</span>
            </div>
          ) : 'Connect Wallet'}
        </Button>
      )}
    </div>
  );
};

export default BlockchainStatus;
