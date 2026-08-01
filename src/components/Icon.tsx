import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useAppTheme } from '../hooks/useAppTheme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

// Thin wrapper so icons stay simple, solid, and consistently colored.
export function Icon({ name, size = 20, color }: IconProps) {
  const { colors } = useAppTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.text} />;
}
