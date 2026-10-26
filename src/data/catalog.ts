import productsJson from '../../shared/catalog.json';
import dropsJson from '../../shared/drops.json';
import contentJson from '../../shared/content.json';
import type { Drop, Product, StoreContent } from './types';

export const fallbackProducts = productsJson as Product[];
export const fallbackDrops = dropsJson as Drop[];
export const defaultContent = contentJson as StoreContent;
