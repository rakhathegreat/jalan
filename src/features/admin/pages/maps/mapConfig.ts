import maplibregl from 'maplibre-gl';

export const MAP_CENTER: [number, number] = [108.5325038591979, -7.369617983909407];
export const MAPTILER_KEY = 'a7j0hgsQIyRNxPavCq8I';
export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`;
export const TERRAIN_SOURCE_URL = `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${MAPTILER_KEY}`;
export const TERRAIN_SOURCE_ID = 'jalan-terrain';
export const SKY_LAYER_ID = 'jalan-sky';
export const SEARCH_DEBOUNCE_MS = 180;

export const MAP_BOUNDS: maplibregl.LngLatBoundsLike = [
  [108.50333395341329, -7.384947285610721],
  [108.56235933275224, -7.356833238613973],
];

export const RECENT_SEARCH_KEY = 'jalan_recent_roads';

/**
 * Ekspresi line-width yang disamakan dengan layer "Minor road" MapTiler
 */
export const ROAD_LINE_WIDTH: any = [
  'interpolate',
  ['linear', 2],
  ['zoom'],
  5,
  [
    '*',
    0.5,
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  10,
  [
    '*',
    1,
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  12,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      ['secondary', 'tertiary'],
      1.5,
      ['minor', 'track'],
      1.2,
      1,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  14,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      4,
      'tertiary',
      3,
      ['minor', 'track'],
      2,
      2,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['service', 'track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  16,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      8,
      'tertiary',
      6,
      ['minor', 'track'],
      4,
      4,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['service', 'track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  18,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      24,
      'tertiary',
      24,
      ['minor', 'track'],
      16,
      16,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  22,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      80,
      'tertiary',
      60,
      ['minor', 'track'],
      50,
      40,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
];
