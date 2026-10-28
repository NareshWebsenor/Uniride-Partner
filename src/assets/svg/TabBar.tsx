import { useThemeColor } from '@/hooks/useThemeColor';
import * as React from 'react';
import Svg, { SvgProps, G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

export const HomeIcon = (props: SvgProps) => {
  const colors = useThemeColor();
  return (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M11.25 15.75V9.75C11.25 9.55109 11.171 9.36032 11.0303 9.21967C10.8897 9.07902 10.6989 9 10.5 9H7.5C7.30109 9 7.11032 9.07902 6.96967 9.21967C6.82902 9.36032 6.75 9.55109 6.75 9.75V15.75"
      stroke={props.stroke || colors.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.25 7.49999C2.24995 7.28179 2.2975 7.06621 2.38934 6.86828C2.48118 6.67035 2.6151 6.49484 2.78175 6.35399L8.03175 1.85399C8.30249 1.62517 8.64552 1.49963 9 1.49963C9.35448 1.49963 9.69751 1.62517 9.96825 1.85399L15.2183 6.35399C15.3849 6.49484 15.5188 6.67035 15.6107 6.86828C15.7025 7.06621 15.7501 7.28179 15.75 7.49999V14.25C15.75 14.6478 15.592 15.0293 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0293 2.25 14.6478 2.25 14.25V7.49999Z"
      stroke={props.stroke || colors.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
  );
};
export const WalletIcon = (props: SvgProps) => {
  const colors = useThemeColor();
  return (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" {...props}>
    <G clipPath="url(#clip0_100_2189)">
      <Path
        d="M14.25 5.25V3C14.25 2.80109 14.171 2.61032 14.0303 2.46967C13.8897 2.32902 13.6989 2.25 13.5 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75C2.25 4.14782 2.40804 4.52936 2.68934 4.81066C2.97064 5.09196 3.35218 5.25 3.75 5.25H15C15.1989 5.25 15.3897 5.32902 15.5303 5.46967C15.671 5.61032 15.75 5.80109 15.75 6V9M15.75 9H13.5C13.1022 9 12.7206 9.15804 12.4393 9.43934C12.158 9.72064 12 10.1022 12 10.5C12 10.8978 12.158 11.2794 12.4393 11.5607C12.7206 11.842 13.1022 12 13.5 12H15.75C15.9489 12 16.1397 11.921 16.2803 11.7803C16.421 11.6397 16.5 11.4489 16.5 11.25V9.75C16.5 9.55109 16.421 9.36032 16.2803 9.21967C16.1397 9.07902 15.9489 9 15.75 9Z"
        stroke={props.stroke || colors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H15C15.1989 15.75 15.3897 15.671 15.5303 15.5303C15.671 15.3897 15.75 15.1989 15.75 15V12"
        stroke={props.stroke || colors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_100_2189">
        <Rect width={18} height={18} fill={colors.textPrimary} />
      </ClipPath>
    </Defs>
  </Svg>
  );
};
export const InvestIcon = (props: SvgProps) => {
  const colors = useThemeColor();
  return (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" {...props}>
    <G clipPath="url(#clip0_100_1957)">
      <Path
        d="M10.3081 13.302C10.0829 14.0465 9.66866 14.7198 9.10571 15.2565C8.54276 15.7931 7.85033 16.1747 7.09597 16.364C6.3416 16.5533 5.55106 16.5438 4.80143 16.3366C4.05181 16.1293 3.36871 15.7313 2.81875 15.1813C2.2688 14.6313 1.87077 13.9482 1.66349 13.1986C1.45621 12.449 1.44676 11.6585 1.63605 10.9041C1.82534 10.1497 2.20692 9.45729 2.74357 8.89435C3.28021 8.3314 3.9536 7.91715 4.69806 7.692M11.2501 4.5H12.0001V7.5"
        stroke={props.stroke || colors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.60059 11.076L5.25009 10.701L6.75009 13.2991"
        stroke={props.stroke || colors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 10.5C14.4853 10.5 16.5 8.48528 16.5 6C16.5 3.51472 14.4853 1.5 12 1.5C9.51472 1.5 7.5 3.51472 7.5 6C7.5 8.48528 9.51472 10.5 12 10.5Z"
        stroke={props.stroke || colors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_100_1957">
        <Rect width={18} height={18} fill={colors.textPrimary} />
      </ClipPath>
    </Defs>
  </Svg>
  );
};

export const RewardIcon = (props: SvgProps) => {
  const colors = useThemeColor();
  return (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M9 5.24996V15.75M9 5.24996C8.72871 4.13201 8.26159 3.17626 7.65955 2.50733C7.05752 1.83841 6.34851 1.48736 5.625 1.49996C5.12772 1.49996 4.65081 1.69751 4.29917 2.04914C3.94754 2.40077 3.75 2.87768 3.75 3.37496C3.75 3.87224 3.94754 4.34916 4.29917 4.70079C4.65081 5.05242 5.12772 5.24996 5.625 5.24996M9 5.24996C9.27129 4.13201 9.73841 3.17626 10.3404 2.50733C10.9425 1.83841 11.6515 1.48736 12.375 1.49996C12.8723 1.49996 13.3492 1.69751 13.7008 2.04914C14.0525 2.40077 14.25 2.87768 14.25 3.37496C14.25 3.87224 14.0525 4.34916 13.7008 4.70079C13.3492 5.05242 12.8723 5.24996 12.375 5.24996M15 8.24996V14.25C15 14.6478 14.842 15.0293 14.5607 15.3106C14.2794 15.5919 13.8978 15.75 13.5 15.75H4.5C4.10218 15.75 3.72064 15.5919 3.43934 15.3106C3.15804 15.0293 3 14.6478 3 14.25V8.24996"
      stroke={props.stroke || colors.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 5.25H3C2.58579 5.25 2.25 5.58579 2.25 6V7.5C2.25 7.91421 2.58579 8.25 3 8.25H15C15.4142 8.25 15.75 7.91421 15.75 7.5V6C15.75 5.58579 15.4142 5.25 15 5.25Z"
      stroke={props.stroke || colors.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
  );
};
export const ProfileIcon = (props: SvgProps) => {
  const colors = useThemeColor();
  return (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M14.25 15.75V14.25C14.25 13.4544 13.9339 12.6913 13.3713 12.1287C12.8087 11.5661 12.0456 11.25 11.25 11.25H6.75C5.95435 11.25 5.19129 11.5661 4.62868 12.1287C4.06607 12.6913 3.75 13.4544 3.75 14.25V15.75"
      stroke={props.stroke || colors.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 8.25C10.6569 8.25 12 6.90685 12 5.25C12 3.59315 10.6569 2.25 9 2.25C7.34315 2.25 6 3.59315 6 5.25C6 6.90685 7.34315 8.25 9 8.25Z"
      stroke={props.stroke || colors.textSecondary}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
  );
};
