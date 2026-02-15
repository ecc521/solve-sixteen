# Solve Sixteen

Solve Sixteen is a React-based web application inspired by NYT Connections. It allows users to group words into categories by dragging and dropping them into rows.

## Features

-   **Drag and Drop Interface:** Organize words into 4 rows of 4.
-   **Daily Puzzles:** Play puzzles based on specific dates.
-   **NYT Integration:** Submit your groupings to the official NYT Connections game for verification.
-   **Firebase Backend:** Uses Cloud Functions to fetch puzzle data.

## Development

### Prerequisites

-   Node.js (v24+)
-   Firebase CLI (`npm install -g firebase-tools`)

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd solve-sixteen
    ```

2.  **Install dependencies:**
    ```bash
    cd client && npm install
    cd ../functions && npm install
    ```

3.  **Start the Firebase Emulators:**
    This will automatically build the TypeScript functions and start the local backend.
    ```bash
    firebase emulators:start
    ```
    *Note: The functions emulator typically runs on `http://localhost:5001`.*

4.  **Start the Frontend:**
    In a new terminal window:
    ```bash
    cd client
    npm run dev
    ```
     The application will be available at `http://localhost:5173`. By default, it is configured to talk to the local Firebase Emulators.

## Firebase Functions

The backend is built with Firebase Cloud Functions using Node.js 24 and TypeScript.

### Building Functions

To compile the TypeScript code manually:

```bash
cd functions
npm run build
```

This generates the JavaScript output in the `functions/lib` directory.

### Deploying Functions

To deploy the functions to your Firebase project:

```bash
firebase deploy --only functions
```

Note: The deployment process is configured to automatically run `npm run build` before uploading the code, ensuring the latest changes are always deployed.

## Deployment

The frontend is deployed to GitHub Pages via a GitHub Actions workflow.

### API Configuration

To ensure the production app can communicate with your Firebase Functions, you must set up a repository secret.

1.  Go to your GitHub Repository.
2.  Navigate to **Settings** > **Secrets and variables** > **Actions**.
3.  Click **New repository secret**.
4.  **Name:** `VITE_API_BASE_URL`
5.  **Value:** The base URL of your deployed Firebase Functions.
    *   Example: `https://us-central1-<your-project-id>.cloudfunctions.net`
    *   *Do not include a trailing slash or specific endpoint paths like `/getWords`.*

This secret is injected into the build process by the `.github/workflows/deploy-client.yml` workflow.
