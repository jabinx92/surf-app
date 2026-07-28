import { surfSpots } from "@/data/surf-spots";
import { supabase } from "@/lib/supabase";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const days = [
  { value: 1, short: "M", name: "Monday" },
  { value: 2, short: "T", name: "Tuesday" },
  { value: 3, short: "W", name: "Wednesday" },
  { value: 4, short: "Th", name: "Thursday" },
  { value: 5, short: "F", name: "Friday" },
  { value: 6, short: "Sa", name: "Saturday" },
  { value: 7, short: "Su", name: "Sunday" },
] as const;

type Slot = { id: string; weekday: number; start_time: string; end_time: string; surf_spot: string };
type DaySchedule = { enabled: boolean; start: string; end: string };
type Schedule = Record<number, DaySchedule>;

function emptySchedule(): Schedule {
  return Object.fromEntries(days.map(day => [day.value, { enabled: false, start: "09:00", end: "17:00" }])) as Schedule;
}

export default function AvailabilityScreen() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [existingSlots, setExistingSlots] = useState<Slot[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(emptySchedule);
  const [spot, setSpot] = useState(surfSpots[0]?.name ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setMessage("Sign in to manage availability."); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase.from("creator_profiles").select("id").eq("owner_id", user.user.id).maybeSingle();
    if (profileError) { setMessage(profileError.message); setLoading(false); return; }
    if (!profile) { setMessage("Your creator profile must be approved first."); setLoading(false); return; }
    setProfileId(profile.id);
    const { data, error } = await supabase.from("creator_weekly_availability").select("id, weekday, start_time, end_time, surf_spot").eq("creator_profile_id", profile.id).order("weekday").order("start_time");
    if (error) { setMessage(error.message); setLoading(false); return; }
    const slots = (data ?? []) as Slot[];
    setExistingSlots(slots);
    const next = emptySchedule();
    for (const day of days) {
      const slot = slots.find(item => item.weekday === day.value);
      if (slot) next[day.value] = { enabled: true, start: slot.start_time.slice(0, 5), end: slot.end_time.slice(0, 5) };
    }
    setSchedule(next);
    const firstSpot = slots.find(slot => slot.surf_spot)?.surf_spot;
    if (firstSpot) setSpot(firstSpot);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function updateDay(day: number, changes: Partial<DaySchedule>) {
    setSchedule(current => ({ ...current, [day]: { ...current[day], ...changes } }));
  }

  function setPreset(preset: "weekdays" | "weekends" | "everyday") {
    setSchedule(current => Object.fromEntries(days.map(day => [day.value, { ...current[day.value], enabled: preset === "everyday" || (preset === "weekdays" ? day.value <= 5 : day.value >= 6) }])) as Schedule);
  }

  async function saveSchedule() {
    if (!profileId) return;
    const enabledDays = days.filter(day => schedule[day.value].enabled);
    for (const day of enabledDays) {
      const entry = schedule[day.value];
      if (!/^\d{2}:\d{2}$/.test(entry.start) || !/^\d{2}:\d{2}$/.test(entry.end) || entry.end <= entry.start) {
        Alert.alert(`Check ${day.name}`, "Use HH:MM and make sure the end time is later than the start time.");
        return;
      }
    }

    setSaving(true);
    try {
      for (const day of days) {
        const entry = schedule[day.value];
        const current = existingSlots.filter(slot => slot.weekday === day.value);
        if (!entry.enabled) {
          if (current.length) {
            const { error } = await supabase.from("creator_weekly_availability").delete().in("id", current.map(slot => slot.id));
            if (error) throw error;
          }
          continue;
        }

        if (current[0]) {
          if (current.length > 1) {
            const { error: cleanupError } = await supabase.from("creator_weekly_availability").delete().in("id", current.slice(1).map(slot => slot.id));
            if (cleanupError) throw cleanupError;
          }
          const { error } = await supabase.from("creator_weekly_availability").update({ start_time: entry.start, end_time: entry.end, surf_spot: spot.trim() }).eq("id", current[0].id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("creator_weekly_availability").insert({ creator_profile_id: profileId, weekday: day.value, start_time: entry.start, end_time: entry.end, surf_spot: spot.trim() });
          if (error) throw error;
        }
      }
      Alert.alert("Schedule saved", "Your weekly availability is now visible to surfers.");
      void load();
    } catch (error) {
      Alert.alert("Could not save schedule", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const enabledCount = days.filter(day => schedule[day.value].enabled).length;

  return <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled"><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.eyebrow}>CREATOR DASHBOARD</Text><Text style={styles.title}>Weekly availability</Text><Text style={styles.subtitle}>Turn on the days you usually shoot and set different hours for each one.</Text>{loading ? <View style={styles.state}><ActivityIndicator color="#56d6c9" /></View> : message ? <View style={styles.state}><Text style={styles.stateText}>{message}</Text></View> : <><View style={styles.presets}><Pressable onPress={() => setPreset("weekdays")} style={styles.preset}><Text style={styles.presetText}>Weekdays</Text></Pressable><Pressable onPress={() => setPreset("weekends")} style={styles.preset}><Text style={styles.presetText}>Weekends</Text></Pressable><Pressable onPress={() => setPreset("everyday")} style={styles.preset}><Text style={styles.presetText}>Every day</Text></Pressable></View><View style={styles.week}>{days.map(day => { const entry = schedule[day.value]; return <View key={day.value} style={[styles.dayRow, entry.enabled && styles.dayRowEnabled]}><Pressable accessibilityLabel={`${day.name} availability`} accessibilityRole="switch" accessibilityState={{ checked: entry.enabled }} onPress={() => updateDay(day.value, { enabled: !entry.enabled })} style={[styles.dayToggle, entry.enabled && styles.dayToggleEnabled]}><Text style={[styles.dayShort, entry.enabled && styles.dayShortEnabled]}>{day.short}</Text></Pressable><View style={styles.dayNameWrap}><Text style={styles.dayName}>{day.name}</Text><Text style={styles.dayState}>{entry.enabled ? "Available" : "Unavailable"}</Text></View>{entry.enabled ? <View style={styles.times}><TextInput accessibilityLabel={`${day.name} start time`} value={entry.start} onChangeText={start => updateDay(day.value, { start })} placeholder="09:00" placeholderTextColor="#698596" style={styles.timeInput}/><Text style={styles.to}>to</Text><TextInput accessibilityLabel={`${day.name} end time`} value={entry.end} onChangeText={end => updateDay(day.value, { end })} placeholder="17:00" placeholderTextColor="#698596" style={styles.timeInput}/></View> : null}</View>; })}</View><Text style={styles.label}>USUAL SURF SPOT</Text><TextInput accessibilityLabel="Surf spot" value={spot} onChangeText={setSpot} placeholder="Any nearby break" placeholderTextColor="#698596" style={styles.spotInput}/><Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveSchedule()} style={[styles.save, saving && styles.disabled]}><Text style={styles.saveText}>{saving ? "Saving schedule..." : `Save weekly schedule · ${enabledCount} ${enabledCount === 1 ? "day" : "days"}`}</Text></Pressable></>}</ScrollView>;
}

const styles = StyleSheet.create({ screen:{alignSelf:"center",backgroundColor:"#061827",flexGrow:1,maxWidth:760,padding:20,paddingBottom:50,width:"100%"},back:{alignSelf:"flex-start",justifyContent:"center",minHeight:44},backText:{color:"#d9e5ec",fontSize:16},eyebrow:{color:"#7ce0d6",fontSize:12,fontWeight:"800",letterSpacing:1.5,marginTop:16},title:{color:"#fff",fontSize:38,fontWeight:"900",marginTop:10},subtitle:{color:"#b9c9d6",fontSize:16,lineHeight:23,marginTop:10},state:{alignItems:"center",paddingTop:90},stateText:{color:"#b9c9d6",fontSize:16,textAlign:"center"},presets:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:28},preset:{borderColor:"rgba(86,214,201,.35)",borderRadius:999,borderWidth:1,paddingHorizontal:14,paddingVertical:9},presetText:{color:"#7ce0d6",fontSize:13,fontWeight:"800"},week:{gap:9,marginTop:18},dayRow:{alignItems:"center",backgroundColor:"rgba(255,255,255,.035)",borderColor:"rgba(255,255,255,.1)",borderRadius:17,borderWidth:1,flexDirection:"row",flexWrap:"wrap",gap:12,minHeight:72,padding:12},dayRowEnabled:{backgroundColor:"rgba(86,214,201,.055)",borderColor:"rgba(86,214,201,.2)"},dayToggle:{alignItems:"center",borderColor:"rgba(255,255,255,.2)",borderRadius:21,borderWidth:1,height:42,justifyContent:"center",width:42},dayToggleEnabled:{backgroundColor:"#56d6c9",borderColor:"#56d6c9"},dayShort:{color:"#91a8b8",fontSize:12,fontWeight:"900"},dayShortEnabled:{color:"#061827"},dayNameWrap:{flexBasis:108,flexGrow:1},dayName:{color:"#fff",fontSize:15,fontWeight:"900"},dayState:{color:"#698596",fontSize:11,marginTop:3},times:{alignItems:"center",flexDirection:"row",gap:7},timeInput:{backgroundColor:"rgba(255,255,255,.07)",borderColor:"rgba(255,255,255,.13)",borderRadius:11,borderWidth:1,color:"#fff",fontSize:14,minHeight:42,paddingHorizontal:10,width:72},to:{color:"#698596",fontSize:12},label:{color:"#91a8b8",fontSize:11,fontWeight:"900",letterSpacing:1.1,marginTop:26},spotInput:{backgroundColor:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.14)",borderRadius:14,borderWidth:1,color:"#fff",fontSize:16,minHeight:52,marginTop:10,paddingHorizontal:15},save:{alignItems:"center",backgroundColor:"#56d6c9",borderRadius:16,justifyContent:"center",marginTop:22,minHeight:56},disabled:{opacity:.6},saveText:{color:"#061827",fontSize:15,fontWeight:"900"} });
