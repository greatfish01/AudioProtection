# AudioProtection

## Table of Contents
- [Overview](#overview)
- [Project-Root](#project-root)
- [System Source Code](#system-source-code)
- [Third-Party Libraries](#third-party-libraries)
- [AI Model Details](#ai-model-details)
- [Software Development Tools](#software-development-tools)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Project Root
project-root/ 
├── ai-detection-backend/       # Backend containing AI models for detection and protection 
│ ├── pycache/                  # Python cache files (ignored in version control) 
│ ├── assets/                   # Static assets such as preprocessed datasets or resources │ 
│ ├── core_scripts/             # Core scripts for data handling, model operations, and utilities 
│ ├── generate/                 # Generated adversarial audio files or intermediate results 
│ ├── input_data/               # Input for testing files 
│ ├── myenv/                    # Virtual environment (ignored in version control) 
│ ├── app.py                    # Flask API to expose backend functionalities (AI detection and adversarial attack)
│ ├── dev.txt                   # Development dependencies for Python 
│ ├── eval.py                   # Script to evaluate AI detection model performance 
│ ├── main.py                   # training the AI detection model architecture 
│ ├── model.pth                 # Pretrained AI detection PyTorch model for inference 
│ ├── model.py                  # Defines AI detection model architecture and loading logic 
│ ├── model_config_RawNet.yaml  # Configuration file for model parameters 
│ ├── test.txt                  # Testing dataset configuration 
│ └── train.txt                 # Training dataset configuration 
├── app/                        # Frontend application written in JavaScript 
│ ├── components/               # Reusable UI components 
│ │ ├── AudioListItem.js        # Component to display audio list items 
│ ├── context/                  # Context providers for app-wide state management 
│ │ ├── AudioProvider.js        # Manages multiple audio file and logic 
│ │ └── SingleAudioProvider.js  # Manages state for a single audio file 
│ ├── misc/                     # Miscellaneous utilities 
│ │ └── color.js                # Centralized color definitions for the app 
│ ├── navigation/               # Navigation-related files 
│ │ └── AppNavigator.js         # Configures the app's navigation stack 
│ ├── screens/                  # Individual app screens 
│ │ ├── AIDetectionScreen.js    # Displays AI detection homepage
│ │ ├── AudioList.js            # Screen showing a list of audio files 
│ │ ├── AudioPlaybackPage.js    # Screen for playing back audio files and detection
│ │ ├── DetectionRecordPage.js  # Screen for detection result from recording audio 
│ │ ├── DetectionResultPage.js  # Displays results of AI detection from uploading audio
│ │ ├── Adversarial.js          # Displays adversarial attack page
│ │ ├── VoiceRecordingPage.js   # Screen for recording audio and detecti
│ │ ├── Watermark.js            # convert watermarking screen into javascript
│ │ └── WatermarkScreen.tsx     # Screen for watermarking of audio files
├── assets/                     # Static resources like images or sample audio files 
├── ffmpeg-7.1/                 # FFmpeg binaries and configurations for audio processing 
├── App.js                      # Main entry point for the React Native app 
├── app.json                    # React Native app configuration 
├── package.json                # Node.js dependencies for the frontend 
├── tsconfig.json               # TypeScript configuration 
├── babel.config.js             # Babel configuration for JavaScript transpiling 
├── .gitignore                  # Specifies files and folders to exclude from version control 
├── README.md                   # Project documentation 
├── package-lock.json           # Lock file for npm dependencies 
└── yarn.lock                   # Lock file for Yarn dependencies

## Overview

AudioProtection is a comprehensive system designed to safeguard audio files using advanced protection mechanisms. It includes features like encryption, watermarking, and AI-powered detection for unauthorized access. The project leverages modern technologies, frameworks, and AI models to ensure robust security.

## System Source Code

The system is structured as follows:

### **1. ai-detection-backend**
The backend is responsible for AI-based audio detection and protection, including tasks such as model inference, evaluation, and training.

- **Key Components**:
  - `app.py`: The Flask API that exposes the backend functionalities, such as audio detection and processing.
  - `model.pth`: The pretrained PyTorch model used for inference.
  - `model.py`: Script defining the architecture and logic for the AI model.
  - `main.py`: Entry point for training the AI model. It includes:
    - Dataset preparation using `Dataset_LibriSeVoc`
    - Training and evaluation loops for multi-class and binary classification
    - The ability to save the best-performing model
  - `core_scripts/`: Contains core functionality, such as:
    - `config_parse/`: Parses configuration files.
    - `data_io/`: Handles dataset input/output operations.
    - `math_tools/`: Provides mathematical utilities for transformations.
    - `nn_manager/`: Manages neural network operations, including training and evaluation.
  - `model_config_RawNet.yaml`: Configuration file defining model parameters.
  - `eval.py`: Script for evaluating model performance.
  - `generate/`: Stores generated intermediate results or adversarial audio files.
  - `input_data/`: Contains input datasets for testing and training.
  - `train.txt` and `test.txt`: Dataset configuration files for training and testing.

### **2. app**
The frontend is built with React Native and provides the user interface for interacting with the system.

- **Key Components**:
  - **`components/`**: Reusable UI components.
    - `AudioListItem.js`: Displays individual audio items in a list.
    - `Screen.js`: A base screen component for consistent styling and layout.
  - **`context/`**: Manages application-wide state using React Context API.
    - `AudioProvider.js`: Provides context for managing multiple audio files.
    - `SingleAudioProvider.js`: Manages state for a single audio file.
  - **`misc/`**: Contains miscellaneous utilities.
    - `color.js`: Centralized color definitions for consistent theming across the app.
  - **`navigation/`**: Configures app navigation.
    - `AppNavigator.js`: Sets up the navigation stack for the app.
  - **`screens/`**: Individual app screens for different functionalities.
    - `AIDetectionScreen.js`: Displays AI detection results.
    - `AudioList.js`: Shows a list of uploaded or processed audio files.
    - `AudioPlaybackPage.js`: Plays audio files with detection details.
    - `DetectionRecordPage.js`: Allows users to record audio for detection purposes.
    - `DetectionResultPage.js`: Displays the results of AI detection.
    - `Player.js`: Provides audio playback features.
    - `VoiceRecordingPage.js`: Allows users to record and save audio for analysis.
    - `Watermark.js`: Manages the watermarking process for audio files.
    - `WatermarkScreen.tsx`: Screen interface for handling audio watermarking.
  - **`assets/`**: Contains static files, such as icons and images.

### **3. assets**
This directory holds static resources used throughout the project.

### **4. ffmpeg-7.1**
The system includes the FFmpeg library (version 7.1) for audio processing.

- **Key Usage**:
  - Encoding and decoding audio files.
  - Preprocessing audio for AI model input.
  - Supporting tasks like audio format conversion.

### **5. Configuration and Metadata**
- **`.gitignore`**: Specifies files and folders to exclude from version control.
- **`README.md`**: Provides project documentation.
- **`package-lock.json`** and **`yarn.lock`**: Manage dependency versions for frontend and backend.

## third-party-libraries
The project leverages several third-party libraries and tools:


### **1. AI Detection and Protection Backend**

The backend uses Python-based libraries to handle machine learning, audio processing, and API functionalities.

- **[PyTorch](https://pytorch.org/)**: Core deep learning framework for building and training neural networks.
- **[Torchaudio](https://pytorch.org/audio/)**: PyTorch’s audio processing library for handling audio data.
- **[Transformers (Hugging Face)](https://huggingface.co/docs/transformers/)**: Used for implementing Wav2Vec2 models for speech recognition tasks.
- **[FFmpeg](https://ffmpeg.org/)**: A multimedia framework for preprocessing audio files, such as trimming and normalization.
- **[Librosa](https://librosa.org/)**: Audio analysis library for extracting features such as spectrograms and mel-frequency coefficients.
- **[Soundfile (PySoundFile)](https://pysoundfile.readthedocs.io/)**: Reads and writes audio files, providing support for WAV and FLAC formats.
- **[TQDM](https://tqdm.github.io/)**: Library for creating progress bars in long-running operations like training or evaluation.
- **[Multiprocessing](https://docs.python.org/3/library/multiprocessing.html)**: Python's built-in library for parallelizing tasks.
- **[YAML](https://pyyaml.org/)**: Parses configuration files, such as `model_config_RawNet.yaml`.
- **[Flask](https://flask.palletsprojects.com/)**: Lightweight framework for creating RESTful APIs.
- **[Flask-CORS](https://flask-cors.readthedocs.io/)**: Enables Cross-Origin Resource Sharing for the Flask API.
- **[NumPy](https://numpy.org/)**: Supports numerical computation and matrix operations in preprocessing pipelines.
- **[Pandas](https://pandas.pydata.org/)**: Facilitates data organization and analysis.
- **[UUID](https://docs.python.org/3/library/uuid.html)**: Generates unique identifiers for file and task handling.
- **[Warnings](https://docs.python.org/3/library/warnings.html)**: Used for managing runtime warnings during execution.

---

### **2. Frontend Mobile Application**

The frontend, built with React Native and Expo, relies on the following libraries:

#### **Core Libraries**:
- **[React Native](https://reactnative.dev/)**: Framework for building cross-platform mobile applications.
- **[Expo](https://expo.dev/)**: Framework and platform for developing React Native apps.
- **[Axios](https://axios-http.com/)**: HTTP client for making API requests to the backend.
- **[TypeScript](https://www.typescriptlang.org/)**: Ensures strong typing for better maintainability and error detection.

#### **Navigation**:
- **[React Navigation](https://reactnavigation.org/)**: Manages navigation across screens.
  - **@react-navigation/native**: Core navigation package.
  - **@react-navigation/bottom-tabs**: Implements bottom tab navigation.
  - **@react-navigation/stack**: Provides stack-based navigation.

#### **Audio Handling**:
- **[expo-av](https://docs.expo.dev/versions/latest/sdk/av/)**: Handles audio playback and recording.
- **[expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)**: Provides access to the device's file system.
- **[expo-document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)**: Allows file selection from the device.

#### **UI and Icons**:
- **[@expo/vector-icons](https://github.com/oblador/react-native-vector-icons)**: Provides Material and FontAwesome icons for UI components.
  - **MaterialIcons**: Material Design icons.
  - **FontAwesome5**: FontAwesome 5 icons.

#### **Utilities**:
- **[React Context API](https://react.dev/learn/context/)**: Manages global state for the app.
- **[Mime](https://www.npmjs.com/package/mime)**: Identifies file MIME types.
- **[RecyclerListView](https://github.com/Flipkart/recyclerlistview)**: Efficiently renders large lists.

---

### **3. Shared Tools**

These libraries and tools are used across both the backend and frontend for development and testing.

- **[Git](https://git-scm.com/)**: Version control system for tracking changes in source code.
- **[Postman](https://www.postman.com/)**: API testing and debugging tool.
- **[Babel](https://babeljs.io/)**: JavaScript compiler for transpiling modern JavaScript code.
- **[TypeScript](https://www.typescriptlang.org/)**: Ensures strong typing and reduces runtime errors in the frontend.


## AI-model-details

### 1. AI Detection Model

This project implements an AI-based detection system to identify synthetic voices generated by neural vocoders. It focuses on detecting vocoder artifacts present in synthesized audio to distinguish between real and synthetic speech. The system is based on the improved **RawNet2** architecture and includes multi-loss optimization for enhanced detection performance.

---

### Features

1. **Real vs. Fake Audio Detection**:
   - The system distinguishes between genuine human audio and machine-generated synthetic audio.

2. **Multi-Class Vocoder Detection**:
   - Identifies specific vocoders (e.g., WaveNet, HiFi-GAN) used for generating synthetic audio.

3. **Dataset Compatibility**:
   - Designed to work with the **LibriSeVoc** dataset and other datasets containing synthetic and real audio samples.

---

### Model Architecture

#### **RawNet2-Based Model**
- **Purpose**:
  - Utilizes raw audio waveforms to detect vocoder artifacts in synthetic audio.
- **Architecture**:
  - Enhanced version of RawNet2 with multi-loss optimization.
  - Convolutional layers extract low-level audio features.
  - Fully connected layers classify audio as `Real` or `Fake`.
- **Input**:
  - Raw waveforms resampled to 24 kHz.
- **Output**:
  - Binary classification (`Real` or `Fake`) and multi-class classification (e.g., `Real`, `WaveNet`, `HiFi-GAN`, etc.).

---

### Dataset

#### **LibriSeVoc**
The **LibriSeVoc** dataset is used to train and evaluate the model:
- **Real Audio**:
  - Contains genuine human speech samples from the LibriTTS corpus.
- **Synthetic Audio**:
  - Includes vocoded samples generated using six state-of-the-art vocoders (e.g., WaveNet, HiFi-GAN).
- **Dataset Split**:
  - Training Set
  - Validation Set
  - Test Set

---

###### **Training Process**:
- Training is conducted using the `main.py` script:
  ```bash
  python main.py --data_path /your/path/to/LibriSeVoc/ --model_save_path /your/path/to/models/ 

### 2. Adversarial Attack

### 3. Audio Watermarking

## software-development-tools
Development of this project utilized the following tools:

- **Visual Studio Code**: The primary Integrated Development Environment (IDE) for coding.
- **Git**: Version control system for tracking changes.
- **GitHub**: Platform for hosting the repository and facilitating collaboration.
  
## Installation

### Prerequisites

Before starting, ensure the following tools and dependencies are installed on your machine:

1. **Node.js**:
   - Download and install from [Node.js official website](https://nodejs.org/).

2. **Python**:
   - Download and install from [Python official website](https://www.python.org/downloads/).

3. **Expo CLI**:
   - Install Expo CLI globally using npm:
     ```bash
     npm install -g expo-cli
     ```

4. **Mobile Device**:
   - Install the **Expo Go** app on your mobile device:
     - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
     - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).

---

### Installation Steps

#### Step 1: Clone the Repository

Clone the project repository to your local machine:
```bash
git clone https://github.com/<your-repo-name>.git
cd <your-project-folder>
  ```
#### Step 2: Install Dependencies

Install the required dependencies for the react native frontend
```bash
npm install
  ```
#### Step 3: Set up the AI-Backend
Start the Flask server in another command prompt to handle audio detection:
```bash
cd ai-detection-backend
python app.py
  ```
#### Step 4: Start the Development Server
Run the Expo Development server:
```bash
npx expo start
  ```
#### Step 5: Run the App on Expo Go
Scan the QR Code given from the command prompt
The app will automatically load and run on your mobile device

## Usage

### How to Use the System

1. **Start the AI Backend**:
   - Open a terminal and navigate to the backend directory:
     ```bash
     cd ai-detection-backend
     python app.py
     ```

2. **Launch the Mobile App**:
   - Open another terminal for the frontend and start the Expo development server:
     ```bash
     cd app
     npx expo start
     ```
   - Open the **Expo Go** app on your mobile device and scan the QR code.

3. **Perform Audio Detection**:
   - Use the mobile app to:
     - **Upload Audio**: Select an audio file from your device for analysis.
     - **View Results**: The app will display whether the audio is `Real` or `Fake`.

## License

###1. AI-Detection Model
This Model is based on the [Synthetic-Voice-Detection-Vocoder-Artifacts](https://github.com/csun22/Synthetic-Voice-Detection-Vocoder-Artifacts) repository, which is licensed under the **MIT License**. 

#### MIT License Summary:
- Permission is granted, free of charge, to use, copy, modify, and distribute the software.
- A copy of the license terms and the original copyright notice must be included in all copies or substantial portions of the software.

For more details, see the original [LICENSE](https://github.com/csun22/Synthetic-Voice-Detection-Vocoder-Artifacts/blob/main/LICENSE) file in the repository.

This project follows the same licensing terms as the original repository.
