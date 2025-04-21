
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

/**
 * Custom hook for camera, model loading, and face detection.
 */
export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedFace, setDetectedFace] = useState<boolean>(false);
  const detectionInterval = useRef<number | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const { ensureFaceModelsLoaded } = await import('@/utils/faceModels');
        await ensureFaceModelsLoaded();
        setIsModelLoading(false);
        startVideo();
      } catch (err) {
        setError("Failed to load facial recognition models. Please try again later.");
        setIsModelLoading(false);
      }
    };

    loadModels();

    return () => {
      // Cleanup video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
    // eslint-disable-next-line
  }, []);

  const startVideo = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera access to use face recognition.");
    }
  };

  // Start the detection process on play
  const startDetection = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    onDetected?: (detections: any, displaySize: { width: number; height: number; }) => void
  ) => {
    if (!videoRef.current || !canvasRef.current) return;
    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    detectionInterval.current = window.setInterval(async () => {
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
            onDetected && onDetected(detections, displaySize);
          } else {
            setDetectedFace(false);
          }
        }
      } catch (err) {
        // silent to avoid flooding
      }
    }, 100);
  };

  return {
    isModelLoading,
    error,
    setError,
    detectedFace,
    setDetectedFace,
    startDetection,
  };
}
