// Gedeelde data-types voor Mats Money Maker

export interface ShoppingItem {
  id:       string;
  name:     string;
  qty:      string;
  sale?:    string;    // '–25%' | 'Bonus' | undefined
  carry?:   boolean;   // meegenomen van vorige week
  checked:  boolean;
}

export interface RouteSection {
  route: string;       // '01', '02', …
  title: string;
  items: ShoppingItem[];
}
