export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: { [key: string]: string };
  category: string;
  kind: string;
  menu: string;
  axes?: { tag: string; start: number; end: number }[];
}

export const SLANT_MAP = {
  "-15": -15,
  "-10": -10,
  "-5": -5,
  "0": 0,
  "5": 5,
  "10": 10,
  "15": 15,
} as const;

export type FontSlant = (typeof SLANT_MAP)[keyof typeof SLANT_MAP];

export const SLANT_CONFIG = {
  min: -15,
  max: 15,
  default: 0,
  step: 1,
  labels: {
    "-15": "-15°",
    "-10": "-10°",
    "-5": "-5°",
    "0": "0°",
    "5": "5°",
    "10": "10°",
    "15": "15°",
  },
} as const;
