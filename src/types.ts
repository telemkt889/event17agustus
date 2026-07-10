/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserSession {
  brandName: string;
  memberId: string;
}

export type GameStatus = 'LOGIN' | 'PLAYING' | 'SUCCESS' | 'FAILED';

export interface GameHistory {
  [memberId: string]: {
    attemptsLeft: number;
    brandName: string;
  };
}
