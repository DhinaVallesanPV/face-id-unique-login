
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import FaceCapture from "@/components/FaceCapture";
import { registerUserOnBlockchain, checkUserExistsByEmail, checkFaceExists } from "@/utils/web3Service";

export const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleCaptureFace = async (descriptor: Float32Array) => {
    try {
      // Check if this face is already registered to prevent multiple accounts
      const faceAlreadyExists = await checkFaceExists(descriptor);
      
      if (faceAlreadyExists) {
        toast({
          variant: "destructive",
          title: "Face already registered",
          description: "This face is already registered with an account. Cannot create multiple accounts with the same face.",
        });
        return;
      }
      
      setFaceDescriptor(descriptor);
      setIsCapturing(false);
      
      toast({
        title: "Face captured successfully",
        description: "Your face has been recorded for registration.",
      });
    } catch (error) {
      console.error("Error during face capture:", error);
      toast({
        variant: "destructive",
        title: "Error capturing face",
        description: "There was an error checking your face. Please try again.",
      });
    }
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
      // Check for existing user with the same email
      const userExists = await checkUserExistsByEmail(email);
      
      if (userExists) {
        toast({
          variant: "destructive",
          title: "User already exists",
          description: "A user with this email is already registered. Please login instead.",
        });
        setLoading(false);
        return;
      }
      
      // Register the user (this now handles all the fallbacks internally)
      await registerUserOnBlockchain(email, faceDescriptor);
      
      // Save additional user information to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.email === email);
      
      if (userIndex >= 0) {
        // Update the existing user entry with name
        users[userIndex].name = name;
      } else {
        // This shouldn't happen but just in case
        users.push({
          id: Date.now().toString(),
          name,
          email,
          faceDescriptor: Object.assign({}, faceDescriptor)
        });
      }
      
      localStorage.setItem('users', JSON.stringify(users));
      
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now login.",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Check if the error is about multiple accounts
      if (error.message && error.message.includes("already registered")) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message || "Cannot create multiple accounts with the same face.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: "An error occurred during registration. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
              <span className="mr-2">Processing...</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            </div>
          ) : "Register"}
        </Button>
        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
