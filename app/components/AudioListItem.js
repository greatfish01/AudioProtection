import React from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import color from '../misc/color'; // Adjust the path based on your file structure

const AudioListItem = ({ title, duration, onPlayPress, onOptionPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                <View style={styles.titleContainer}>
                    <Text numberOfLines={1} style={styles.title}>{title}</Text>
                    <Text style={styles.duration}>{duration}</Text>
                </View>
            </View>
            <View style={styles.rightContainer}>
                <TouchableOpacity onPress={onPlayPress}>
                    <Entypo name="controller-play" size={24} color={color.FONT_MEDIUM} />
                </TouchableOpacity>
                <Entypo 
                    onPress={onOptionPress} 
                    name="dots-three-vertical" 
                    size={24} 
                    color={color.FONT_MEDIUM} 
                />
            </View>
        </View>
    );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignSelf: 'center',
        width: width - 80,
        padding: 15,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
        borderRadius: 5,
        justifyContent: 'space-between', // Space between text and icons
        alignItems: 'center', // Center items vertically
    },
    leftContainer: {
        flex: 1,
        paddingRight: 10, // Add some space between text and icons
    },
    rightContainer: {
        width: 50,
        flexDirection: 'row',
        alignItems: 'center', // Center the icons
        justifyContent: 'space-between',
    },
    titleContainer: {
        width: width - 180,
    },
    title: {
        fontSize: 16,
        color: color.FONT,
    },
    duration: {
        fontSize: 12,
        color: color.FONT_LIGHT,
    },
});

export default AudioListItem;
