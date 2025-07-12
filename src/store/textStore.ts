import { proxy } from "valtio";
import { FontFamily, FontSlant, FontWeight } from "../domain/font";

interface TextStore {
  text: string;
  fontFamily: FontFamily;
  fontWeight: FontWeight;
  fontSlant: FontSlant;
}

export const textStore = proxy<TextStore>({
  text: "",
  fontFamily: "Noto Sans",
  fontWeight: "400",
  fontSlant: 0,
});

export const vectorTextStore = proxy({
  vectorText: [],
});
