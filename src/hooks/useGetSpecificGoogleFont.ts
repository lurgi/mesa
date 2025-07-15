import { useQuery } from "@tanstack/react-query";

export function useGetSpecificGoogleFont({ fontUrl, fontFamily }: { fontUrl: string; fontFamily?: string }) {
  return useQuery<ArrayBuffer, Error, ArrayBuffer>({
    queryKey: ["google-font", fontUrl],
    queryFn: () =>
      fetch(fontUrl).then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch font: ${res.statusText}`);
        }

        const fontBuffer = await res.arrayBuffer();

        if (fontFamily) {
          console.log(fontFamily, "fontFamily");
          const existingFonts = Array.from(document.fonts).filter((font) => font.family === fontFamily);
          existingFonts.forEach((font) => document.fonts.delete(font));

          const font = new FontFace(fontFamily, fontBuffer);
          await font.load();
          document.fonts.add(font);
        }

        return fontBuffer;
      }),
  });
}
