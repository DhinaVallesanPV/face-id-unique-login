
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FaceCaptureProps {
  onCapture: (descriptor: Float32Array) => void;
  onCancel: () => void;
}

const FaceCapture = ({ onCapture, onCancel }: FaceCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedFace, setDetectedFace] = useState<boolean>(false);
  
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Import the model loader utility
        const { ensureFaceModelsLoaded } = await import('@/utils/faceModels');
        
        // Load necessary face-api models
        await ensureFaceModelsLoaded();
        
        setIsModelLoading(false);
        startVideo();
      } catch (err) {
        console.error("Error loading models:", err);
        setError("Failed to load facial recognition models. Please try again later.");
        setIsModelLoading(false);
      }
    };
    
    loadModels();
    
    return () => {
      // Cleanup function to stop the video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  const startVideo = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied. Please allow camera access to use face recognition.");
    }
  };
  
  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    };
    
    faceapi.matchDimensions(canvasRef.current, displaySize);
    
    // Start face detection
    const intervalId = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      try {
        const detections = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptor();
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          
          if (detections) {
            setDetectedFace(true);
            
            // Draw detections
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            
            // Add border and "Face Detected" message
            context.strokeStyle = 'green';
            context.lineWidth = 4;
            context.strokeRect(
              resizedDetections.detection.box.x,
              resizedDetections.detection.box.y,
              resizedDetections.detection.box.width,
              resizedDetections.detection.box.height
            );
            
            context.fillStyle = 'rgba(0, 128, 0, 0.7)';
            context.fillRect(
              resizedDetections.detection.box.x,
              resizedDetections.detection.box.y - 25,
              120,
              25
            );
            
            context.fillStyle = 'white';
            context.font = '16px Arial';
            context.fillText(
              'Face Detected',
              resizedDetections.detection.box.x + 5,
              resizedDetections.detection.box.y - 5
            );
          } else {
            setDetectedFace(false);
          }
        }
      } catch (err) {
        console.error("Error during face detection:", err);
        // Don't set error here to avoid constant error messages
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  };
  
  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    try {
      const detections = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();
      
      if (detections) {
        onCapture(detections.descriptor);
      } else {
        setError("No face detected. Please position your face correctly and try again.");
      }
    } catch (err) {
      console.error("Error capturing face:", err);
      setError("Failed to capture face. Please try again.");
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative w-full max-w-md">
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
            <div className="flex flex-col items-center space-y-2 text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
              <p>Loading facial recognition...</p>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="rounded-md w-full"
          autoPlay
          muted
          onPlay={handleVideoPlay}
        ></video>
        
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full"
        ></canvas>
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleCapture} 
          disabled={isModelLoading || !detectedFace}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Capture Face
        </Button>
      </div>
      
      {!detectedFace && !isModelLoading && (
        <p className="text-sm text-amber-600">
          No face detected. Please position your face in front of the camera.
        </p>
      )}
    </div>
  );
};

export default FaceCapture;
