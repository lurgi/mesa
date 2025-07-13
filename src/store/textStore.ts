import { proxy } from "valtio";
import { FontSlant, GoogleFont } from "../domain/font";

interface TextStore {
  text: string;
  selectedFont?: GoogleFont;
  selectedFontWeight: string;
  fontSlant: FontSlant;
}

export const textStore = proxy<TextStore>({
  text: "",
  selectedFont: undefined,
  selectedFontWeight: "",
  fontSlant: 0,
});

export const vectorTextStore = proxy({
  vectorText: [],
});
