import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { colors } from '../constants/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

// Thin wrapper so icons stay simple, solid, and consistently colored.
export function Icon({ name, size = 20, color = colors.text }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
