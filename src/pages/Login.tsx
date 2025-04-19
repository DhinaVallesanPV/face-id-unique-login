
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import FaceCapture from "@/components/FaceCapture";

const Login = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleCaptureFace = async (descriptor: Float32Array) => {
    setIsCapturing(false);
    setLoading(true);
    
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Find user with matching face
      let matchedUser = null;
      let lowestDistance = 1.0; // Start with a high threshold
      
      for (const user of users) {
        if (!user.faceDescriptor) continue;
        
        // Convert stored descriptor back to Float32Array
        const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
        
        // Calculate distance between faces
        const distance = faceapi.euclideanDistance(storedDescriptor, descriptor);
        
        // If this is the closest match so far and under threshold
        if (distance < lowestDistance && distance < 0.5) {
          lowestDistance = distance;
          matchedUser = user;
        }
      }
      
      if (matchedUser) {
        // Login successful
        setLoggedInUser(matchedUser);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${matchedUser.name}!`,
        });
        
        // Store logged in user info in localStorage or session
        localStorage.setItem('currentUser', JSON.stringify(matchedUser));
        
        // Navigate to dashboard or home
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        // No matching face found
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Face not recognized. Please try again or register a new account.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login error",
        description: "An error occurred during login. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Login with your face ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loggedInUser ? (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-medium">Welcome back, {loggedInUser.name}!</h3>
              <p className="text-sm text-center text-gray-500">You've been successfully logged in.</p>
            </div>
          ) : isCapturing ? (
            <FaceCapture onCapture={handleCaptureFace} onCancel={() => setIsCapturing(false)} />
          ) : (
            <div className="flex flex-col items-center justify-center border rounded-md p-6 space-y-4">
              <div className="rounded-full bg-indigo-100 p-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Position your face in front of the camera to login
                </p>
                <Button 
                  onClick={() => setIsCapturing(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Start Face Recognition"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
