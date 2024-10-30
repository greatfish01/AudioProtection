import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DetectionRecordPage = ({ route, navigation }) => {
  const { realPercentage, fakePercentage } = route.params;

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

export default DetectionRecordPage;
