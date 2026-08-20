import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface MarkdownTextProps {
  children: string | null | undefined;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
}

// AI-generated reports and interpretation copy use "**kalın**" markdown for
// emphasis, but the app never had a renderer for it — the literal asterisks
// were showing up on screen (e.g. "**Element Dengesi:**"). This splits on
// **...** pairs and renders each bold segment as a styled <Text>, with a
// sensible default (inherits color, adds weight) so callers don't need to
// pass boldStyle unless they want a different look (e.g. gold headings).
export default function MarkdownText({ children, style, boldStyle }: MarkdownTextProps) {
  const text = children ?? '';
  if (!text.includes('**')) {
    return <Text style={style}>{text}</Text>;
  }

  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const match = part.match(/^\*\*([^*]+)\*\*$/);
        if (match) {
          return (
            <Text key={i} style={[{ fontWeight: '700' }, boldStyle]}>
              {match[1]}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}
