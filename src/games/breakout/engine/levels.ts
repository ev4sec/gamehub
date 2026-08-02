/**
 * Authored layouts, one character per brick column.
 *
 * `.` is empty, `#` is an indestructible block, and a letter picks a tier from
 * `TIERS`. Written as strings so a level can be read and edited as a picture,
 * which is the only way anyone actually reasons about a brick wall.
 */
export interface Layout {
  name: string;
  rows: string[];
}

export const LEVELS: Layout[] = [
  {
    name: 'Opening',
    rows: [
      'aaaaaaaaaa',
      'aaaaaaaaaa',
      'bbbbbbbbbb',
      'bbbbbbbbbb',
    ],
  },
  {
    name: 'Chevron',
    rows: [
      '....cc....',
      '...cccc...',
      '..bbbbbb..',
      '.bbbbbbbb.',
      'aaaaaaaaaa',
    ],
  },
  {
    name: 'Gatehouse',
    rows: [
      'cc##..##cc',
      'cc##..##cc',
      'bbbbbbbbbb',
      '..b....b..',
      'aaaaaaaaaa',
      'aa......aa',
    ],
  },
  {
    name: 'Lattice',
    rows: [
      'd.d.d.d.d.',
      '.c.c.c.c.c',
      'd.d.d.d.d.',
      '.c.c.c.c.c',
      'bbbbbbbbbb',
      'a.a.a.a.a.',
    ],
  },
  {
    name: 'Keep',
    rows: [
      '#eeeeeeee#',
      '#dddddddd#',
      '#cc####cc#',
      '#cc####cc#',
      '#bbbbbbbb#',
      '#aaaaaaaa#',
      '..a....a..',
    ],
  },
];
