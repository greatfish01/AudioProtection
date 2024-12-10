import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AudioList from '../screens/AudioList';
import Adversarial from '../screens/Adversarial';
import AIDetectionScreen from '../screens/AIDetectionScreen';
import VoiceRecordingPage from '../screens/VoiceRecordingPage';
import AudioPlaybackPage from '../screens/AudioPlaybackPage';
import DetectionResultPage from '../screens/DetectionResultPage';
import DetectionRecordPage from '../screens/DetectionRecordPage'; // Import the DetectionRecordPage
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Watermark from '../screens/Watermark';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#6200EE',
                tabBarInactiveTintColor: '#A0A0A0',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
            }}
        >
            <Tab.Screen
                name='AudioList' 
                component={AudioList}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="library-music" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='AI Detection'
                component={AIDetectionScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="headset" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='Adversarial'
                component={Adversarial}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5 name="compact-disc" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='Watermark'
                component={Watermark}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="water" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="MainTabs" 
                component={TabNavigator} 
                options={{ headerShown: false }}
            />
            <Stack.Screen 
                name="VoiceRecording" 
                component={VoiceRecordingPage} 
                options={{ title: 'Voice Recording' }}
            />
            <Stack.Screen 
                name="AudioPlayback" 
                component={AudioPlaybackPage} 
                options={{ title: 'Audio Playback' }}
            />
            <Stack.Screen 
                name="DetectionResult" 
                component={DetectionResultPage} 
                options={{ title: 'Detection Result' }}
            />
            <Stack.Screen 
                name="DetectionRecord" 
                component={DetectionRecordPage} 
                options={{ title: 'Detection Record' }}
            />
            <Stack.Screen 
                name="Watermark" 
                component={Watermark} 
                options={{ title: 'Watermark' }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;
