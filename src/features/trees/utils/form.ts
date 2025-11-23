import { v4 as uuidv4 } from 'uuid';

import type { Tree, TreeFormValues } from '@features/trees/types';

export const createTreeFormDefaults = (): TreeFormValues => ({
  id: uuidv4(),
  common_name: '',
  scientific_name: '',
  taxonomy: {
    kingdom: '',
    phylum: '',
    class: '',
    order: '',
    family: '',
    genus: '',
    species: '',
  },
  endemic: {
    region: '',
    countries: [],
    provinces: [],
  },
  coordinates: {
    latitude: 0,
    longitude: 0,
    location: '',
  },
  description: '',
  characteristics: [],
  created_at: undefined,
});

export const normalizeTreeForForm = (tree: Tree): TreeFormValues => ({
  ...tree,
  endemic: {
    region: tree.endemic.region,
    countries: tree.endemic.countries ?? [],
    provinces: tree.endemic.provinces ?? [],
  },
  coordinates: { ...tree.coordinates },
  characteristics: tree.characteristics ?? [],
});
