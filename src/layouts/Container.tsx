import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { wp } from '@/utils/responsive.utils';

export function Container({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.container, style]} />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: wp('4%'),
    gap: wp('4%'),
  },
});
