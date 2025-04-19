
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import FaceCapture from "@/components/FaceCapture";
import { registerUserOnBlockchain, checkUserExistsByEmail, hashFaceDescriptor } from "@/utils/web3Service";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectingBlockchain, setConnectingBlockchain] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleCaptureFace = (descriptor: Float32Array) => {
    setFaceDescriptor(descriptor);
    setIsCapturing(false);
    toast({
      title: "Face captured successfully",
      description: "Your face has been recorded for registration.",
    });
  };
  
  const handleRegister = async () => {
    if (!name || !email || !faceDescriptor) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide your name, email, and capture your face.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      setConnectingBlockchain(true);
      
      // Check if user with email already exists on blockchain
      const userExists = await checkUserExistsByEmail(email);
      
      if (userExists) {
        toast({
          variant: "destructive",
          title: "User already exists",
          description: "A user with this email is already registered. Please login instead.",
        });
        setLoading(false);
        setConnectingBlockchain(false);
        return;
      }
      
      // Check for existing user with same face in local storage (fallback)
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      const isFaceAlreadyRegistered = existingUsers.some((user: any) => {
        if (!user.faceDescriptor) return false;
        
        // Convert stored descriptor back to Float32Array
        const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
        
        // Calculate distance between faces (lower is more similar)
        const distance = faceapi.euclideanDistance(storedDescriptor, faceDescriptor);
        
        // Threshold for determining if faces are the same (adjust based on testing)
        return distance < 0.5;
      });
      
      if (isFaceAlreadyRegistered) {
        toast({
          variant: "destructive",
          title: "User already exists",
          description: "A user with this face is already registered. Please login instead.",
        });
        setLoading(false);
        setConnectingBlockchain(false);
        return;
      }
      
      try {
        // Register user on blockchain
        await registerUserOnBlockchain(email, faceDescriptor);
      } catch (error: any) {
        console.error("Blockchain registration error:", error);
        
        if (error.message && (
            error.message.includes("insufficient funds") || 
            error.message.includes("gas") ||
            error.message.includes("fee"))) {
          
          setUsingFallback(true);
          
          toast({
            variant: "warning",
            title: "Using local storage fallback",
            description: "Not enough test ETH for blockchain registration. Using local storage instead for demo purposes.",
          });
          
          // Store locally as fallback
          const faceHash = hashFaceDescriptor(faceDescriptor);
          const newUser = {
            id: Date.now().toString(),
            name,
            email,
            faceDescriptor: Object.assign({}, faceDescriptor),
            faceHash
          };
          
          existingUsers.push(newUser);
          localStorage.setItem('users', JSON.stringify(existingUsers));
        } else {
          throw error;
        }
      }
      
      toast({
        title: "Registration successful",
        description: usingFallback 
          ? "Your account has been created locally for demo purposes." 
          : "Your account has been created and verified on the blockchain.",
      });
      
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "An error occurred during registration. Please try again.",
      });
    } finally {
      setLoading(false);
      setConnectingBlockchain(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Register with your face ID on blockchain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Face ID</Label>
            {isCapturing ? (
              <FaceCapture onCapture={handleCaptureFace} onCancel={() => setIsCapturing(false)} />
            ) : (
              <div className="flex flex-col items-center justify-center border rounded-md p-4 space-y-2">
                {faceDescriptor ? (
                  <>
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-center">Face captured successfully</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsCapturing(true)}
                    >
                      Retake
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCapturing(true)}
                    className="w-full"
                  >
                    Capture Face
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700" 
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <span className="mr-2">
                  {connectingBlockchain ? "Connecting to blockchain..." : "Processing..."}
                </span>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            ) : "Register on Blockchain"}
          </Button>
          <p className="text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
