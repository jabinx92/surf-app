import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const services = ["Photography", "Video", "Drone"] as const;
type Service = (typeof services)[number];

export default function BecomeACreatorScreen() {
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [startingRate, setStartingRate] = useState("");
  const [bio, setBio] = useState("");
  const [travelMiles, setTravelMiles] = useState("20");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleService(service: Service) {
    setSelectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  }

  async function submitApplication() {
    const rate = Number(startingRate);
    const travel = Number(travelMiles);
    if (!displayName.trim() || !city.trim() || !portfolioUrl.trim()) {
      Alert.alert("Complete your profile", "Add your name, home area, and portfolio link.");
      return;
    }
    if (selectedServices.length === 0) {
      Alert.alert("Choose a service", "Select at least one way you shoot surf.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 1 || !Number.isInteger(rate)) {
      Alert.alert("Check your hourly rate", "Enter a whole-dollar hourly rate greater than zero.");
      return;
    }
    if (!Number.isFinite(travel) || travel < 0 || travel > 200 || !Number.isInteger(travel)) {
      Alert.alert("Check your travel range", "Enter a whole number from 0 to 200 miles.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        Alert.alert("Sign in first", "Create or sign in to a WaveLens account before applying.");
        router.replace("/sign-in");
        return;
      }

      const { error } = await supabase.from("creator_applications").insert({
        applicant_id: userData.user.id,
        display_name: displayName.trim(),
        city: city.trim(),
        services: selectedServices,
        portfolio_url: portfolioUrl.trim(),
        starting_rate: rate,
        bio: bio.trim(),
        travel_miles: travel,
      });

      if (error) {
        if (error.code === "23505") {
          router.replace("/creator-application-status");
          return;
        }
        throw error;
      }

      router.replace("/creator-application-status");
    } catch (error) {
      Alert.alert(
        "Could not send application",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <StatusBar style="light" />
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>CREATOR APPLICATION</Text>
      <Text style={styles.title}>Get booked for the sessions you shoot.</Text>
      <Text style={styles.subtitle}>
        Apply to offer surf photography, video, or drone coverage in your area.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. Alex Kim"
          placeholderTextColor="#718997"
          style={styles.input}
        />

        <Text style={styles.label}>Home area</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. San Francisco, CA"
          placeholderTextColor="#718997"
          style={styles.input}
        />

        <Text style={styles.label}>What do you shoot?</Text>
        <View style={styles.serviceRow}>
          {services.map((service) => {
            const selected = selectedServices.includes(service);
            return (
              <Pressable
                key={service}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => toggleService(service)}
                style={[styles.servicePill, selected && styles.servicePillSelected]}
              >
                <Text style={[styles.servicePillText, selected && styles.servicePillTextSelected]}>
                  {service}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Portfolio link</Text>
        <TextInput
          value={portfolioUrl}
          onChangeText={setPortfolioUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="Instagram, website, or reel"
          placeholderTextColor="#718997"
          style={styles.input}
        />

        <Text style={styles.label}>Starting hourly rate (USD)</Text>
        <TextInput
          value={startingRate}
          onChangeText={setStartingRate}
          keyboardType="number-pad"
          placeholder="e.g. 80"
          placeholderTextColor="#718997"
          style={styles.input}
        />

        <Text style={styles.label}>Short bio (optional)</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          maxLength={500}
          multiline
          placeholder="Tell surfers what and where you love to shoot."
          placeholderTextColor="#718997"
          textAlignVertical="top"
          style={[styles.input, styles.bioInput]}
        />

        <Text style={styles.label}>Travel range (miles)</Text>
        <TextInput
          value={travelMiles}
          onChangeText={setTravelMiles}
          keyboardType="number-pad"
          placeholder="e.g. 20"
          placeholderTextColor="#718997"
          style={styles.input}
        />

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => void submitApplication()}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Sending application..." : "Submit application"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { alignSelf: "center", backgroundColor: "#061827", flexGrow: 1, maxWidth: 680, padding: 20, paddingBottom: 48, width: "100%" },
  backButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingRight: 24 },
  backButtonText: { color: "#d9e5ec", fontSize: 16, fontWeight: "600" },
  eyebrow: { color: "#7ce0d6", fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 },
  title: { color: "#ffffff", fontSize: 36, fontWeight: "800", letterSpacing: -1.2, lineHeight: 42, marginTop: 10 },
  subtitle: { color: "#b9c9d6", fontSize: 16, lineHeight: 24, marginTop: 12 },
  form: { gap: 10, marginTop: 32 },
  label: { color: "#e8f2f5", fontSize: 14, fontWeight: "700", marginTop: 10 },
  input: { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 14, borderWidth: 1, color: "#ffffff", fontSize: 16, minHeight: 54, paddingHorizontal: 15 },
  bioInput: { minHeight: 112, paddingTop: 14 },
  serviceRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  servicePill: { borderColor: "rgba(255,255,255,0.2)", borderRadius: 999, borderWidth: 1, minHeight: 42, justifyContent: "center", paddingHorizontal: 14 },
  servicePillSelected: { backgroundColor: "#56d6c9", borderColor: "#56d6c9" },
  servicePillText: { color: "#d9e5ec", fontSize: 14, fontWeight: "700" },
  servicePillTextSelected: { color: "#061827" },
  submitButton: { alignItems: "center", backgroundColor: "#56d6c9", borderRadius: 16, justifyContent: "center", marginTop: 18, minHeight: 56, paddingHorizontal: 20 },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: "#061827", fontSize: 16, fontWeight: "800" },
});
