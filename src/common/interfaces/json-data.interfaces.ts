export interface JsonProductSize {
  size: string;
  price: string;
  discountPrice?: string;
}

export interface JsonProductSizes {
  s: JsonProductSize;
  m: JsonProductSize;
  l: JsonProductSize;
  xl: JsonProductSize;
  xxl: JsonProductSize;
}

export interface JsonProductAdditive {
  name: string;
  price: string;
  discountPrice?: string;
}

export interface JsonProduct {
  name: string;
  description: string;
  price: string;
  discountPrice?: string;
  category: string;
  id: number;
  sizes: JsonProductSizes;
  additives: JsonProductAdditive[];
}

export type JsonProductsData = JsonProduct[];
