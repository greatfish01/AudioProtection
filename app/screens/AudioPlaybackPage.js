// AudioPlaybackPage.js
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { AudioContext } from '../context/AudioProvider';
import color from '../misc/color';
import * as FileSystem from 'expo-file-system';
import * as mime from 'mime';

const AudioPlaybackPage = ({ navigation }) => {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const route = useRoute();
  const { uri } = route.params;
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

    return () => (sound ? sound.unloadAsync() : undefined);
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
      const fileUri = uri;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      const formData = new FormData();
      formData.append("audio", {
        uri: fileUri,
        name: fileUri.split('/').pop(),
        type: mime.getType(fileUri) || 'audio/wav',
      });

      const serverUrl = "http://140.118.145.242:5000/upload_audio";
      const response = await fetch(serverUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data.result_binary && data.result_binary.length === 2) {
        const realPercentage = (data.result_binary[1] ?? 0) * 100;
        const fakePercentage = (data.result_binary[0] ?? 0) * 100;

        // Navigate to DetectionResultPage directly with results
        navigation.navigate('DetectionResult', {
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
