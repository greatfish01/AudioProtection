import React, { Component, createContext } from 'react';
import { Alert, View, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { DataProvider } from 'recyclerlistview';
import { Audio } from 'expo-av';

export const AudioContext = createContext();

export class SingleAudioProvider extends Component {
    constructor(props) {
        super(props);
        this.state = {
            audioFile: null, // For single file
            permissionError: false,
            dataProvider: new DataProvider((r1, r2) => r1 !== r2),
        };
    }

    // Method to set navigation
    setNavigation = (navigation) => {
        this.navigation = navigation;
    };

    permissionAlert = () => {
        Alert.alert(
            "Permission Required", 
            "This app needs to access audio files!", 
            [
                {
                    text: 'I am ready',
                    onPress: () => this.pickSingleAudioFile(),
                }, 
                {
                    text: 'Cancel',
                    onPress: () => this.setState({ permissionError: true }),
                }
            ]
        );
    };

    // Function to pick a single audio file
    pickSingleAudioFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                multiple: false, // Only allow single selection
            });

            if (!result.canceled) {
                const file = result.assets ? result.assets[0] : result;
                const { uri, name } = file;

                // Get duration using expo-av
                const { sound, status } = await Audio.Sound.createAsync({ uri });
                const duration = status.durationMillis
                    ? this.millisecondsToMinutes(status.durationMillis)
                    : '00:00';

                await sound.unloadAsync();

                // Update state with single selected audio file
                const selectedFile = {
                    filename: name,
                    duration: duration,
                    uri: uri,
                };

                this.setState({
                    audioFile: selectedFile,
                    dataProvider: this.state.dataProvider.cloneWithRows([selectedFile]),
                    permissionError: false,
                });

                console.log('Selected Single Audio File:', selectedFile);

                // Optional: Navigate to AudioList if needed
                if (this.navigation) {
                    this.navigation.navigate('AudioList');
                }

                return selectedFile; // Return the selected file for direct use
            } else {
                this.setState({ permissionError: true });
                console.log('Picker was canceled by the user');
                return null;
            }
        } catch (error) {
            console.error('Error picking single audio file:', error);
            return null;
        }
    };

    millisecondsToMinutes = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    render() {
        const { audioFile, dataProvider, permissionError } = this.state;

        if (permissionError) {
            return (
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Text style={{ fontSize: 20, textAlign: 'center', color: 'red' }}>
                        You need to grant permission to access audio files.
                    </Text>
                </View>
            );
        }

        return (
            <AudioContext.Provider value={{ 
                audioFile, 
                dataProvider, 
                pickSingleAudioFile: this.pickSingleAudioFile, // Use single file picker function here
                permissionAlert: this.permissionAlert,
                setNavigation: this.setNavigation,
            }}>
                {this.props.children}
            </AudioContext.Provider>
        );
    }
}
