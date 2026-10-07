import { StyleSheet, Text, View } from "react-native";

export function BookingPayment() {
  return <View style={styles.notice}><Text style={styles.text}>Complete this payment in the WaveLens iPhone or Android app.</Text></View>;
}

const styles = StyleSheet.create({ notice: { backgroundColor: "rgba(245,184,65,.1)", borderRadius: 14, marginTop: 18, padding: 14 }, text: { color: "#ffd4a3", fontSize: 14 } });

