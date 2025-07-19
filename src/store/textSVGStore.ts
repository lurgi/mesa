import { proxy } from "valtio";
import { Glyph } from "fontkit";

export interface GlobalStyle {
  letterSpacing: number;
}

export interface SelectionStyle {
  weight: number;
  slant: number;
  lineHeight: number;
  radius: number;
  fillColor: string;
  strokeWidth: number;
  strokeColor: string;
}
export interface TextSVGItem {
  path: Glyph["path"];
  id: string;
  isSelected: boolean;
  style: SelectionStyle;
}

interface TextSVGStore {
  textSVGItems: TextSVGItem[];
  selectedItemIds: string[];
  globalStyle: GlobalStyle;
  selectionStyle: SelectionStyle;
}

export const textSVGStore = proxy<TextSVGStore>({
  textSVGItems: [],
  selectedItemIds: [],
  globalStyle: {
    letterSpacing: 0,
  },
  selectionStyle: {
    weight: 400,
    slant: 0,
    lineHeight: 1.2,
    radius: 0,
    fillColor: "#000000",
    strokeWidth: 0,
    strokeColor: "#000000",
  },
});
class TextSVGItemManager {
  private itemStores: Map<
    string,
    {
      select: () => void;
      deselect: () => void;
      updatePosition: (x: number, y: number) => void;
      updateScale: (scale: number) => void;
      updateRotation: (rotation: number) => void;
      updateStyle: (style: Partial<SelectionStyle>) => void;
      getStore: () => TextSVGItem;
    }
  > = new Map();

  createTextSVGItems(paths: Glyph["path"][]): void {
    this.clearAllItems();

    const newItems: TextSVGItem[] = paths.map((path, index) => {
      const id = `text-svg-${Date.now()}-${index}`;

      const itemStore = proxy({
        path,
        id,
        isSelected: false,
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        style: { ...textSVGStore.selectionStyle },
      });

      const itemActions = {
        select: () => {
          itemStore.isSelected = true;
          if (!textSVGStore.selectedItemIds.includes(id)) {
            textSVGStore.selectedItemIds.push(id);
          }
          
          const itemIndex = textSVGStore.textSVGItems.findIndex(item => item.id === id);
          if (itemIndex !== -1) {
            textSVGStore.textSVGItems[itemIndex].isSelected = true;
          }
        },
        deselect: () => {
          itemStore.isSelected = false;
          textSVGStore.selectedItemIds = textSVGStore.selectedItemIds.filter((selectedId) => selectedId !== id);
          
          const itemIndex = textSVGStore.textSVGItems.findIndex(item => item.id === id);
          if (itemIndex !== -1) {
            textSVGStore.textSVGItems[itemIndex].isSelected = false;
          }
        },
        updatePosition: (x: number, y: number) => {
          itemStore.position = { x, y };
        },
        updateScale: (scale: number) => {
          itemStore.scale = scale;
        },
        updateRotation: (rotation: number) => {
          itemStore.rotation = rotation;
        },
        updateStyle: (style: Partial<SelectionStyle>) => {
          itemStore.style = { ...itemStore.style, ...style };
        },
        getStore: () => itemStore,
      };

      this.itemStores.set(id, itemActions);

      return {
        path,
        id,
        isSelected: false,
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        style: { ...textSVGStore.selectionStyle },
      };
    });

    textSVGStore.textSVGItems = newItems;
  }

  getItemActions(id: string) {
    return this.itemStores.get(id);
  }

  deselectAll(): void {
    textSVGStore.textSVGItems.forEach((item) => {
      item.isSelected = false;
    });
    textSVGStore.selectedItemIds = [];
  }

  clearAllItems(): void {
    this.itemStores.clear();
    textSVGStore.textSVGItems = [];
    textSVGStore.selectedItemIds = [];
  }

  getSelectedItems(): TextSVGItem[] {
    return textSVGStore.textSVGItems.filter((item) => item.isSelected);
  }

  removeItem(id: string): void {
    this.itemStores.delete(id);
    textSVGStore.textSVGItems = textSVGStore.textSVGItems.filter((item) => item.id !== id);
    textSVGStore.selectedItemIds = textSVGStore.selectedItemIds.filter((selectedId) => selectedId !== id);
  }

  updateGlobalStyle(style: Partial<GlobalStyle>): void {
    console.log("updateGlobalStyle", style);
    textSVGStore.globalStyle = { ...textSVGStore.globalStyle, ...style };
  }

  updateSelectionStyle(style: Partial<SelectionStyle>): void {
    console.log("updateSelectionStyle", style);
    textSVGStore.selectionStyle = { ...textSVGStore.selectionStyle, ...style };

    textSVGStore.selectedItemIds.forEach((id) => {
      const itemActions = this.getItemActions(id);
      if (itemActions) {
        itemActions.updateStyle(style);
      }

      const itemIndex = textSVGStore.textSVGItems.findIndex((item) => item.id === id);
      if (itemIndex !== -1) {
        textSVGStore.textSVGItems[itemIndex].style = {
          ...textSVGStore.textSVGItems[itemIndex].style,
          ...style,
        };
      }
    });
  }

  applySelectionStyleToSelected(): void {
    textSVGStore.selectedItemIds.forEach((id) => {
      const itemActions = this.getItemActions(id);
      if (itemActions) {
        itemActions.updateStyle(textSVGStore.selectionStyle);
      }

      const itemIndex = textSVGStore.textSVGItems.findIndex((item) => item.id === id);
      if (itemIndex !== -1) {
        textSVGStore.textSVGItems[itemIndex].style = {
          ...textSVGStore.selectionStyle,
        };
      }
    });
  }
}

export const textSVGItemManager = new TextSVGItemManager();

export const createTextSVGItems = (paths: Glyph["path"][]) => {
  textSVGItemManager.createTextSVGItems(paths);
};

export const getTextSVGItemActions = (id: string) => {
  return textSVGItemManager.getItemActions(id);
};

export const clearAllTextSVGItems = () => {
  textSVGItemManager.clearAllItems();
};
