import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useAppStore } from '@/store/appStore';
import GlassCard from '@/components/glass/GlassCard';


const { width } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(width - 40, 340);
const CENTER = CANVAS_SIZE / 2;
const RADIUS = CANVAS_SIZE * 0.45;

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

const ZODIAC_ABBREVIATIONS = [
  'Koç', 'Boğ', 'İki', 'Yen', 'Asl', 'Baş', 'Ter', 'Akr', 'Yay', 'Oğl', 'Kov', 'Bal'
];

export default function ChartScreen() {
  const { computedChart } = useAppStore();

  const svgContent = useMemo(() => {
    if (!computedChart) return null;

    const { planets, houses, ascendant } = computedChart;

    // Helper: Convert polar coordinates to rectangular coordinates
    // We add 180 degrees to place the Ascendant (0 angle) at the left horizon (9 o'clock position / 180° in standard trig coords)
    const getCoordinates = (angleDegrees: number, radius: number) => {
      const adjustedAngle = angleDegrees - ascendant + 180;
      const angleRad = adjustedAngle * (Math.PI / 180);
      const x = CENTER + radius * Math.cos(angleRad);
      const y = CENTER + radius * Math.sin(angleRad);
      return { x, y };
    };

    // Draw houses lines
    const houseLines = houses.map((houseDegree, idx) => {
      const pInner = getCoordinates(houseDegree, RADIUS * 0.45);
      const pOuter = getCoordinates(houseDegree, RADIUS);
      return (
        <Line
          key={`house-${idx}`}
          x1={pInner.x}
          y1={pInner.y}
          x2={pOuter.x}
          y2={pOuter.y}
          stroke="rgba(214, 175, 55, 0.25)"
          strokeWidth={idx === 0 || idx === 9 ? "2" : "1"} // Highlight ASC (1st) and MC (10th)
        />
      );
    });

    // Draw zodiac segment separation lines (every 30 degrees starting from 0)
    const zodiacLines = [];
    for (let i = 0; i < 12; i++) {
      const deg = i * 30;
      const pInner = getCoordinates(deg, RADIUS * 0.82);
      const pOuter = getCoordinates(deg, RADIUS);
      zodiacLines.push(
        <Line
          key={`zodiac-line-${i}`}
          x1={pInner.x}
          y1={pInner.y}
          x2={pOuter.x}
          y2={pOuter.y}
          stroke="rgba(212, 175, 55, 0.4)"
          strokeWidth="1"
        />
      );
    }

    // Draw zodiac symbols/text in the middle of each segment (every 15 degrees offset)
    const zodiacSymbols = ZODIAC_ABBREVIATIONS.map((symbol, i) => {
      const midDeg = i * 30 + 15;
      const pos = getCoordinates(midDeg, RADIUS * 0.91);
      return (
        <SvgText
          key={`zodiac-symbol-${i}`}
          x={pos.x}
          y={pos.y + 4} // Slight vertical offset to center text
          fill="#D4AF37"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
        >
          {symbol}
        </SvgText>
      );
    });

    // Draw planet points
    const planetPoints = planets.map((p, idx) => {
      const symbol = PLANET_SYMBOLS[p.name] || '?';
      // Stagger radius slightly if planets are very close to avoid overlay overlap
      const radOffset = (idx % 2 === 0) ? 0.65 : 0.55;
      const pos = getCoordinates(p.longitude, RADIUS * radOffset);

      return (
        <G key={`planet-${idx}`}>
          <Circle
            cx={pos.x}
            cy={pos.y}
            r="4"
            fill="#D4AF37"
          />
          <SvgText
            x={pos.x}
            y={pos.y - 8}
            fill="#F0F6FC"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
          >
            {symbol}
          </SvgText>
        </G>
      );
    });

    return (
      <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
        {/* Outer boundary circles */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke="#D4AF37" strokeWidth="1.5" fill="transparent" />
        <Circle cx={CENTER} cy={CENTER} r={RADIUS * 0.82} stroke="rgba(212, 175, 55, 0.5)" strokeWidth="1" fill="transparent" />
        
        {/* Inner core circle */}
        <Circle cx={CENTER} cy={CENTER} r={RADIUS * 0.45} stroke="rgba(212, 175, 55, 0.5)" strokeWidth="1.5" fill="transparent" />

        {/* Division layers */}
        {zodiacLines}
        {houseLines}
        {zodiacSymbols}
        {planetPoints}
      </Svg>
    );
  }, [computedChart]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Göksel Harita</Text>
          <Text style={styles.subtitle}>Doğum Anınızdaki Gezegen Yerleşimleri</Text>
        </View>

        {computedChart ? (
          <View style={styles.chartContainer}>
            <View style={styles.wheelWrapper}>
              {svgContent}
            </View>

            <Text style={styles.tableTitle}>Gezegen Konumları</Text>
            
            <View style={styles.table}>
              {computedChart.planets.map((p, idx) => {
                const symbol = PLANET_SYMBOLS[p.name] || '•';
                return (
                  <GlassCard key={idx} style={styles.tableRow}>
                    <View style={styles.rowMain}>
                      <Text style={styles.planetSymbol}>{symbol}</Text>
                      <Text style={styles.planetName}>
                        {p.name === 'Sun' ? 'Güneş' :
                         p.name === 'Moon' ? 'Ay' :
                         p.name === 'Mercury' ? 'Merkür' :
                         p.name === 'Venus' ? 'Venüs' :
                         p.name === 'Mars' ? 'Mars' :
                         p.name === 'Jupiter' ? 'Jüpiter' :
                         p.name === 'Saturn' ? 'Satürn' :
                         p.name === 'Uranus' ? 'Uranüs' :
                         p.name === 'Neptune' ? 'Neptün' :
                         p.name === 'Pluto' ? 'Plüton' : p.name}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.planetSign}>{p.sign}</Text>
                      <Text style={styles.planetHouse}>{p.house}. Ev</Text>
                      {p.retrograde && <Text style={styles.retroBadge}>R</Text>}
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>
        ) : (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>
              Lütfen önce doğum haritanızı oluşturmak için profilinizi tamamlayın.
            </Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 26,
    color: '#D4AF37',
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#8B949E',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  wheelWrapper: {
    backgroundColor: 'rgba(22, 27, 34, 0.4)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    marginBottom: 24,
  },
  tableTitle: {
    fontFamily: 'Cinzel',
    fontSize: 18,
    color: '#F0F6FC',
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  table: {
    width: '100%',
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planetSymbol: {
    fontSize: 20,
    color: '#D4AF37',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  planetName: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#F0F6FC',
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planetSign: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E',
  },
  planetHouse: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#D4AF37',
    width: 45,
    textAlign: 'right',
  },
  retroBadge: {
    color: '#FF7B72',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 123, 114, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 114, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  errorCard: {
    padding: 24,
    marginTop: 40,
  },
  errorText: {
    color: '#FF7B72',
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter',
  },
});
