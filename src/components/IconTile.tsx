import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, shadow } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { Icon, IconName } from './Icon';

type IconTileSize = 'md' | 'lg';

type IconTileProps = {
  name: IconName;
  color: string;
  size?: IconTileSize;
  elevated?: boolean;
};

const TILE_SIZE: Record<IconTileSize, number> = {
  md: 40,
  lg: 44,
};

const ICON_SIZE: Record<IconTileSize, number> = {
  md: 20,
  lg: 22,
};

// Shared solid icon square used across action cards, stats, and empty states.
export function IconTile({ name, color, size = 'md', elevated = true }: IconTileProps) {
  const { colors } = useAppTheme();
  const dimension = TILE_SIZE[size];

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: color,
          width: dimension,
          height: dimension,
          borderRadius: radius.md,
        },
        elevated ? shadow('sm', colors) : null,
      ]}
    >
      <Icon name={name} size={ICON_SIZE[size]} color={colors.onAccent} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
