import { Text, View, StyleSheet } from 'react-native';

interface WalkIndicatorProps {
  fromVillage: string;
  toVillage: string;
  minutes: number;
}

export default function WalkIndicator({ fromVillage, toVillage, minutes }: WalkIndicatorProps) {
  if (minutes === 0 || fromVillage === toVillage) return null;

  return (
    <View style={styles.row}>
      <View style={styles.lineCol}>
        <View style={styles.dottedLine} />
        <Text style={styles.icon}>🚶</Text>
      </View>
      <Text style={styles.label}>{minutes} min walk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 28, flexDirection: 'row', alignItems: 'center' },
  lineCol: {
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  dottedLine: {
    position: 'absolute', top: 0, bottom: 0, left: '50%', marginLeft: -0.5,
    width: 1, borderLeftWidth: 1, borderLeftColor: '#00D1C1', borderStyle: 'dotted',
  },
  icon: { fontSize: 11, backgroundColor: '#fff' },
  label: { fontFamily: 'DMMono', fontSize: 9, color: '#888', marginLeft: 6 },
});
