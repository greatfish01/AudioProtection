import React from 'react'; 
import { View, StyleSheet, Text } from 'react-native';
import WatermarkDetectionScreen from './WatermarkScreen.tsx';

const Watermark = () => {
    return (
        <View style={styles.container}>
            <WatermarkDetectionScreen />
        </View>
    );
};
//必要
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
    }
});

export default Watermark;
