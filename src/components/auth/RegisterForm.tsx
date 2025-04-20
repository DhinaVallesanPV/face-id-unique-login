
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUserOnBlockchain, checkUserExistsByEmail } from "@/utils/web3Service";
import { RegisterFormFields } from "./RegisterFormFields";
import { FaceRegistration } from "./FaceRegistration";

export const RegisterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
      
      await registerUserOnBlockchain(email, faceDescriptor);
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.email === email);
      
      if (userIndex >= 0) {
        users[userIndex].name = name;
      } else {
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
        <RegisterFormFields
          name={name}
          email={email}
          onNameChange={setName}
          onEmailChange={setEmail}
        />
        <FaceRegistration
          onFaceCapture={setFaceDescriptor}
          faceDescriptor={faceDescriptor}
        />
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
