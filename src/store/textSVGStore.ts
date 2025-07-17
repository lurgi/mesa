import { proxy } from "valtio";
import { FontData } from "../domain/fontSVG";

interface TextSVGStore {
  textSVG?: FontData;
}

export const textSVGStore = proxy<TextSVGStore>({
  textSVG: undefined,
});
