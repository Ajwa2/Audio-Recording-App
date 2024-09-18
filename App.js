import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RecordingScreen from "./screens/RecordingScreen";
import RecordingsScreen from "./screens/RecordingsScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <GestureHandlerRootView style={{flex:1}}>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Recording" screenOptions={{headerShown:false}}>
                    <Stack.Screen name="Recording" component={RecordingScreen} />
                    <Stack.Screen name="Recordings" component={RecordingsScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
        
    );
}