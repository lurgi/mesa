"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

function ColorPicker({ color, label }: { color: string; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start bg-transparent">
          <div className="w-4 h-4 rounded border mr-2" style={{ backgroundColor: color }} />
          <span className="flex-1 text-left">{color}</span>
          <Palette className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <Label className="text-sm font-medium">{label}</Label>
          <Input type="color" value={color} className="w-full h-10" />
          <Input type="text" value={color} placeholder="#000000" className="w-full" />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EditSidebar() {
  // 하드코딩된 기본값들 (실제로는 전역 상태에서 가져올 예정)
  const globalLetterSpacing = 0;
  const weight = 400;
  const slant = 0;
  const lineHeight = 1.5;
  const letterSpacing = 0;
  const radius = 0;
  const fillColor = "#000000";
  const strokeWidth = 0;
  const strokeColor = "#000000";

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Edit Settings</h3>
        </div>

        <Separator />

        {/* Global Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Global</h4>

          {/* Global Letter Spacing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Letter Spacing</Label>
              <span className="text-sm text-muted-foreground">{globalLetterSpacing}px</span>
            </div>
            <Slider value={[globalLetterSpacing]} max={10} min={-5} step={0.1} className="w-full" />
          </div>
        </div>

        <Separator />

        {/* Selection Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Selection</h4>

          {/* Weight Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Weight</Label>
              <span className="text-sm text-muted-foreground">{weight}</span>
            </div>
            <Slider value={[weight]} max={900} min={100} step={100} className="w-full" />
          </div>

          {/* Slant Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Slant</Label>
              <span className="text-sm text-muted-foreground">{slant}°</span>
            </div>
            <Slider value={[slant]} max={30} min={-30} step={1} className="w-full" />
          </div>

          {/* Line Height */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Line Height</Label>
              <span className="text-sm text-muted-foreground">{lineHeight}</span>
            </div>
            <Slider value={[lineHeight]} max={3} min={0.5} step={0.1} className="w-full" />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Letter Spacing</Label>
              <span className="text-sm text-muted-foreground">{letterSpacing}px</span>
            </div>
            <Slider value={[letterSpacing]} max={10} min={-5} step={0.1} className="w-full" />
          </div>

          {/* Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Radius</Label>
              <span className="text-sm text-muted-foreground">{radius}px</span>
            </div>
            <Slider value={[radius]} max={50} min={0} step={1} className="w-full" />
          </div>

          {/* Fill Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fill Color</Label>
            <ColorPicker color={fillColor} label="Fill Color" />
          </div>

          {/* Stroke Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Stroke</Label>

            {/* Stroke Width */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Width</Label>
                <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
              </div>
              <Slider value={[strokeWidth]} max={10} min={0} step={0.5} className="w-full" />
            </div>

            {/* Stroke Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <ColorPicker color={strokeColor} label="Stroke Color" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
