import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthForm from "@/components/AuthForm";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
});
