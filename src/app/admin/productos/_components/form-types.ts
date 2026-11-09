import type { OptionGroup } from "@/domain/products/product";

/** A product photo in the editor: storage key plus a URL to preview it. */
export interface EditableImage {
  key: string;
  url: string;
}

/** Initial values for the product form (empty for a new product). */
export interface ProductFormValues {
  name: string;
  description: string;
  basePrice: string;
  productionNote: string;
  optionGroups: OptionGroup[];
  images: EditableImage[];
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  description: "",
  basePrice: "",
  productionNote: "",
  optionGroups: [],
  images: [],
};
