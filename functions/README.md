# Firebase Functions

This directory contains the Cloud Functions for the project.

## Deployment

To deploy the functions to Firebase, run:

```bash
npm run deploy
```

This command runs `firebase deploy --only functions`.

## Local Development

To run the functions locally using the Firebase Emulator Suite:

```bash
npm run serve
```

This will build the TypeScript code and start the emulators.

## Other Commands

- **Build**: `npm run build` - Compiles the TypeScript code.
- **Watch**: `npm run build:watch` - Compiles in watch mode.
- **Shell**: `npm run shell` - Opens the interactive functions shell.
- **Logs**: `npm run logs` - Views the function logs.
