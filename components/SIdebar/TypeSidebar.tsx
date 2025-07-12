"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useSnapshot } from "valtio";
import { textStore } from "@/src/store/textStore";
import { FONT_MAP, FontFamily, FontSlant, FontWeight, SLANT_CONFIG } from "@/src/domain/font";

const FONTS = Object.values(FONT_MAP);

export function TypeSidebar() {
  const { fontFamily, fontWeight, fontSlant } = useSnapshot(textStore);

  const handleSelectFont = (font: FontFamily) => {
    textStore.fontFamily = font;
  };

  const handleSelectWeight = (weight: FontWeight) => {
    textStore.fontWeight = weight;
  };

  const handleSelectSlant = (slant: FontSlant) => {
    textStore.fontSlant = slant;
  };

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
          <Select value={fontFamily}>
            <SelectTrigger id="font-select">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font.family} value={font.family} onClick={() => handleSelectFont(font.family)}>
                  <span style={{ fontFamily: font.family }}>{font.family}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight-select" className="text-sm font-medium">
            Font Weight
          </Label>
          <Select value={fontWeight}>
            <SelectTrigger id="weight-select">
              <SelectValue placeholder="Select weight" />
            </SelectTrigger>
            <SelectContent onClick={() => handleSelectWeight(fontWeight)}>
              {FONTS.map((font) => (
                <SelectItem key={font.weight} value={font.weight}>
                  {font.weight}
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
