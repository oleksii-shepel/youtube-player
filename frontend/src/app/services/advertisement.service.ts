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

  // For sequential rotation
  private sequentialPointer = 0;

  /** Load CSV from a URL (public/assets) */
  async loadCsvFromUrl(url: string): Promise<void> {
    if (this.loaded) return;

    const csv = await fetch(url).then(r => r.text());
    this.items = this.parseCsv(csv);
    this.randomIndexes = this.shuffleIndexes(this.items.length);
    this.loaded = true;

    console.log('Loaded ads:', this.items.length);
  }

  getItems(): ProductItem[] {
    return this.items;
  }

  getRandomIndexes(): number[] {
    return this.randomIndexes;
  }

  /** MODE 1: Pick a random ad every time */
  getRandomAd(): ProductItem {
    const randomOrder = this.randomIndexes;
    const randomIndex = randomOrder[Math.floor(Math.random() * randomOrder.length)];
    return this.items[randomIndex];
  }

  /** MODE 2: Sequential rotation (no repeats until cycle ends) */
  getSequentialAd(): ProductItem {
    if (!this.items.length) throw new Error('No ads loaded');

    const index = this.randomIndexes[this.sequentialPointer];

    // Move pointer
    this.sequentialPointer++;
    if (this.sequentialPointer >= this.randomIndexes.length) {
      // reshuffle for next cycle
      this.randomIndexes = this.shuffleIndexes(this.items.length);
      this.sequentialPointer = 0;
    }

    return this.items[index];
  }

  private parseCsv(tsv: string): ProductItem[] {
    const lines = tsv.split('\n').filter(l => l.trim() !== '');
    const res: ProductItem[] = [];

    for (const line of lines) {
      const cols = line.split('\t');
      
      if (cols.length >= 3) {
        res.push({
          description: cols[0],
          link: cols[1],
          image: cols[2],
        });
      }
    }

    return res;
  }

  private shuffleIndexes(count: number): number[] {
    const arr = Array.from({ length: count }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
