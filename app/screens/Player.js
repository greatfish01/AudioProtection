import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Screen from '../components/Screen';
import color from '../misc/color';
import { AudioContext } from '../context/SingleAudioProvider';
import { Audio } from 'expo-av';

const Player = () => {
    const { pickSingleAudioFile } = useContext(AudioContext);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedAudioUri, setUploadedAudioUri] = useState(null);
    const [recordedAudioUri, setRecordedAudioUri] = useState(null);
    const [processedAudioUri, setProcessedAudioUri] = useState(null);
    const [sound, setSound] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const recordingRef = useRef(null);

    useEffect(() => {
        return sound ? () => { sound.unloadAsync(); setSound(null); } : undefined;
    }, [sound]);

    const handlePickAudio = async () => {
        try {
            setIsUploading(true);
            const selectedAudio = await pickSingleAudioFile();
            if (selectedAudio && selectedAudio.uri) {
                setUploadedAudioUri(selectedAudio.uri);
            } else {
                Alert.alert('Error', 'No audio file selected. Please try again.');
            }
        } catch (error) {
            Alert.alert('Processing Error', error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync({
                android: {
                    extension: '.wav',
                    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
                    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                },
                ios: {
                    extension: '.wav',
                    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 16000,
                },
            });
            recordingRef.current = recording;
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording: ' + err.message);
        }
    };

    const stopRecording = async () => {
        if (!recordingRef.current) return;
        try {
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            setRecordedAudioUri(uri);
            recordingRef.current = null;
            setIsRecording(false);
        } catch (error) {
            console.error('Error stopping recording:', error);
            Alert.alert('Error', 'Could not stop recording');
        }
    };

    const handlePlayAudio = async (audioUri) => {
        if (!audioUri) {
            console.warn("No audio URI provided.");
            return;
        }

        try {
            if (sound) {
                await sound.unloadAsync();
            }
            const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri });
            setSound(newSound);
            await newSound.playAsync();
            newSound.setOnPlaybackStatusUpdate(status => {
                if (status.didJustFinish) newSound.unloadAsync();
            });
            console.log("Playing audio from URI:", audioUri);
        } catch (error) {
            console.error('Error playing audio:', error);
            Alert.alert('Playback Error', 'Failed to play the audio.');
        }
    };

    const handleStopAudio = async () => {
        if (sound) {
            await sound.stopAsync();
        }
    };

    const cancelUploadedAudio = () => {
        setUploadedAudioUri(null);
        setProcessedAudioUri(null);
        handleStopAudio();
    };

    const cancelRecordedAudio = () => {
        setRecordedAudioUri(null);
        setProcessedAudioUri(null);
        handleStopAudio();
    };

    const uploadAndProcessAudio = async (audioUri, isRecorded = false) => {
        if (!audioUri) return;
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', {
                uri: audioUri,
                type: 'audio/wav',
                name: isRecorded ? 'recorded_audio.wav' : 'uploaded_audio.wav',
            });

            const response = await fetch('path/to/server', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) throw new Error('File upload failed');
            const result = await response.json();
            setProcessedAudioUri(result.filePath);
            console.log("Processed audio URI set to:", result.filePath);

            Alert.alert('Adversarial Attack', 'Adversarial attack added to the audio! You can now play the modified audio.');
        } catch (error) {
            console.error("Error during upload and process:", error);
            Alert.alert('Upload Error', error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Screen>
            <View style={styles.centeredView}>
                <Text style={styles.title}>AI Voice Protection</Text>
                <Text style={styles.tagline}>Protect your voice from AI-generated attacks.</Text>

                <TouchableOpacity style={styles.button} onPress={handlePickAudio} disabled={isUploading || isRecording}>
                    <Text style={styles.buttonText}>Upload Voice</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={isRecording ? stopRecording : startRecording} disabled={isUploading}>
                    <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Record Voice'}</Text>
                </TouchableOpacity>

                {isUploading && <ActivityIndicator size="large" color={color.ACTIVE_BG} />}

                {uploadedAudioUri && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.playButton} onPress={() => handlePlayAudio(uploadedAudioUri)}>
                            <Text style={styles.buttonText}>Play Uploaded Audio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.stopButton} onPress={handleStopAudio}>
                            <Text style={styles.buttonText}>Stop Uploaded Audio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.attackButton} onPress={() => uploadAndProcessAudio(uploadedAudioUri)}>
                            <Text style={styles.buttonText}>Add Adversarial Attack</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelUploadedAudio}>
                            <Text style={styles.buttonText}>Cancel Uploaded Audio</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {recordedAudioUri && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.playButton} onPress={() => handlePlayAudio(recordedAudioUri)}>
                            <Text style={styles.buttonText}>Play Recorded Audio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.stopButton} onPress={handleStopAudio}>
                            <Text style={styles.buttonText}>Stop Recorded Audio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.attackButton} onPress={() => uploadAndProcessAudio(recordedAudioUri, true)}>
                            <Text style={styles.buttonText}>Add Adversarial Attack to Recording</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelRecordedAudio}>
                            <Text style={styles.buttonText}>Cancel Recorded Audio</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {processedAudioUri && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.playButton} onPress={() => handlePlayAudio(processedAudioUri)}>
                            <Text style={styles.buttonText}>Play Adversarial Audio</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.stopButton} onPress={handleStopAudio}>
                            <Text style={styles.buttonText}>Stop Adversarial Audio</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    title: { fontSize: 28, color: color.FONT, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    tagline: { fontSize: 16, color: color.FONT_MEDIUM, textAlign: 'center', marginBottom: 30 },
    button: { backgroundColor: color.ACTIVE_BG, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, marginVertical: 10, width: '70%', alignItems: 'center' },
    playButton: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, marginVertical: 10, width: '70%', alignItems: 'center' },
    stopButton: { backgroundColor: '#f44336', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, marginVertical: 10, width: '70%', alignItems: 'center' },
    attackButton: { backgroundColor: '#FF9800', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, marginVertical: 10, width: '70%', alignItems: 'center' },
    cancelButton: { backgroundColor: '#8b0000', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, marginVertical: 10, width: '70%', alignItems: 'center' },
    buttonText: { color: color.ACTIVE_FONT, fontSize: 16 },
    actionButtons: { marginTop: 20, alignItems: 'center' },
});

export default Player;
