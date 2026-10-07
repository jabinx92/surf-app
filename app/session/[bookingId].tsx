import FeedbackPressable from "@/components/feedback-pressable";
import { supabase } from "@/lib/supabase";
import { formatSessionDate, formatSessionTime } from "@/utils/session-time";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BookingPayment } from "../../components/booking-payment";

type Status = "pending" | "accepted" | "declined" | "cancelled" | "completed";
type PaymentStatus = "unpaid" | "processing" | "paid" | "failed" | "refunded";
type Booking = { id:string; customer_id:string; creator_profile_id:string; creator_display_name:string|null; service_type:string; session_date:string; session_start_time:string|null; session_hours:number; surf_spot:string; notes:string; contact_details:string; status:Status; amount_cents:number|null; payment_status:PaymentStatus; creator_profiles:{starting_rate:number}|{starting_rate:number}[]|null };

export default function SessionDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId:string }>();
  const [booking,setBooking]=useState<Booking|null>(null);
  const [isCreator,setIsCreator]=useState(false);
  const [loading,setLoading]=useState(true);
  const [updating,setUpdating]=useState(false);
  const [message,setMessage]=useState("");

  const load=useCallback(async()=>{
    if(!bookingId){setMessage("This session link is incomplete.");setLoading(false);return;}
    setLoading(true);setMessage("");
    try{
      const {data:userData,error:userError}=await supabase.auth.getUser();
      if(userError||!userData.user)throw new Error("Sign in to view this session.");
      const {data,error}=await supabase.from("booking_requests").select("id, customer_id, creator_profile_id, creator_display_name, service_type, session_date, session_start_time, session_hours, surf_spot, notes, contact_details, status, amount_cents, payment_status, creator_profiles(starting_rate)").eq("id",bookingId).single();
      if(error)throw error;
      const next=data as Booking;setBooking(next);
      if(next.customer_id===userData.user.id){setIsCreator(false);}else{
        const {data:profile,error:profileError}=await supabase.from("creator_profiles").select("id").eq("id",next.creator_profile_id).eq("owner_id",userData.user.id).maybeSingle();
        if(profileError)throw profileError;setIsCreator(Boolean(profile));
      }
    }catch(error){setBooking(null);setMessage(error instanceof Error?error.message:"Could not load this session.");}
    finally{setLoading(false);}
  },[bookingId]);
  useFocusEffect(useCallback(()=>{void load();},[load]));

  async function updateStatus(status:"accepted"|"declined"|"cancelled"){
    if(!booking||updating)return;setUpdating(true);setMessage("");
    const {data,error}=await supabase.from("booking_requests").update({status}).eq("id",booking.id).select("status").single();
    if(error)setMessage(`Could not update this session: ${error.message}`);
    else{
      setBooking(current=>current?{...current,status:data.status as Status}:current);
      setMessage(status==="cancelled"?"Booking cancelled.":`Booking ${status}.`);
      if(status==="accepted"){
        const {error:pushError}=await supabase.functions.invoke("send-booking-accepted-push",{body:{bookingId:booking.id}});
        if(pushError)console.warn("Could not send booking acceptance push",pushError.message);
      }
    }
    setUpdating(false);
  }
  function cancel(){Alert.alert("Cancel this booking?","The creator will be notified that this session was cancelled.",[{text:"Keep booking",style:"cancel"},{text:"Cancel booking",style:"destructive",onPress:()=>void updateStatus("cancelled")}]);}

  return <ScrollView contentContainerStyle={styles.screen} contentInsetAdjustmentBehavior="automatic">
    <Pressable accessibilityRole="button" onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable>
    <Text style={styles.eyebrow}>SESSION DETAILS</Text><Text style={styles.title}>Your session</Text>
    {loading?<View style={styles.state}><ActivityIndicator color="#56d6c9"/></View>:!booking?<View style={styles.state}><Text selectable style={styles.error}>{message}</Text></View>:<>
      <View style={styles.heading}><Text style={styles.creator}>With {booking.creator_display_name??"your creator"}</Text><View style={[styles.status,booking.status==="accepted"||booking.status==="completed"?styles.good:booking.status==="pending"?styles.waiting:styles.bad]}><Text style={styles.statusText}>{booking.status}</Text></View></View>
      <View style={styles.card}><Detail label="WHEN" value={`${formatSessionDate(booking.session_date)} at ${formatSessionTime(booking.session_start_time)}`}/><Detail label="SURF SPOT" value={booking.surf_spot}/><Detail label="SESSION" value={`${booking.service_type} · ${booking.session_hours} ${booking.session_hours===1?"hour":"hours"}`}/><Detail label="PAYMENT" value={paymentLabel(booking)}/>{booking.notes?<Detail label="NOTES" value={booking.notes}/>:null}{isCreator?<Detail label="CUSTOMER CONTACT" value={booking.contact_details}/>:null}</View>
      {message?<View style={styles.message}><Text selectable style={styles.messageText}>{message}</Text></View>:null}
      {isCreator&&booking.status==="pending"?<View style={styles.actions}><FeedbackPressable disabled={updating} haptic="none" onPress={()=>void updateStatus("declined")} style={styles.decline} wrapperStyle={styles.flex}><Text style={styles.declineText}>Decline</Text></FeedbackPressable><FeedbackPressable disabled={updating} haptic="none" onPress={()=>void updateStatus("accepted")} style={styles.accept} wrapperStyle={styles.flex}><Text style={styles.acceptText}>{updating?"Updating…":"Accept booking"}</Text></FeedbackPressable></View>:null}
      {!isCreator&&booking.status==="accepted"&&booking.payment_status!=="paid"?<BookingPayment bookingId={booking.id} estimatedAmountCents={estimatedAmount(booking)} onSubmitted={()=>void load()}/>:null}
      {!isCreator&&(booking.status==="pending"||booking.status==="accepted")&&booking.payment_status!=="paid"?<Pressable disabled={updating} onPress={cancel} style={styles.cancel}><Text style={styles.cancelText}>{updating?"Cancelling…":"Cancel booking"}</Text></Pressable>:null}
      <View style={styles.tools}><Pressable onPress={()=>router.push({pathname:"/messages/[bookingId]",params:{bookingId:booking.id}})} style={styles.tool}><Text style={styles.toolText}>Messages</Text></Pressable><Pressable onPress={()=>router.push({pathname:"/gallery/[bookingId]",params:{bookingId:booking.id}})} style={styles.tool}><Text style={styles.toolText}>Delivery gallery</Text></Pressable></View>
    </>}
  </ScrollView>;
}
function Detail({label,value}:{label:string;value:string}){return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text selectable style={styles.value}>{value}</Text></View>}
function estimatedAmount(booking:Booking){const creator=Array.isArray(booking.creator_profiles)?booking.creator_profiles[0]:booking.creator_profiles;return booking.amount_cents??Math.round((creator?.starting_rate??0)*booking.session_hours*100)}
function paymentLabel(booking:Booking){const amount=estimatedAmount(booking);const total=amount?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(amount/100):"Price unavailable";return `${total} · ${booking.payment_status}`}
const styles=StyleSheet.create({screen:{backgroundColor:"#061827",flexGrow:1,padding:20,paddingBottom:44},back:{alignSelf:"flex-start",justifyContent:"center",minHeight:44},backText:{color:"#d9e5ec",fontSize:16,fontWeight:"600"},eyebrow:{color:"#7ce0d6",fontSize:12,fontWeight:"900",letterSpacing:1.5,marginTop:16},title:{color:"#fff",fontSize:38,fontWeight:"900",marginTop:10},state:{alignItems:"center",paddingTop:90},error:{color:"#ffc0c0",fontSize:16,textAlign:"center"},heading:{alignItems:"center",flexDirection:"row",gap:12,justifyContent:"space-between",marginTop:28},creator:{color:"#fff",flex:1,fontSize:21,fontWeight:"900"},status:{borderRadius:999,paddingHorizontal:11,paddingVertical:7},good:{backgroundColor:"rgba(86,214,201,.16)"},waiting:{backgroundColor:"rgba(245,184,65,.18)"},bad:{backgroundColor:"rgba(240,112,112,.16)"},statusText:{color:"#fff",fontSize:11,fontWeight:"900",textTransform:"capitalize"},card:{backgroundColor:"rgba(255,255,255,.06)",borderColor:"rgba(255,255,255,.13)",borderRadius:18,borderWidth:1,gap:18,marginTop:16,padding:18},detail:{gap:6},label:{color:"#7ce0d6",fontSize:11,fontWeight:"900",letterSpacing:1.2},value:{color:"#d9e5ec",fontSize:16,lineHeight:23},message:{backgroundColor:"rgba(86,214,201,.1)",borderRadius:14,marginTop:16,padding:14},messageText:{color:"#bff8f1"},actions:{flexDirection:"row",gap:10,marginTop:18},flex:{flex:1},decline:{alignItems:"center",borderColor:"rgba(255,255,255,.25)",borderRadius:13,borderWidth:1,justifyContent:"center",minHeight:50},declineText:{color:"#fff",fontWeight:"800"},accept:{alignItems:"center",backgroundColor:"#56d6c9",borderRadius:13,justifyContent:"center",minHeight:50},acceptText:{color:"#061827",fontWeight:"900"},cancel:{alignItems:"center",borderColor:"rgba(240,112,112,.55)",borderRadius:13,borderWidth:1,marginTop:18,paddingVertical:15},cancelText:{color:"#ffaaaa",fontWeight:"900"},tools:{borderTopColor:"rgba(255,255,255,.1)",borderTopWidth:1,flexDirection:"row",gap:10,marginTop:20,paddingTop:18},tool:{backgroundColor:"#1d4259",borderRadius:12,paddingHorizontal:15,paddingVertical:12},toolText:{color:"#fff",fontWeight:"800"}});
