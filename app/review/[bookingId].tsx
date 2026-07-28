import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function ReviewScreen() {
  const { bookingId, creatorId } = useLocalSearchParams<{ bookingId: string; creatorId: string }>();
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [submitting, setSubmitting] = useState(false);
  async function submit() {
    setSubmitting(true);
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from("creator_reviews").insert({ booking_request_id: bookingId, creator_profile_id: creatorId, reviewer_id: data.user?.id, rating, comment: comment.trim() });
    setSubmitting(false);
    if (error) { Alert.alert("Could not submit review", error.message); return; }
    Alert.alert("Review submitted", "Thanks for helping surfers choose confidently.", [{ text: "Done", onPress: () => router.replace("/requests") }]);
  }
  return <ScrollView contentContainerStyle={styles.screen}><StatusBar style="light" /><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.eyebrow}>SESSION COMPLETE</Text><Text style={styles.title}>Rate your creator</Text><Text style={styles.subtitle}>Your review will appear publicly on their profile.</Text><View style={styles.stars}>{[1,2,3,4,5].map(value => <Pressable accessibilityLabel={`${value} stars`} accessibilityRole="button" key={value} onPress={() => setRating(value)}><Text style={[styles.star, value <= rating && styles.starOn]}>★</Text></Pressable>)}</View><Text style={styles.label}>SHARE YOUR EXPERIENCE</Text><TextInput accessibilityLabel="Review comment" multiline maxLength={1000} onChangeText={setComment} placeholder="What should other surfers know?" placeholderTextColor="#698596" value={comment} style={styles.input}/><Pressable disabled={submitting} onPress={() => void submit()} style={styles.submit}><Text style={styles.submitText}>{submitting ? "Submitting..." : "Submit review"}</Text></Pressable></ScrollView>;
}
const styles=StyleSheet.create({screen:{backgroundColor:"#061827",flexGrow:1,padding:20,paddingBottom:44},back:{alignSelf:"flex-start",justifyContent:"center",minHeight:44},backText:{color:"#d9e5ec",fontSize:16,fontWeight:"600"},eyebrow:{color:"#7ce0d6",fontSize:12,fontWeight:"900",letterSpacing:1.4,marginTop:28},title:{color:"#fff",fontSize:38,fontWeight:"900",marginTop:8},subtitle:{color:"#b9c9d6",fontSize:16,marginTop:8},stars:{flexDirection:"row",gap:8,marginTop:34},star:{color:"#34505f",fontSize:42},starOn:{color:"#f5b841"},label:{color:"#91a8b8",fontSize:11,fontWeight:"900",letterSpacing:1.1,marginTop:32},input:{backgroundColor:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.14)",borderRadius:16,borderWidth:1,color:"#fff",fontSize:16,minHeight:140,marginTop:12,padding:16,textAlignVertical:"top"},submit:{alignItems:"center",backgroundColor:"#56d6c9",borderRadius:17,justifyContent:"center",marginTop:24,minHeight:56},submitText:{color:"#061827",fontSize:16,fontWeight:"900"}});
