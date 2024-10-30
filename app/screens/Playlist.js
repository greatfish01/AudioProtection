import React from 'react'; 
import {View, StyleSheet, Text} from 'react-native';

const Playlist = () => {
    return (
        <View style={StyleSheet.container}>
            <Text>Playlist</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1, 
        justifycontent: 'center',
        alignItems: 'center'
    }
})

export default Playlist;