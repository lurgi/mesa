"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

// 구글 폰트 예시 데이터
const googleFonts = [
  { name: "Inter", weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] },
  { name: "Roboto", weights: ["100", "300", "400", "500", "700", "900"] },
  { name: "Open Sans", weights: ["300", "400", "500", "600", "700", "800"] },
  { name: "Lato", weights: ["100", "300", "400", "700", "900"] },
  { name: "Montserrat", weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] },
  { name: "Poppins", weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] },
  { name: "Source Sans Pro", weights: ["200", "300", "400", "600", "700", "900"] },
  { name: "Oswald", weights: ["200", "300", "400", "500", "600", "700"] },
  { name: "Raleway", weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] },
  { name: "PT Sans", weights: ["400", "700"] },
];

export function TypeSidebar() {
  // 하드코딩된 기본값들 (실제로는 전역 상태에서 가져올 예정)
  const currentFont = "Inter";
  const currentWeight = "400";
  const currentSlant = 0;

  const selectedFontData = googleFonts.find((font) => font.name === currentFont);
  const availableWeights = selectedFontData?.weights || [];

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Type Settings</h3>
        </div>

        <Separator />

        {/* Font Selection */}
        <div className="space-y-2">
          <Label htmlFor="font-select" className="text-sm font-medium">
            Font Family
          </Label>
          <Select value={currentFont}>
            <SelectTrigger id="font-select">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {googleFonts.map((font) => (
                <SelectItem key={font.name} value={font.name}>
                  <span style={{ fontFamily: font.name }}>{font.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Weight Selection */}
        <div className="space-y-2">
          <Label htmlFor="weight-select" className="text-sm font-medium">
            Font Weight
          </Label>
          <Select value={currentWeight}>
            <SelectTrigger id="weight-select">
              <SelectValue placeholder="Select weight" />
            </SelectTrigger>
            <SelectContent>
              {availableWeights.map((weight) => (
                <SelectItem key={weight} value={weight}>
                  {weight}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Slant Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Slant</Label>
            <span className="text-sm text-muted-foreground">{currentSlant}°</span>
          </div>
          <Slider value={[currentSlant]} max={30} min={-30} step={1} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>-30°</span>
            <span>0°</span>
            <span>30°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
