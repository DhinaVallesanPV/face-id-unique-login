
import { useEffect, useState } from "react";
import { initWeb3 } from "@/utils/web3Service";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink } from "lucide-react";

const BlockchainStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      setLoading(true);
      
      const { provider, wallet } = await initWeb3();
      
      // Get wallet address
      const address = await wallet.getAddress();
      setWalletAddress(address);
      
      // Get network information
      const network = await provider.getNetwork();
      setNetworkName(network.name);
      
      setIsConnected(true);
      
      toast({
        title: "Blockchain connected",
        description: `Connected to ${network.name} network with Hardhat configuration`,
      });
    } catch (error) {
      console.error("Error connecting to blockchain:", error);
      setIsConnected(false);
      
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect to blockchain. Using local storage fallback.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFaucetEth = () => {
    window.open("https://sepoliafaucet.com/", "_blank");
  };

  useEffect(() => {
    // Initial connection check
    checkConnection();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg z-50">
      <div className="flex items-center space-x-2">
        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">
          {isConnected ? `Connected: ${networkName}` : 'Using Local Storage (Fallback)'}
        </span>
      </div>
      
      {isConnected && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 truncate max-w-[200px]">
            {walletAddress}
          </p>
          <Button 
            size="sm" 
            variant="outline"
            className="mt-2 text-xs w-full flex items-center justify-center gap-1"
            onClick={getFaucetEth}
          >
            Get Test ETH <ExternalLink size={12} />
          </Button>
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
          ) : 'Try Connecting'}
        </Button>
      )}
    </div>
  );
};

export default BlockchainStatus;
