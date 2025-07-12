export const FONT_MAP = {
  "Noto Sans": {
    family: "Noto Sans",
    weight: "400",
    url: "https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLTq8H4hfeE.woff2",
  },
} as const;

export type FontFamily = (typeof FONT_MAP)[keyof typeof FONT_MAP]["family"];
export type FontWeight = (typeof FONT_MAP)[keyof typeof FONT_MAP]["weight"];

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

export const getFontUrl = (fontName: FontFamily) => {
  return FONT_MAP[fontName].url || FONT_MAP["Noto Sans"].url;
};
