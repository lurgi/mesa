"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useSnapshot } from "valtio";
import { textSVGStore, textSVGItemManager } from "@/src/store/textSVGStore";

function ColorPicker({ color, label, onChange }: { color: string; label: string; onChange: (color: string) => void }) {
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
          <Input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="w-full h-10" />
          <Input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EditSidebar() {
  const { globalStyle, selectionStyle } = useSnapshot(textSVGStore);

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
              <span className="text-sm text-muted-foreground">{globalStyle.letterSpacing}px</span>
            </div>
            <Slider
              value={[globalStyle.letterSpacing]}
              max={10}
              min={-5}
              step={0.1}
              className="w-full"
              onValueChange={(value) => textSVGItemManager.updateGlobalStyle({ letterSpacing: value[0] })}
            />
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
              <span className="text-sm text-muted-foreground">{selectionStyle.weight}</span>
            </div>
            <Slider
              value={[selectionStyle.weight]}
              max={900}
              min={100}
              step={100}
              className="w-full"
              onValueChange={(value) => textSVGItemManager.updateSelectionStyle({ weight: value[0] })}
            />
          </div>

          {/* Slant Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Slant</Label>
              <span className="text-sm text-muted-foreground">{selectionStyle.slant}°</span>
            </div>
            <Slider
              value={[selectionStyle.slant]}
              max={30}
              min={-30}
              step={1}
              className="w-full"
              onValueChange={(value) => textSVGItemManager.updateSelectionStyle({ slant: value[0] })}
            />
          </div>

          {/* Line Height */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Line Height</Label>
              <span className="text-sm text-muted-foreground">{selectionStyle.lineHeight}</span>
            </div>
            <Slider
              value={[selectionStyle.lineHeight]}
              max={3}
              min={0.5}
              step={0.1}
              className="w-full"
              onValueChange={(value) => textSVGItemManager.updateSelectionStyle({ lineHeight: value[0] })}
            />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Letter Spacing</Label>
              <span className="text-sm text-muted-foreground">{selectionStyle.letterSpacing}px</span>
            </div>
            <Slider
              value={[selectionStyle.letterSpacing]}
              max={10}
              min={-5}
              step={0.1}
              className="w-full"
              onValueChange={(value) => textSVGItemManager.updateSelectionStyle({ letterSpacing: value[0] })}
            />
          </div>

          {/* Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Radius</Label>
              <span className="text-sm text-muted-foreground">{selectionStyle.radius}px</span>
            </div>
            <Slider
              value={[selectionStyle.radius]}
              max={50}
              min={0}
              step={1}
              className="w-full"
              onValueChange={(value) => textSVGItemManager.updateSelectionStyle({ radius: value[0] })}
            />
          </div>

          {/* Fill Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fill Color</Label>
            <ColorPicker
              color={selectionStyle.fillColor}
              label="Fill Color"
              onChange={(color) => textSVGItemManager.updateSelectionStyle({ fillColor: color })}
            />
          </div>

          {/* Stroke Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Stroke</Label>

            {/* Stroke Width */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Width</Label>
                <span className="text-xs text-muted-foreground">{selectionStyle.strokeWidth}px</span>
              </div>
              <Slider
                value={[selectionStyle.strokeWidth]}
                max={10}
                min={0}
                step={0.5}
                className="w-full"
                onValueChange={(value) => textSVGItemManager.updateSelectionStyle({ strokeWidth: value[0] })}
              />
            </div>

            {/* Stroke Color */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <ColorPicker
                color={selectionStyle.strokeColor}
                label="Stroke Color"
                onChange={(color) => textSVGItemManager.updateSelectionStyle({ strokeColor: color })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
