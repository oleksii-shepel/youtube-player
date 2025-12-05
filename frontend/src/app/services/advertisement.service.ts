import { Injectable } from '@angular/core';

export interface ProductItem {
  description: string;
  link: string;
  image: string;
}

@Injectable({ providedIn: 'root' })
export class AdvertisementService {
  private items: ProductItem[] = [];
  private randomIndexes: number[] = [];
  private loaded = false;

  /** Called only once globally */
  async loadCsv(file: File): Promise<void> {
    if (this.loaded) return; // <-- prevents multiple loads

    const text = await file.text();
    this.items = this.parseCsv(text);
    this.randomIndexes = this.shuffleIndexes(this.items.length);
    this.loaded = true;

    console.log('ADS LOADED:', this.items.length);
  }

  /** For preloading from assets instead of file upload */
  async loadCsvFromString(csv: string): Promise<void> {
    if (this.loaded) return;
    this.items = this.parseCsv(csv);
    this.randomIndexes = this.shuffleIndexes(this.items.length);
    this.loaded = true;
  }

  getItems(): ProductItem[] {
    return this.items;
  }

  getRandomIndexes(): number[] {
    return this.randomIndexes;
  }

  private parseCsv(csv: string): ProductItem[] {
    const lines = csv.split('\n').filter(l => l.trim() !== '');
    const items: ProductItem[] = [];

    for (const line of lines) {
      const regex = /("([^"]*)"|[^,]+)|,/g;
      const cols: string[] = [];
      let m;

      while ((m = regex.exec(line)) !== null) {
        if (m[2]) cols.push(m[2]);
        else if (m[1] && m[1] !== ',') cols.push(m[1]);
      }

      if (cols.length >= 3) {
        items.push({
          description: cols[0],
          link: cols[1],
          image: cols[2],
        });
      }
    }

    return items;
  }

  private shuffleIndexes(count: number): number[] {
    const arr = Array.from({ length: count }, (_, i) => i);

    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }
}
