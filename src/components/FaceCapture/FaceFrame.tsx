
import React from "react";
import * as faceapi from "face-api.js";

interface FaceFrameProps {
  detections: any;
  displaySize: { width: number; height: number; };
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const FaceFrame = ({ detections, displaySize, canvasRef }: FaceFrameProps) => {
  // Draw face box and label
  React.useEffect(() => {
    if (!detections || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    // Box
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

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
  }, [detections, displaySize, canvasRef]);
  return null;
};

export default FaceFrame;
