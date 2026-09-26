import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Text, TextInput, fonts } from './ui';

const family = element => StyleSheet.flatten(element.props.style).fontFamily;

test('text weights map to the matching SF Pro Display file', async () => {
  await render(<>
    <Text>Regular</Text>
    <Text style={{ fontWeight: '600' }}>Medium</Text>
    <Text style={{ fontWeight: '700' }}>Bold</Text>
    <Text style={{ fontWeight: '800' }}>Heavy</Text>
    <Text style={{ fontWeight: '900' }}>Black</Text>
    <Text style={{ fontWeight: 'bold' }}>Keyword bold <Text>nested inherits</Text></Text>
    <TextInput accessibilityLabel="Field" />
  </>);
  expect(family(screen.getByText('Regular'))).toBe(fonts.regular);
  expect(family(screen.getByText('Medium'))).toBe(fonts.medium);
  expect(family(screen.getByText('Bold'))).toBe(fonts.bold);
  expect(family(screen.getByText('Heavy'))).toBe(fonts.heavy);
  expect(family(screen.getByText('Black'))).toBe(fonts.black);
  expect(family(screen.getByText('nested inherits'))).toBe(fonts.bold);
  expect(family(screen.getByLabelText('Field'))).toBe(fonts.regular);
});
