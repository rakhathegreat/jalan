import type { ReactNode } from "react";

// src/types/tree.ts
export type TreeTaxonomy = {
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
};

export type TreeEndemic = {
  region: string;
  countries: string[];
  provinces: string[];
};

export type TreeCoordinates = {
  location: ReactNode;
  latitude: number;
  longitude: number;
};

export type TreeLocation = {
  id: number;
  lokasi: string;
}

export type Tree = {
  lokasi?: TreeLocation | null;
  id: string;
  common_name: string;
  scientific_name: string;
  taxonomy: TreeTaxonomy;
  endemic: TreeEndemic;
  coordinates: TreeCoordinates;
  description: string;
  characteristics: string[];
  created_at: string;
};

export type TreeFormValues = Omit<Tree, 'created_at'> & {
  created_at?: string;
};
