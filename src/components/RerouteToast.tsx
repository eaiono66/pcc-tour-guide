import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { toDisplayTime, type ScheduleStop } from '@/lib/routing';

interface RerouteToastProps {
  currentStop: ScheduleStop;
  remainingStops: ScheduleStop[];
  currentLocation: string;
  elapsedMinutes: number;
  scheduledMinutes: number;
  onReroute: (newSchedule: ScheduleStop[]) => void;
  onDismiss: () => void;
}

export default function RerouteToast({
  currentStop, remainingStops, currentLocation,
  elapsedMinutes, scheduledMinutes, onReroute, onDismiss,
}: RerouteToastProps) {
  const lateBy = Math.max(0, elapsedMinutes - scheduledMinutes);

  function handleReroute() {
    const rerouted = remainingStops.map(stop => {
      const timeMin = stop.timeMin + lateBy;
      return { ...stop, timeMin, time: toDisplayTime(timeMin) };
    });
    onReroute(rerouted);
  }

  return (
    <View style={styles.toast}>
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={8}>
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>

      <Text style={styles.message}>
        Running about {lateBy} min behind near {currentLocation} — want us to shift the rest of your day?
      </Text>

      <TouchableOpacity style={styles.rerouteBtn} onPress={handleReroute} activeOpacity={0.85}>
        <Text style={styles.rerouteBtnText}>Reroute Day</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 16,
    borderLeftWidth: 4, borderLeftColor: '#00D1C1',
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12,
    elevation: 8,
  },
  dismissBtn: {
    position: 'absolute', top: 6, right: 8,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  dismissText: { fontSize: 16, lineHeight: 18, color: '#94A3B8' },
  message: {
    fontFamily: 'DMMono', fontSize: 12, color: '#475569',
    lineHeight: 18, marginRight: 22, marginBottom: 12,
  },
  rerouteBtn: {
    width: '100%', backgroundColor: '#E8612A',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  rerouteBtnText: { fontFamily: 'BebasNeue', fontSize: 18, color: '#fff', letterSpacing: 0.5 },
});
