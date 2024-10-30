import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Screen from '../components/Screen';
import color from '../misc/color';
import { AudioContext } from '../context/AudioProvider';
import { useNavigation } from '@react-navigation/native';

const AIDetectionScreen = () => {
    const { pickAudioFiles } = useContext(AudioContext);
    const navigation = useNavigation(); // Access navigation object

    const handlePickAudio = async () => {
        await pickAudioFiles(); // Select files
        navigation.navigate('AudioList'); // Navigate to AudioList after picking files
    };

    const handleRecordVoice = () => {
        navigation.navigate('VoiceRecording'); // Navigate to VoiceRecordingPage
    };

    return (
        <Screen>
            <View style={styles.centeredView}>
                <Text style={styles.title}>AI Voice Detection</Text>
                <Text style={styles.tagline}>Detect if your voice recording is real or AI-generated.</Text>

                <TouchableOpacity style={styles.button} onPress={handlePickAudio}>
                    <Text style={styles.buttonText}>Upload Voice</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleRecordVoice}>
                    <Text style={styles.buttonText}>Record Voice</Text>
                </TouchableOpacity>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        color: color.FONT,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    tagline: {
        fontSize: 16,
        color: color.FONT_MEDIUM,
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: color.ACTIVE_BG,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginVertical: 10,
        width: '70%',
        alignItems: 'center',
    },
    buttonText: {
        color: color.ACTIVE_FONT,
        fontSize: 16,
    },
});

export default AIDetectionScreen;
