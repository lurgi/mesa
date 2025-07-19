import { proxy } from "valtio";
import { Glyph } from "fontkit";

interface TextSVGStore {
  textSVGList: Glyph["path"][];
}

export const textSVGStore = proxy<TextSVGStore>({
  textSVGList: [],
});
