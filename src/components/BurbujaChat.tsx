import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  text: string;
  sender: 'user' | 'bot';
}

export default function BurbujaChat({ text, sender }: Props) {
  return (
    <View style={[styles.bubble, sender === 'user' ? styles.userBubble : styles.botBubble]}>
      <Text style={[styles.msgText, sender === 'user' ? styles.userText : styles.botText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#FF6B6B', borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#E0E0E0', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#FFF' },
  botText: { color: '#333' }
});
