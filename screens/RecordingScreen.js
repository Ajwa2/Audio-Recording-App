import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { Audio } from "expo-av";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RecordingScreen({ navigation }) {
    const [recording, setRecording] = useState(null);
    const [recordingStatus, setRecordingStatus] = useState("idle");
    const [duration, setDuration] = useState(0);
    const [audioPermission, setAudioPermission] = useState(null);
    const [intervalId, setIntervalId] = useState(null);

    useEffect(() => {
        async function getPermissions() {
            const { granted } = await Audio.requestPermissionsAsync();
            setAudioPermission(granted);
        }
        getPermissions();
    }, []);

    async function startRecording() {
        if (!audioPermission) {
            console.log("No permission to record audio");
            return;
        }
        if (recording) {
            console.log("Recording is already in progress.");
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
            // Reset duration to zero when starting a new recording
            setDuration(0);
            if (intervalId) {
                clearInterval(intervalId); // Clear previous interval
            }
            const id = trackDuration(newRecording);
            setIntervalId(id); // Store the new interval ID
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
                const fileName = `recording-${Date.now()}.aac`;
                // Load existing recordings
                const existingRecordings = JSON.parse(await AsyncStorage.getItem('recordings')) || [];
                const newRecordings = [...existingRecordings, { uri: recordingUri, name: fileName }];
                // Save updated recordings
                await AsyncStorage.setItem('recordings', JSON.stringify(newRecordings));
                setRecording(null);
                setRecordingStatus("stopped");
                setDuration(0); // Reset duration when stopping the recording
                if (intervalId) {
                    clearInterval(intervalId); // Clear the interval when stopping
                }
                navigation.navigate("Recordings");
            } catch (error) {
                console.error("Failed to stop recording", error);
            }
        }
    }

    function trackDuration(recording) {
        const interval = setInterval(async () => {
            const status = await recording.getStatusAsync();
            setDuration(status.durationMillis);
        }, 1000);
        return interval; // Return the interval ID
    }


    // Utility function to format duration in HH:MM:SS
    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <LinearGradient colors={['#0085F3', '#0054F4']} style={styles.recordingContainer}>
            <StatusBar backgroundColor={'#0085F3'} />
            <Text style={[{ marginTop: 50 }, styles.title]}>Audio Recording</Text>
            <Text style={styles.title}>Room</Text>
            {recordingStatus === "recording" ? (
                <View style={styles.audioTracking}>
                    <FontAwesome name="microphone" size={250} color="black" />
                    <Text style={styles.duration}>{formatDuration(duration)}</Text>
                </View>
            ) : (
                <View style={styles.audioTracking}>
                    <FontAwesome name="microphone-slash" size={250} color="gray" />
                    <Text style={styles.duration}>00:00:00</Text>
                </View>
            )}
            <View style={{ alignItems: 'center' }}>
                <TouchableOpacity style={styles.button} onPress={recording ? stopRecording : startRecording}>
                    <FontAwesome name={recording ? "stop-circle" : "circle"} size={64} color="white" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.navigateButton} onPress={() => navigation.navigate('Recordings')}>
                <Text style={styles.navigateButtonText}>View Recordings</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    recordingContainer: {
        flex: 1,
    },
    title: {
        fontSize: 40,
        fontWeight: "bold",
        alignSelf: "flex-start",
        marginLeft: 20,
        color: "#FFFFFF",
        paddingHorizontal: 10
    },
    audioTracking: {
        alignItems: "center",
        marginBottom: 20,
        marginTop: 100
    },
    duration: {
        fontSize: 20,
        marginTop: 20,
        color: "#FFFFFF", // Adjust text color for visibility
    },
    button: {
        backgroundColor: "red",
        padding: 13,
        marginBottom: 20,
        alignItems: "center",
        justifyContent: "center",
        width: 100,
        height: 100,
        borderRadius: 60,
    },
    navigateButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "white",
        borderRadius: 20,
        marginHorizontal: 20
    },
    navigateButtonText: {
        color: "#0054F4",
        fontSize: 20,
        textAlign: 'center'
    },
});