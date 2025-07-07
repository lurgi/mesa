import { proxy } from "valtio";

export const textStore = proxy({
  fontFamily: "Noto Sans KR",
  fontWeight: "400",
});

export const vectorTextStore = proxy({
  vectorText: [],
});
