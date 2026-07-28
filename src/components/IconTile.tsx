import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, shadow } from '../constants/theme';
import { Icon, IconName } from './Icon';

type IconTileSize = 'sm' | 'md' | 'lg';

type IconTileProps = {
  name: IconName;
  color: string;
  size?: IconTileSize;
  elevated?: boolean;
  iconSize?: number;
};

const TILE_SIZE: Record<IconTileSize, number> = {
  sm: 32,
  md: 40,
  lg: 44,
};

const ICON_SIZE: Record<IconTileSize, number> = {
  sm: 16,
  md: 20,
  lg: 22,
};

// Shared solid icon square used across action cards, stats, and empty states.
export function IconTile({
  name,
  color,
  size = 'md',
  elevated = true,
  iconSize,
}: IconTileProps) {
  const dimension = TILE_SIZE[size];

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: color,
          width: dimension,
          height: dimension,
          borderRadius: size === 'sm' ? radius.sm : radius.md,
        },
        elevated ? shadow('sm') : null,
      ]}
    >
      <Icon name={name} size={iconSize ?? ICON_SIZE[size]} color={colors.onAccent} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
