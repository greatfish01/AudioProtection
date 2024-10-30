import React, { Component, createContext } from 'react';
import { Alert, View, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { DataProvider } from 'recyclerlistview';
import { Audio } from 'expo-av';

export const AudioContext = createContext();

export class AudioProvider extends Component {
    constructor(props) {
        super(props);
        this.state = {
            audioFiles: [],
            permissionError: false,
            dataProvider: new DataProvider((r1, r2) => r1 !== r2),
        };
    }

    // Add a method to set navigation
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
                    onPress: () => this.pickAudioFiles(),
                }, 
                {
                    text: 'Cancel',
                    onPress: () => this.setState({ permissionError: true }),
                }
            ]
        );
    };

    pickAudioFiles = async () => {
        const { dataProvider, audioFiles } = this.state;

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                multiple: true,
            });

            if (!result.canceled) {
                const newFiles = result.assets || [result];
                const updatedFiles = [];

                for (const file of newFiles) {
                    const { uri } = file;

                    // Get duration using expo-av
                    const { sound, status } = await Audio.Sound.createAsync({ uri });
                    const duration = status.durationMillis
                        ? this.millisecondsToMinutes(status.durationMillis)
                        : '00:00';
                    
                    updatedFiles.push({
                        filename: file.name,
                        duration: duration,
                        uri: uri,
                    });

                    // Unload the sound
                    await sound.unloadAsync();
                }

                const mergedFiles = [...audioFiles, ...updatedFiles];

                this.setState({
                    audioFiles: mergedFiles,
                    dataProvider: dataProvider.cloneWithRows(mergedFiles),
                    permissionError: false,
                });

                console.log('Selected Audio Files:', mergedFiles);

                // Navigate to AudioList after updating audio files
                if (this.navigation) {
                    this.navigation.navigate('AudioList');
                }
            } else {
                this.setState({ permissionError: true });
                console.log('Picker was canceled by the user');
            }
        } catch (error) {
            console.error('Error picking audio files:', error);
        }
    };

    millisecondsToMinutes = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    render() {
        const { audioFiles, dataProvider, permissionError } = this.state;

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
                audioFiles, 
                dataProvider, 
                pickAudioFiles: this.pickAudioFiles,
                permissionAlert: this.permissionAlert,
                setNavigation: this.setNavigation,
            }}>
                {this.props.children}
            </AudioContext.Provider>
        );
    }
}
