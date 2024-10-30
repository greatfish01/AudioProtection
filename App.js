import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './app/navigation/AppNavigator';
import { AudioProvider } from './app/context/AudioProvider';


export default function App() {
    return (
        <AudioProvider>
            <NavigationContainer>
                <AppNavigator/>
            </NavigationContainer>
        </AudioProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
