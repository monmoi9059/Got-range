# Taco Basketball APK Build

This project has been set up to build an Android APK using Apache Cordova.

## Prerequisites

- Node.js
- Cordova (`npm install -g cordova` or use local `npx cordova`)
- Java JDK (11+)
- Android SDK & Command Line Tools
- Gradle

## Build Instructions

To rebuild the APK from the source:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Generate Icon:**
    This script extracts the icon from `gotrange.html` and saves it to `taco_app/res/icon.png`.
    ```bash
    mkdir -p taco_app/res
    node extract_icon.js
    ```

3.  **Build the APK:**
    ```bash
    cd taco_app
    npx cordova build android
    ```

    The output APK will be located at:
    `taco_app/platforms/android/app/build/outputs/apk/debug/app-debug.apk`

## Project Structure

- `taco_app/`: The Cordova project directory.
- `gotrange.html`: The original source game file.
- `extract_icon.js`: Helper script to extract the app icon.
- `taco_basketball.apk`: The pre-built APK file.
