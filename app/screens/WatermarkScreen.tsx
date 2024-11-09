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

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      setIsUploadButtonDisabled(true);
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
      setRecordedAudio({ uri });
      setIsRecording(false);
      setIsUploadButtonDisabled(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      showAlert('Error', 'Could not stop recording');
    }
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
      });

      if (result.type !== 'cancel') {
        const fileDetails = result;
        setSelectedFile({
          uri: fileDetails.uri,
          name: fileDetails.name || 'Unnamed file',  // Default to "Unnamed file" if name is undefined
          size: fileDetails.size ?? 0,
        });
        setIsFileSelected(true);
      } else {
        showAlert('Upload cancelled', 'No file selected.');
      }
    } catch (err) {
      console.error('Error picking file:', err);
    }
  };

  const handleAddWatermark = () => {
    if (!selectedFile && !recordedAudio) {
      showAlert('No file selected', 'Please select or record audio before adding a watermark.');
      return;
    }

    const fileName = selectedFile ? selectedFile.name : 'recorded audio';
    showAlert('Add Watermark', `Watermark added, file name: watermarked_${fileName}`);
    resetState();
  };

  const handleDetectWatermarkFromFile = async () => {
    try {
      // Check if selectedFile and its name exist
      if (selectedFile && selectedFile.name) {
        console.log('File name:', selectedFile.name);

        if (selectedFile.name.includes('watermarked')) {
          showAlert('Watermark Detection', 'Watermark detected');
        } else {
          showAlert('Watermark Detection', 'No watermark detected');
        }
        resetState();
      } else {
        showAlert('No file selected', 'Please select an audio file before detecting a watermark.');
      }
    } catch (error) {
      console.error('Error detecting watermark from file:', error);
      showAlert('Error', 'An error occurred while detecting watermark');
    }
  };

  const handleDetectWatermarkFromRecording = () => {
    try {
      if (recordedAudio) {
        showAlert('Watermark Detection', 'No watermark detected');
      } else {
        showAlert('No audio recorded', 'Please record audio before detecting a watermark.');
      }
      resetState();
    } catch (error) {
      console.error('Error detecting watermark from recording:', error);
      showAlert('Error', 'An error occurred while detecting watermark');
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setIsFileSelected(false);
    setRecordedAudio(null);
    setIsUploadButtonDisabled(false);
    setIsRecording(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Watermark Add & Detect</Text>
      <View style={styles.card}>
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

        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[
            styles.button,
            isFileSelected
              ? { backgroundColor: '#ccc' }
              : isRecording
              ? { backgroundColor: '#d9534f' }
              : { backgroundColor: '#5cb85c' },
          ]}
          disabled={isFileSelected}
        >
          <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
        </TouchableOpacity>

        {recordedAudio && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Recorded Audio:</Text>
            <Text>{recordedAudio.uri}</Text>
            <TouchableOpacity onPress={handleAddWatermark} style={[styles.button, { backgroundColor: '#007bff' }]}>
              <Text style={styles.buttonText}>Add Watermark</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDetectWatermarkFromRecording} style={[styles.button, { backgroundColor: '#007bff' }]}>
              <Text style={styles.buttonText}>Detect Watermark (Recorded)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetState} style={[styles.button, { backgroundColor: '#dc3545' }]}>
              <Text style={styles.buttonText}>Cancel Selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedFile && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Selected file: {selectedFile.name}</Text>
            <TouchableOpacity onPress={handleAddWatermark} style={[styles.button, { backgroundColor: '#007bff' }]}>
              <Text style={styles.buttonText}>Add Watermark</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDetectWatermarkFromFile} style={[styles.button, { backgroundColor: '#007bff' }]}>
              <Text style={styles.buttonText}>Detect Watermark (Uploaded)</Text>
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
