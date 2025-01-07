import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shrink',
  standalone: true
})
export class ShrinkNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value < 1000) {
      return value.toString();
    } else if (value >= 1000 && value < 1000000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else if (value >= 1000000 && value < 1000000000) {
      return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    return value.toString();
  }
}
