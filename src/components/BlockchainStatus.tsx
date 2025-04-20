
import { useEffect, useState } from "react";
import { initWeb3 } from "@/utils/web3Service";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BlockchainStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      setLoading(true);
      
      const { provider, wallet } = await initWeb3();
      
      // Get wallet address
      const address = await wallet.getAddress();
      setWalletAddress(address);
      
      // Get network information
      try {
        const network = await provider.getNetwork();
        setNetworkName(network.name);
        setIsConnected(true);
        setIsUsingFallback(false);
        
        toast({
          title: "Blockchain connected",
          description: `Connected to ${network.name} network with Hardhat configuration`,
        });
      } catch (networkError) {
        console.error("Error getting network:", networkError);
        // We got the wallet but couldn't get network info
        setNetworkName("Unknown");
        setIsConnected(true);
        setIsUsingFallback(true);
        
        toast({
          variant: "warning",
          title: "Partial connection",
          description: "Connected to wallet but network information unavailable. Using hybrid mode.",
        });
      }
    } catch (error) {
      console.error("Error connecting to blockchain:", error);
      setIsConnected(false);
      setIsUsingFallback(true);
      
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
        <div className={`h-3 w-3 rounded-full ${isConnected ? (isUsingFallback ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">
          {isConnected 
            ? (isUsingFallback ? 'Hybrid Mode (Wallet + Local Storage)' : `Connected: ${networkName}`) 
            : 'Using Local Storage (Fallback)'}
        </span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                {isConnected 
                  ? (isUsingFallback 
                    ? "Using wallet for signing but local storage for data persistence due to network issues." 
                    : "Fully connected to the blockchain network.")
                  : "All data is stored in your browser's local storage. To use blockchain features, click 'Try Connecting'."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
      
      {isUsingFallback && (
        <p className="mt-2 text-xs text-gray-500">
          Your data is safely stored locally even without blockchain connectivity.
        </p>
      )}
    </div>
  );
};

export default BlockchainStatus;
