import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import color from '../misc/color';

const DetectionResultPage = ({ navigation }) => {
  const [realPercentage, setRealPercentage] = useState(null);
  const [fakePercentage, setFakePercentage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to fetch detection results from the server
    const fetchDetectionResult = async () => {
      try {
        const response = await fetch('http://***/get_binary_classification_result', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Set the state with the fetched data, multiplying by 100 to convert to percentage
        setRealPercentage((data.real ?? 0) * 100);
        setFakePercentage((data.fake ?? 0) * 100);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching detection result:', error);
        Alert.alert('Error', 'Failed to fetch detection result from the server.');
        setIsLoading(false);
      }
    };

    fetchDetectionResult();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading detection results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.resultText}>Detection Result</Text>
      <View style={styles.boxContainer}>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>REAL</Text>
          <Text style={styles.boxPercentage}>
            {realPercentage.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>FAKE</Text>
          <Text style={styles.boxPercentage}>
            {fakePercentage.toFixed(2)}%
          </Text>
        </View>
      </View>
      <Text style={styles.checkVoiceText}>Please check your other voice recordings</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back</Text>
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
  loadingText: {
    fontSize: 18,
    marginTop: 10,
  },
  resultText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  boxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  box: {
    width: '40%',
    padding: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    alignItems: 'center',
  },
  boxTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  boxPercentage: {
    fontSize: 20,
    marginTop: 10,
  },
  checkVoiceText: {
    fontSize: 18,
    marginVertical: 10,
  },
  backButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DetectionResultPage;
