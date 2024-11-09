import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

const VoiceRecordingPage = ({ navigation }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedUri, setRecordedUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState(null);

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

  useEffect(() => {
    // Stop the audio when navigating away from this screen
    const unsubscribe = navigation.addListener('blur', () => {
      stopAudioPlayback();
    });

    return unsubscribe;
  }, [navigation, sound]);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access microphone was denied');
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.caf',
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        }
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
    setRecording(null);
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
        type: 'audio/wav', // Ensure server expects this format
        name: 'recording.wav',
      });
  
      const serverUrl = 'path/of/server/url';
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
  
      if (data.result_binary && data.result_binary.length === 2) {
        const realPercentage = (data.result_binary[1] ?? 0) * 100;
        const fakePercentage = (data.result_binary[0] ?? 0) * 100;
  
        // Stop audio playback and navigate to DetectionRecordPage with real and fake percentages
        stopAudioPlayback();
        navigation.navigate('DetectionRecord', {
          realPercentage,
          fakePercentage,
        });
      } else {
        Alert.alert('Error', 'Unexpected response format from the server.');
      }
    } catch (error) {
      console.error('Error sending audio to server:', error);
      Alert.alert('Error', 'Failed to send audio to server.');
    }
  };

  const playAudio = async () => {
    if (recordedUri) {
      try {
        const { sound: playbackSound } = await Audio.Sound.createAsync({ uri: recordedUri });
        setSound(playbackSound);
        console.log('Playing audio...');
        await playbackSound.playAsync();
      } catch (error) {
        console.error('Error playing audio:', error);
        Alert.alert('Error', 'Failed to play the recording.');
      }
    }
  };

  const stopAudioPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setSound(null);
      console.log('Audio playback stopped');
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
        <>
          <TouchableOpacity style={styles.playButton} onPress={playAudio}>
            <Text style={styles.buttonText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopButton} onPress={stopAudioPlayback}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </>
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
