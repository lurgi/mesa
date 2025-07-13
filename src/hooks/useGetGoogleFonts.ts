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
  return data;
}

export function useGetGoogleFonts() {
  return useQuery<{ items: GoogleFont[] }, Error, GoogleFont[]>({
    queryKey: ["google-fonts"],
    queryFn: fetchGoogleFonts,
    select: (data) => {
      textStore.selectedFont = data.items[0];
      return data.items;
    },
  });
}
