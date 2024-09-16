import { Text, TouchableOpacity, View, StyleSheet, FlatList, Alert, Platform } from "react-native";
import React, { useState, useEffect } from "react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { FontAwesome } from "@expo/vector-icons";
import * as Sharing from 'expo-sharing'

export default function App() {
    const [recording, setRecording] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState("idle");
    const [audioPermission, setAudioPermission] = useState(null);
    const [recordings, setRecordings] = useState([]);
    const [playbackObject, setPlaybackObject] = useState(null);

    useEffect(() => {
        async function getPermissions() {
            const audioPermission = await Audio.requestPermissionsAsync();
            setAudioPermission(audioPermission.granted);
        }
        getPermissions();
        return () => {
            if (recording) {
                stopRecording(); // Ensure recording is stopped on cleanup
            }
        };
    }, []);

    async function startRecording() {
        if (!audioPermission) {
            console.log("No permission to record audio");
            return;
        }
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            await newRecording.startAsync();
            setRecording(newRecording);
            setRecordingStatus("recording");
        } catch (error) {
            console.error("Failed to start recording", error);
        }
    }

    async function stopRecording() {
        if (recording) {
            try {
                await recording.stopAndUnloadAsync();
                const recordingUri = recording.getURI();
                // Ensure a valid URI
                if (!recordingUri) {
                    console.log("Failed to get recording URI");
                    return;
                }

                const fileName = `recording-${Date.now()}.caf`;
                // Add the recording to the list
                setRecordings((prev) => [...prev, { uri: recordingUri, name: fileName }]);
                // Reset recording state
                setRecording(null);
                setRecordingStatus("stopped");
            } catch (error) {
                console.error("Failed to stop recording", error);
            }
        }
    }

    async function playRecording(uri) {
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri });
        await sound.playAsync();
        setPlaybackObject(sound);
    }

    async function pauseRecording() {
        if (playbackObject) {
            await playbackObject.pauseAsync();
        }
    }

    async function resumeRecording() {
        if (playbackObject) {
            await playbackObject.playAsync();
        }
    }

    async function saveFile(uri, filename, mimetype) {
        if (Platform.OS === "android") {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

                await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, mimetype)
                    .then(async (fileUri) => {
                        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
                        console.log("File saved successfully.");
                    })
                    .catch(e => console.log("Error saving file:", e));
            } else {
                Alert.alert("Permission denied", "Unable to access storage.");
            }
        } else { // For iOS
            try {
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                const fileUri = FileSystem.documentDirectory + filename; // Create a path in the app's document directory

                await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
                // Share the file
                await Sharing.shareAsync(fileUri);
                console.log("File saved and shared successfully.");
            } catch (error) {
                console.log("Error saving file:", error);
                Alert.alert("Error", "Could not save the file.");
            }
        }
    }

    const renderRecordingItem = ({ item }) => (
        <View style={styles.recordingItem}>
            <Text>{item.name}</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => playRecording(item.uri)}>
                    <FontAwesome name="play" size={24} color="green" />
                </TouchableOpacity>
                <TouchableOpacity onPress={pauseRecording}>
                    <FontAwesome name="pause" size={24} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity onPress={resumeRecording}>
                    <FontAwesome name="play-circle" size={24} color="orange" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => saveFile(item.uri, item.name, 'audio/aac')}>
                    <FontAwesome name="save" size={24} color="purple" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={recording ? stopRecording : startRecording}>
                <FontAwesome name={recording ? "stop-circle" : "circle"} size={64} color="white" />
            </TouchableOpacity>
            <Text style={styles.recordingStatusText}>
                {`Recording status: ${recordingStatus}`}
            </Text>
            <FlatList
                data={recordings}
                renderItem={renderRecordingItem}
                keyExtractor={(item) => item.name}
                style={styles.recordingsList}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    button: {
        alignItems: "center",
        justifyContent: "center",
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: "red",
    },
    recordingStatusText: {
        marginTop: 16,
    },
    recordingsList: {
        width: '100%',
        padding: 10,
    },
    recordingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});