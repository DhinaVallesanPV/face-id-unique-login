
import { useState } from "react";
import { Button } from "@/components/ui/button";
import FaceCapture from "@/components/FaceCapture";
import { checkFaceExists } from "@/utils/web3Service";
import { useToast } from "@/hooks/use-toast";

interface FaceRegistrationProps {
  onFaceCapture: (descriptor: Float32Array) => void;
  faceDescriptor: Float32Array | null;
}

export const FaceRegistration = ({ onFaceCapture, faceDescriptor }: FaceRegistrationProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const handleCaptureFace = async (descriptor: Float32Array) => {
    try {
      const faceAlreadyExists = await checkFaceExists(descriptor);
      
      if (faceAlreadyExists) {
        toast({
          variant: "destructive",
          title: "Face already registered",
          description: "This face is already registered with an account. Cannot create multiple accounts with the same face.",
        });
        return;
      }
      
      onFaceCapture(descriptor);
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

  return (
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
  );
};
