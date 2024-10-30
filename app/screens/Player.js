import React from 'react'; 
import {View, StyleSheet, Text} from 'react-native';

const Player = () => {
    return (
        <View style={StyleSheet.container}>
            <Text>Player</Text>
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

export default Player;