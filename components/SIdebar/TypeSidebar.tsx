"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useSnapshot } from "valtio";
import { textStore } from "@/src/store/textStore";
import { FontSlant, GoogleFont, SLANT_CONFIG } from "@/src/domain/font";
import { useGetGoogleFonts } from "@/src/hooks/useGetGoogleFonts";
import { useGetSpecificGoogleFont } from "@/src/hooks/useGetSpecificGoogleFont";

export function TypeSidebar() {
  const { selectedFont, selectedFontWeight, fontSlant } = useSnapshot(textStore);
  const { data: googleFonts, isLoading } = useGetGoogleFonts();
  useGetSpecificGoogleFont({
    fontUrl: selectedFont?.files[selectedFontWeight] || "",
    fontFamily: selectedFont?.family,
  });

  const handleSelectFont = async (value: string) => {
    const font = JSON.parse(value) as GoogleFont;
    textStore.selectedFont = font;
    textStore.selectedFontWeight = font.variants[0];
  };

  const handleSelectWeight = (weight: string) => {
    textStore.selectedFontWeight = weight;
  };

  const handleSelectSlant = (slant: FontSlant) => {
    textStore.fontSlant = slant;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!googleFonts?.length) {
    return <div>Something went wrong</div>;
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Type Settings</h3>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="font-select" className="text-sm font-medium">
            Font Family
          </Label>
          <Select onValueChange={handleSelectFont} defaultValue={JSON.stringify(selectedFont)}>
            <SelectTrigger id="font-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {googleFonts.map((font) => (
                <SelectItem key={font.family} value={JSON.stringify(font)}>
                  {font.family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight-select" className="text-sm font-medium">
            Font Weight
          </Label>
          <Select value={selectedFontWeight} onValueChange={handleSelectWeight}>
            <SelectTrigger id="weight-select">
              <SelectValue placeholder="Select weight" />
            </SelectTrigger>
            <SelectContent>
              {selectedFont?.variants.map((weight) => (
                <SelectItem key={weight} value={weight}>
                  {weight}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Slant</Label>
            <span className="text-sm text-muted-foreground">{fontSlant}°</span>
          </div>
          <Slider
            value={[fontSlant]}
            max={SLANT_CONFIG.max}
            min={SLANT_CONFIG.min}
            step={SLANT_CONFIG.step}
            className="w-full"
            onValueChange={(value) => handleSelectSlant(value[0] as FontSlant)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{SLANT_CONFIG.min}°</span>
            <span>{SLANT_CONFIG.default}°</span>
            <span>{SLANT_CONFIG.max}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
