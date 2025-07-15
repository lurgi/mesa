import { useQuery } from "@tanstack/react-query";
import { GoogleFont } from "../domain/font";
import { textStore } from "../store/textStore";

async function fetchGoogleFonts() {
  const searchParams = new URLSearchParams({
    key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    sort: "popularity",
    capability: "woff2",
    subset: "latin",
    category: "display",
  });

  const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?${searchParams.toString()}`);
  const data = await response.json();
  textStore.selectedFont = data.items[0];
  textStore.selectedFontWeight = data.items[0].variants[0];

  return data.items;
}

export function useGetGoogleFonts() {
  return useQuery<GoogleFont[], Error, GoogleFont[]>({
    queryKey: ["google-fonts"],
    queryFn: fetchGoogleFonts,
  });
}
