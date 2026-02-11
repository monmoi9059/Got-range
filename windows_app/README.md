# Taco Basketball - Windows App

This folder contains the source code for the Windows desktop version of Taco Basketball, built with Electron.

## Prerequisites

*   [Node.js](https://nodejs.org/) installed on your machine.

## Setup

1.  Open a terminal (Command Prompt or PowerShell) in this `windows_app` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```

## Running in Development Mode

To run the app locally without building an executable:

```bash
npm start
```

## Building the Executable (.exe)

To package the app into a standalone Windows executable:

1.  Run the build script:
    ```bash
    npm run build
    ```

2.  Once the process completes, check the `dist/` folder. inside `dist/taco-basketball-windows-win32-x64/`, you will find `taco-basketball-windows.exe`.

**Note:** On non-Windows platforms (Linux/Mac), building for Windows requires Wine to set the executable icon properly. If Wine is not installed, the build will succeed but the .exe might have a default icon.
