import React from 'react';
import { EmptyState } from '@/components/ui/Feedback';

type Props = {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onPress?: () => void;
};
export default function EmptyListComponent({
  title,
  subtitle,
  buttonText,
  onPress,
}: Props) {
  return (
    <EmptyState
      title={title}
      message={subtitle}
      actionLabel={buttonText}
      onAction={onPress}
    />
  );
}
