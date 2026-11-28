import React from 'react';
import Svg, { Path, type SvgProps } from 'react-native-svg';
import { useThemeColor } from '@/hooks/useThemeColor';
import { wp } from '@/utils/responsive.utils';

export default function GoogleMark(props: SvgProps) {
  const colors = useThemeColor();
  return (
    <Svg
      width={wp('6%')}
      height={wp('6%')}
      viewBox="0 0 24 24"
      accessible={false}
      {...props}
    >
      <Path
        fill={colors.googleBlue}
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36z"
      />
      <Path
        fill={colors.googleGreen}
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z"
      />
      <Path
        fill={colors.googleYellow}
        d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02z"
      />
      <Path
        fill={colors.googleRed}
        d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96z"
      />
    </Svg>
  );
}
