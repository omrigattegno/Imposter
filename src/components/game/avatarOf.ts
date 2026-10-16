/**
 * Avatar lookup for the in-round screens. Players carry `avatar` (an AvatarId) since the picker landed;
 * snapshots written before then have none, so a stable fallback is derived from the seat index and the
 * table never collapses onto one character.
 */
import { useCallback } from 'react';
import { AVATAR_IDS, isAvatarId, type AvatarId } from '../../avatars';
import { useGameState } from '../../game/store';
import type { Player } from '../../game/types';

export function avatarOf(player: Pick<Player, 'avatar'> | undefined, seat: number): AvatarId {
  if (player && isAvatarId(player.avatar)) return player.avatar;
  const n = AVATAR_IDS.length;
  return AVATAR_IDS[((seat % n) + n) % n];
}

/** `avatar(playerId)` for the current players (fallback by seat; an unknown id gets the first character). */
export function useAvatars(): (playerId: string) => AvatarId {
  const players = useGameState().players;
  return useCallback(
    (playerId: string) => {
      const seat = players.findIndex((p) => p.id === playerId);
      return avatarOf(seat >= 0 ? players[seat] : undefined, Math.max(0, seat));
    },
    [players],
  );
}
