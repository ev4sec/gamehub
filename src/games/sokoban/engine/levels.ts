import type { Level } from './types';

/**
 * Authored levels, in Sokoban's usual notation so they can be read as
 * pictures. Deliberately small: the engine suite runs a breadth-first solver
 * over every one of them, so an unsolvable level fails the build rather than
 * being discovered by a player who cannot finish it.
 */
export const LEVELS: Level[] = [
  {
    name: 'First push',
    rows: [
      '#######',
      '# @$. #',
      '#######',
    ],
  },
  {
    name: 'Round the back',
    rows: [
      '#######',
      '#.    #',
      '#  $  #',
      '#  @  #',
      '#     #',
      '#######',
    ],
  },
  {
    name: 'Two of them',
    rows: [
      '########',
      '#  .   #',
      '#  $   #',
      '#@ $ . #',
      '#      #',
      '########',
    ],
  },
  {
    name: 'The corridor',
    rows: [
      '########',
      '#      #',
      '# #### #',
      '# $  . #',
      '# @ #  #',
      '#   #  #',
      '########',
    ],
  },
  {
    name: 'Threefold',
    rows: [
      '#########',
      '#   .   #',
      '# $ $ $ #',
      '#   @   #',
      '# .   . #',
      '#       #',
      '#########',
    ],
  },
  {
    name: 'Tight quarters',
    rows: [
      '########',
      '#   ...#',
      '#      #',
      '# $$$  #',
      '#  @   #',
      '#      #',
      '########',
    ],
  },
];
