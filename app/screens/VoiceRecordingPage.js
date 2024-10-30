// VoiceRecordingPage.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

const VoiceRecordingPage = ({ navigation }) => {
  const [recording, setRecording] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedUri, setRecordedUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState();

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    let timer;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access microphone was denied');
    }
  };

  const onRecordingStatusUpdate = (status) => {
    if (status.isDoneRecording) {
      setIsRecording(false);
      setIsPaused(false);
      console.log('Recording finished');
    }
  };

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('Starting recording..');

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onRecordingStatusUpdate
      );
      setRecording(recording);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0); // Reset duration at start
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setIsPaused(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri);
    console.log('Recording URI:', uri);
  };

  const pauseRecording = async () => {
    if (recording) {
      setIsPaused(true);
      await recording.pauseAsync();
    }
  };

  const resumeRecording = async () => {
    if (recording) {
      setIsPaused(false);
      await recording.startAsync();
    }
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      if (isPaused) {
        await resumeRecording();
      } else {
        await pauseRecording();
      }
    } else {
      await startRecording();
    }
  };

  const sendAudioToServer = async () => {
    if (!recordedUri) {
      Alert.alert('Error', 'No recording found to send.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: recordedUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });

      const serverUrl = 'http://***/upload_audio';
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send audio to server');
      }

      const data = await response.json();
      const realPercentage = (data.result_binary[1] ?? 0) * 100;
      const fakePercentage = (data.result_binary[0] ?? 0) * 100;

      // Navigate to DetectionRecordPage with the results
      navigation.navigate('DetectionRecord', {
        realPercentage,
        fakePercentage,
      });
    } catch (error) {
      console.error('Error sending audio to server:', error);
      Alert.alert('Error', 'Failed to send audio to server.');
    }
  };

  const playAudio = async () => {
    if (recordedUri) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
        setSound(sound);
        console.log('Playing audio...');
        await sound.playAsync();
      } catch (error) {
        console.error('Error playing audio:', error);
        Alert.alert('Error', 'Failed to play the recording.');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tagline}>Voice Recording Page</Text>
      {isRecording && (
        <Text style={styles.timer}>Duration: {formatTime(recordingDuration)}</Text>
      )}
      <TouchableOpacity style={styles.recordButton} onPress={handleRecordPress}>
        <Text style={styles.buttonText}>
          {isRecording ? (isPaused ? 'Resume' : 'Pause') : 'Record'}
        </Text>
      </TouchableOpacity>
      {isRecording && (
        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      )}
      {recordedUri && (
        <TouchableOpacity style={styles.playButton} onPress={playAudio}>
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.detectButton} onPress={sendAudioToServer}>
        <Text style={styles.buttonText}>Detect</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  tagline: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timer: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stopButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: '#FFC107',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  detectButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VoiceRecordingPage;
