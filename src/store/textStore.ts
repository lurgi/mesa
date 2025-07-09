import { proxy } from "valtio";

export const textStore = proxy({
  text: "",
  fontFamily: "Noto Sans KR",
  fontWeight: "600",
});

export const vectorTextStore = proxy({
  vectorText: [],
});
