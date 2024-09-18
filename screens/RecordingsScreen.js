import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from "react-native-gesture-handler";

export default function RecordingsScreen({ navigation, route }) {
    const [recordings, setRecordings] = useState([]);
    const [playingIndex, setPlayingIndex] = useState(null);
    const [playbackObject, setPlaybackObject] = useState(null);

    useEffect(() => {
        const loadRecordings = async () => {
            const savedRecordings = await AsyncStorage.getItem('recordings');
            if (savedRecordings) {
                setRecordings(JSON.parse(savedRecordings));
            }
        };
        loadRecordings();

        // if (route.params) {
        //     const { uri, name } = route.params;
        //     const newRecording = { uri, name };
        //     setRecordings((prev) => [...prev, newRecording]);
        //     saveRecordings([...recordings, newRecording]);
        // }
    }, []);

    const deleteRecording = async (uri) => {
        const updatedRecordings = recordings.filter((recording) => recording.uri !== uri);
        await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
        setRecordings(updatedRecordings);
    };

    const saveRecordings = async (recordings) => {
        try {
            await AsyncStorage.setItem('recordings', JSON.stringify(recordings));
        } catch (error) {
            console.log("Error saving recordings:", error);
        }
    };

    const playRecording = async (uri, index) => {
        if (playingIndex === index) {
            // If the same recording is clicked, toggle pause/play
            if (playbackObject) {
                await playbackObject.pauseAsync();
                setPlayingIndex(null); // Reset playing index
            }
        } else {
            // Play a new recording
            if (playbackObject) {
                await playbackObject.stopAsync(); // Stop the previous recording
            }
            const sound = new Audio.Sound();
            await sound.loadAsync({ uri });
            await sound.playAsync();
            setPlaybackObject(sound);
            setPlayingIndex(index);
            // Set up playback status update
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setPlayingIndex(null); // Reset playing index when finished
                }
            });
            await sound.playAsync();
            setPlaybackObject(sound);
            setPlayingIndex(index); // Set the current playing index
        }
    };

    const saveFile = async (uri, filename) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            const fileUri = FileSystem.documentDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
            await Sharing.shareAsync(fileUri);
            console.log("File saved and shared successfully.");
        } catch (error) {
            console.log("Error saving file:", error);
            Alert.alert("Error", "Could not save the file.");
        }
    };

    const renderRecordingItem = ({ item, index }) => (
        <Swipeable renderRightActions={() => (
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                    Alert.alert(
                        "Delete Recording",
                        "Are you sure you want to delete this recording?",
                        [{ text: "Cancel", style: "cancel" },{ text: "Delete", onPress: () => deleteRecording(item.uri) },]
                    );
                }}
            >
                <FontAwesome name="trash" size={24} color="white" />
            </TouchableOpacity>
        )}>
            <View style={styles.recordingItem}>
                <TouchableOpacity onPress={() => playRecording(item.uri, index)}>
                    <View style={{backgroundColor:'#E4E8EA',padding:10,borderRadius:80,alignItems:'center',justifyContent:'center',}}>
                        <FontAwesome name={playingIndex === index ? "pause" : "play"} size={24} color={playingIndex === index ? "blue" : "#4C7EF5"} />
                    </View>
                </TouchableOpacity>
                <Text style={styles.recordingName}>{item.name}</Text>
                <TouchableOpacity onPress={() => saveFile(item.uri, item.name)}>
                    <FontAwesome name="download" size={25} color="#4C7E" />
                </TouchableOpacity>
            </View>
        </Swipeable>
        
    );

    return (
        <View style={styles.recordingsContainer}>
            <Text style={styles.title}>Recordings</Text>
            <FlatList
                data={recordings}
                renderItem={renderRecordingItem}
                keyExtractor={(item) => item.name}
                style={styles.recordingsList}
            />
            <TouchableOpacity style={styles.recordButton} onPress={() => navigation.navigate("Recording")}>
                <Text style={styles.recordButtonText}>Record</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    recordingsContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: "#FFFFFF",
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        marginBottom: 20,
        alignSelf: "flex-start",
    },
    recordingItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical:30,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    recordingName: {
        flex: 1,
        marginLeft: 10,
        fontSize:20
    },
    recordingsList: {
        marginTop: 20,
    },
    recordButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#4887D2",
        borderRadius: 10,
        alignItems: "center",
        marginHorizontal:50
    },
    recordButtonText: {
        color: "white",
        fontSize: 18,
    },
    deleteButton: {
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center",
        width: 70,
        height: 70,
        borderRadius: 10,
        marginVertical: 10,
        marginLeft: 10,
    },
});