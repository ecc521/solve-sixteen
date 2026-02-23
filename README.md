# Solve Sixteen

Solve Sixteen is a React-based web application designed for those who prefer to play NYT Connections in hard mode - solving all 4 rows at once. 

- Due to copyright constraints, this project does NOT validate your picks. It is purely intended as a thought organier. You must visit the official NYT website to check your answers and see category names. 

## Development

### Prerequisites

-   Node.js (v24+)
-   Firebase CLI (`npm install -g firebase-tools`)

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ecc521/solve-sixteen.git
    cd solve-sixteen
    ```

2.  **Install dependencies:**
    ```bash
    cd client && npm install
    cd ../functions && npm install
    ```

3.  **Configure Environment Variables:**
    In the `client/` directory, create a `.env` file based on `.env.example` and fill in your Firebase configuration:
    ```bash
    cp client/.env.example client/.env
    ```

4.  **Start the Firebase Emulators:**
    This will automatically build the TypeScript functions and start the local backend.
    ```bash
    firebase emulators:start
    ```
    *Note: The functions emulator typically runs on `http://localhost:5001`.*

5.  **Start the Frontend:**
    In a new terminal window:
    ```bash
    cd client
    npm run dev
    ```
     The application will be available at `http://localhost:5173`. By default, it is configured to talk to the local Firebase Emulators.

## Firebase Functions

The backend is built with Firebase Cloud Functions using Node.js 24 and TypeScript.

See [README.md](functions/README.md) in the functions subdirectory for more details. 

## Deployment

The frontend is deployed to GitHub Pages via a GitHub Actions workflow.

### Firebase Configuration

To ensure the production app can communicate with Firebase, you must set up repository secrets for the build process.

1.  Go to your GitHub Repository.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret** for each of the following:

| Secret Name | Description |
| ----------- | ----------- |
| `VITE_FIREBASE_API_KEY` | Your Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your Firebase Measurement ID |

These secrets are injected into the build process by the `.github/workflows/deploy-client.yml` workflow.
