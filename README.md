
# Face ID Authentication System

This application demonstrates a secure facial recognition authentication system that prevents duplicate account creation by the same person.

## Features

- **Face ID Registration**: Create a new account using your face as a biometric identifier
- **Duplicate Prevention**: System prevents the same person from creating multiple accounts
- **Secure Login**: Login using your face without passwords
- **Clean UI**: Modern, responsive interface built with React and Tailwind CSS

## How It Works

1. **Registration**:
   - User provides their name and email
   - The system captures their facial features and creates a unique facial descriptor
   - Before registration is complete, the system checks if the face already exists in the database
   - If a match is found, registration is blocked with an "User already exists" message
   - If no match is found, the account is created successfully

2. **Login**:
   - User simply shows their face to the camera
   - The system compares the captured facial descriptor with stored user data
   - If a match is found, the user is granted access to their dashboard
   - If no match is found, access is denied

3. **Security**:
   - Facial matching uses euclidean distance calculations with a threshold of 0.5
   - Face recognition happens entirely client-side for privacy
   - No actual images of faces are stored, only mathematical descriptors

## Technical Implementation

- Built with React, TypeScript, and Tailwind CSS
- Uses face-api.js for facial recognition capabilities
- Implements client-side storage (localStorage) for demo purposes

## Getting Started

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Models will be loaded automatically from the public/models folder on first use

## Important Notes

- This implementation uses browser localStorage for demonstration purposes only
- In a production environment, facial descriptors should be stored securely on a server
- The threshold for face matching (0.5) can be adjusted for more strict or lenient matching
