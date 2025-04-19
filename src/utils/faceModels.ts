
/**
 * This utility handles downloading face-api.js models if they don't exist
 */
import * as faceapi from 'face-api.js';

// URLs for the models on GitHub
const MODELS_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const LOCAL_MODELS_PATH = '/models';

// List of models we need
const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

/**
 * Checks if models exist locally, downloads them if they don't
 */
export const ensureFaceModelsLoaded = async (): Promise<void> => {
  try {
    // First try to load the models from the local path
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_MODELS_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_MODELS_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_MODELS_PATH)
    ]);
    
    console.log('Face-api models loaded successfully from local path');
  } catch (error) {
    console.warn('Could not load models from local path, attempting to download from CDN');
    
    // If loading from local path fails, fetch from CDN
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL)
      ]);
      
      console.log('Face-api models loaded successfully from CDN');
    } catch (cdnError) {
      console.error('Failed to load face-api models from CDN', cdnError);
      throw new Error('Failed to load face recognition models. Please check your internet connection.');
    }
  }
};

export default ensureFaceModelsLoaded;
