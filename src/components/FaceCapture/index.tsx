
import React, { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingOverlay from "./LoadingOverlay";
import FaceFrame from "./FaceFrame";
import { useFaceDetection } from "./useFaceDetection";

interface FaceCaptureProps {
  onCapture: (descriptor: Float32Array) => void;
  onCancel: () => void;
}

const FaceCapture = ({ onCapture, onCancel }: FaceCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastDetections, setLastDetections] = useState<any | null>(null);

  const {
    isModelLoading,
    error,
    setError,
    detectedFace,
    startDetection,
  } = useFaceDetection(videoRef);

  const handleVideoPlay = useCallback(() => {
    startDetection(canvasRef, (detections, displaySize) => {
      setLastDetections({ detections, displaySize });
    });
  }, [startDetection]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    try {
      const detections = await (await import("face-api.js")).detectSingleFace(
        videoRef.current,
        new (await import("face-api.js")).TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        onCapture(detections.descriptor);
      } else {
        setError("No face detected. Please position your face correctly and try again.");
      }
    } catch (err) {
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
        {isModelLoading && <LoadingOverlay />}

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
        {lastDetections && detectedFace && (
          <FaceFrame
            detections={lastDetections.detections}
            displaySize={lastDetections.displaySize}
            canvasRef={canvasRef}
          />
        )}
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
