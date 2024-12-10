import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileSelected, setIsFileSelected] = useState(false);
  const [isUploadButtonDisabled, setIsUploadButtonDisabled] = useState(false);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Permission to access microphone is required.');
        return;
      }
  
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
  
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 44100,
          numberOfChannels: 1, // Ensure single channel (mono)
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1, // Ensure single channel (mono)
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };
      
  
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      showAlert('Error', 'Error accessing microphone.');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (uri) {
        setRecordedAudio({ uri });
        setSelectedFile({ uri, name: `recorded_audio_${Date.now()}.wav` });
        setIsFileSelected(true);
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      showAlert('Error', 'Could not stop recording');
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedAudio?.uri) {
      showAlert('No Recording', 'Please record audio before playing.');
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: recordedAudio.uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      showAlert('Error', 'Could not play recorded audio.');
    }
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: false,
      });

      if (!result.canceled) {
        const file = result.assets ? result.assets[0] : result;
        const { uri, name } = file;

        if (!uri) {
          showAlert('Error', 'No URI found for the selected file.');
          return;
        }

        const originalName = name ? decodeURIComponent(name) : `audio_${Date.now()}.wav`;

        setSelectedFile({
          uri: uri,
          name: originalName,
          size: file.size ?? 0,
        });
        setIsFileSelected(true);
        console.log('File selected:', originalName);
      } else {
        showAlert('Upload cancelled', 'No file selected.');
      }
    } catch (err) {
      console.error('Error picking file:', err);
      showAlert('Error', 'An error occurred while picking the file.');
    }
  };

  const handleAddWatermark = async () => {
    try {
      if (!selectedFile) {
        showAlert('No file selected', 'Please select an audio file before adding a watermark.');
        return;
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: selectedFile.uri,
        type: 'audio/wav',
        name: selectedFile.name,
      });

      const response = await fetch('http://140.118.145.106:5000/generate', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        showAlert('Error', errorResponse.error || 'Failed to add watermark.');
        return;
      }

      const data = await response.json();
      if (!data.filePath) {
        showAlert('Error', 'Watermark generation failed. No file path returned.');
        return;
      }

      console.log('Watermark added: ', data.filePath);
      showAlert('Success', 'Watermark added successfully!');
      setSelectedFile({
        uri: data.filePath,
        name: `watermarked_${selectedFile.name}`,
      });
    } catch (error) {
      console.error('Error adding watermark:', error);
      showAlert('Error', 'An error occurred while adding watermark.');
    }
  };

  const handleDetectWatermark = async () => {
    try {
      if (!selectedFile) {
        showAlert('No file selected', 'Please select an audio file before detecting a watermark.');
        return;
      }

      const formData = new FormData();
      formData.append('audio', {
        uri: selectedFile.uri,
        type: 'audio/wav',
        name: selectedFile.name,
      });

      const response = await fetch('http://140.118.145.106:5000/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        showAlert('Error', errorResponse.error || 'Failed to detect watermark.');
        return;
      }

      const result = await response.json();
      const detected = result.watermark_detected ? 'Watermark detected' : 'No watermark detected';
      // const message = result.message ? `Message: ${result.message}` : 'No message available';
      console.log('Watermark detection result: ', detected);
      showAlert('Detection Result', `${detected}`);
    } catch (error) {
      console.error('Error detecting watermark:', error);
      showAlert('Error', 'An error occurred while detecting watermark.');
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setIsFileSelected(false);
    setRecordedAudio(null);
    setIsUploadButtonDisabled(false);
    setIsRecording(false);
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
    console.log('Session has been reset.');
  };

    return (
    <View style={styles.container}>
      <Text style={styles.title}>Watermark Add & Detect</Text>
      <View style={styles.card}>
        {/* Recording Buttons */}
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[
            styles.button,
            isRecording ? { backgroundColor: '#dc3545' } : { backgroundColor: '#007bff' },
            ]}>
          <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
        </TouchableOpacity>

        {recordedAudio && (
          <View>
            <TouchableOpacity

              onPress={playRecordedAudio}
              style={[styles.button, { backgroundColor: '#5cb85c' }]}
            >
              <Text style={styles.buttonText}>Play Recorded Audio</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* File Upload & Watermark Section */}
        <TouchableOpacity
          onPress={handlePickAudio}
          style={[
            styles.button,
            isUploadButtonDisabled ? styles.disabledButton : {},
            isFileSelected && !isUploadButtonDisabled && { backgroundColor: '#5cb85c' },
          ]}
          disabled={isUploadButtonDisabled}
        >
          <Text style={styles.buttonText}>Upload File</Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Selected file: {selectedFile.name}</Text>
            <TouchableOpacity onPress={handleAddWatermark} style={[styles.button, { backgroundColor: '#007bff' }]}>
              <Text style={styles.buttonText}>Add Watermark</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDetectWatermark} style={[styles.button, { backgroundColor: '#007bff' }]}>
              <Text style={styles.buttonText}>Detect Watermark</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetState} style={[styles.button, { backgroundColor: '#dc3545' }]}>
              <Text style={styles.buttonText}>Cancel Selection</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});
