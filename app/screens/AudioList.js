import React, { useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { AudioContext } from '../context/AudioProvider';
import { Entypo } from '@expo/vector-icons'; 
import color from '../misc/color'; 

const AudioList = ({ navigation }) => {  // Destructure navigation prop
    const { audioFiles } = useContext(AudioContext); 

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.audioItem}
            onPress={() => navigation.navigate('AudioPlayback', { uri: item.uri })} // Navigate on press
        >
            <View style={styles.leftContainer}>
                <Text style={styles.audioName}>{item.filename}</Text>
                <Text style={styles.audioDuration}>{item.duration}</Text>
            </View>
            <View style={styles.rightContainer}>
                <Entypo 
                    onPress={() => {
                        console.log(`Options pressed for ${item.filename}`);
                    }} 
                    name="dots-three-vertical" 
                    size={24} 
                    color={color.FONT_MEDIUM} 
                />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Selected Audio Files</Text>
            <FlatList
                data={audioFiles}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    audioItem: {
        padding: 15,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
        borderRadius: 5,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
    },
    leftContainer: {
        flex: 1, 
        paddingRight: 10, 
    },
    audioName: {
        fontSize: 18,
        color: '#333',
    },
    audioDuration: {
        fontSize: 14,
        color: '#999',
    },
    rightContainer: {
        width: 50,
        alignItems: 'center', 
    },
});

export default AudioList;
