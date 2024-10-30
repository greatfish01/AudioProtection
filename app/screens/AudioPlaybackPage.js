import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { AudioContext } from '../context/AudioProvider';
import color from '../misc/color';
import * as FileSystem from 'expo-file-system';
import * as mime from 'mime'; // To dynamically determine MIME types

const AudioPlaybackPage = ({ navigation }) => {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const route = useRoute();
  const { uri } = route.params; // The URI of the selected audio file from the audio list
  const { audioFiles } = useContext(AudioContext);

  useEffect(() => {
    const loadAndPlay = async () => {
      if (!uri) {
        Alert.alert('Error', 'No audio file found.');
        return;
      }
      try {
        const { sound } = await Audio.Sound.createAsync({ uri });
        setSound(sound);
        await sound.playAsync();
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error('Error playing sound:', error);
        Alert.alert('Error', 'Failed to play sound.');
      }
    };

    if (uri) {
      loadAndPlay();
    }

    return () => (sound ? sound.unloadAsync() : undefined); // Cleanup on unmount
  }, [uri]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (sound) {
          sound.stopAsync();
          setIsPlaying(false);
        }
      };
    }, [sound])
  );

  const handlePlayPause = async () => {
    if (isPlaying) {
      await sound.stopAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const saveAndUploadAudio = async () => {
    try {
      // File URI from the recorded audio
      const fileUri = uri;

      // Validate that the file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      // Create a FormData object to upload the file directly
      const formData = new FormData();
      formData.append("audio", {
        uri: fileUri,
        name: fileUri.split('/').pop(), // Extracts the filename
        type: mime.getType(fileUri) || 'audio/wav', // Dynamically determine MIME type
      });

      // Set up the request
      const settings = {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const serverUrl = "http://140.118.145.155:5000/upload_audio";
      const serverResponse = await fetch(serverUrl, settings);

      if (!serverResponse.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await serverResponse.json();

      // Navigate to DetectionResultPage with the received data
      navigation.navigate('DetectionResult', {
        realPercentage: data.realPercentage,
        fakePercentage: data.fakePercentage,
      });
    } catch (error) {
      console.error('Error sending audio to server:', error);
      Alert.alert('Error', 'Failed to send audio to server.');
    }
  };

  const detectVoice = () => {
    saveAndUploadAudio();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tagline}>Play Your Voice Recording</Text>
      <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
        <Text style={styles.buttonText}>{isPlaying ? 'Stop' : 'Play Audio'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.detectButton} onPress={detectVoice}>
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
    color: color.FONT,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
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

export default AudioPlaybackPage;
