import { supabase } from "@/lib/supabase";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type Message = { id: string; sender_id: string; body: string; created_at: string };

export default function BookingMessagesScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true); setErrorMessage("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setErrorMessage("Sign in to view this conversation."); setLoading(false); return; }
    setUserId(userData.user.id);
    const { data, error } = await supabase.from("booking_messages").select("id, sender_id, body, created_at").eq("booking_request_id", bookingId).order("created_at");
    if (error) setErrorMessage(error.message); else setMessages((data ?? []) as Message[]);
    setLoading(false);
  }, [bookingId]);

  useFocusEffect(useCallback(() => { void loadMessages(); }, [loadMessages]));

  async function sendMessage() {
    const nextBody = body.trim();
    if (!nextBody || !userId) return;
    setSending(true);
    const { error } = await supabase.from("booking_messages").insert({ booking_request_id: bookingId, sender_id: userId, body: nextBody });
    setSending(false);
    if (error) { Alert.alert("Could not send message", error.message); return; }
    setBody(""); void loadMessages();
  }

  return <View style={styles.screen}><StatusBar style="light" /><View style={styles.header}><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.eyebrow}>BOOKING CHAT</Text><Text style={styles.title}>Messages</Text><Text style={styles.subtitle}>Keep session details together and never share payment information.</Text></View><ScrollView contentContainerStyle={styles.messages}>{loading ? <ActivityIndicator color="#56d6c9" /> : errorMessage ? <Text style={styles.empty}>{errorMessage}</Text> : messages.length === 0 ? <Text style={styles.empty}>No messages yet. Start with the time, meeting point, or conditions you are hoping for.</Text> : messages.map((message) => <View key={message.id} style={[styles.bubble, message.sender_id === userId ? styles.mine : styles.theirs]}><Text selectable style={[styles.body, message.sender_id === userId && styles.mineBody]}>{message.body}</Text><Text style={[styles.time, message.sender_id === userId && styles.mineTime]}>{new Date(message.created_at).toLocaleString()}</Text></View>)}</ScrollView><View style={styles.composer}><TextInput accessibilityLabel="Message" multiline onChangeText={setBody} placeholder="Write a message..." placeholderTextColor="#698596" value={body} style={styles.input} /><Pressable accessibilityRole="button" disabled={sending || !body.trim()} onPress={() => void sendMessage()} style={[styles.send, (!body.trim() || sending) && styles.disabled]}><Text style={styles.sendText}>{sending ? "Sending" : "Send"}</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({ screen:{backgroundColor:"#061827",flex:1},header:{padding:20,paddingBottom:12},back:{alignSelf:"flex-start",justifyContent:"center",minHeight:44},backText:{color:"#d9e5ec",fontSize:16,fontWeight:"600"},eyebrow:{color:"#7ce0d6",fontSize:11,fontWeight:"900",letterSpacing:1.4,marginTop:10},title:{color:"#fff",fontSize:34,fontWeight:"900",marginTop:6},subtitle:{color:"#91a8b8",fontSize:14,lineHeight:20,marginTop:6},messages:{gap:10,padding:20,paddingTop:12},empty:{color:"#b9c9d6",fontSize:15,lineHeight:22,textAlign:"center",marginTop:50},bubble:{borderRadius:17,maxWidth:"84%",padding:13},mine:{alignSelf:"flex-end",backgroundColor:"#56d6c9"},theirs:{alignSelf:"flex-start",backgroundColor:"#163748"},body:{color:"#e8f1f5",fontSize:15,lineHeight:21},mineBody:{color:"#061827"},time:{color:"#91a8b8",fontSize:10,marginTop:7},mineTime:{color:"#295b60"},composer:{alignItems:"flex-end",borderTopColor:"rgba(255,255,255,.1)",borderTopWidth:1,flexDirection:"row",gap:10,padding:14},input:{backgroundColor:"rgba(255,255,255,.07)",borderColor:"rgba(255,255,255,.14)",borderRadius:16,borderWidth:1,color:"#fff",flex:1,maxHeight:120,minHeight:48,paddingHorizontal:14,paddingVertical:12},send:{alignItems:"center",backgroundColor:"#56d6c9",borderRadius:14,justifyContent:"center",minHeight:48,paddingHorizontal:17},sendText:{color:"#061827",fontWeight:"900"},disabled:{opacity:.5} });
