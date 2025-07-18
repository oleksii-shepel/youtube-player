import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toFriendlyDuration',
  standalone: true
})
export class ToFriendlyDurationPipe implements PipeTransform {
  transform(value: any, args?: any[]): string {
    const time = <string>value;
    if (!time) {
      return '...';
    }

    const durationParts = ['H', 'M', 'S']; // hours, minutes, seconds
    const result = { hours: '00', minutes: '00', seconds: '00' };

    // Match and extract hours, minutes, seconds
    durationParts.forEach((part) => {
      const regex = new RegExp(`(\\d+)(?=${part})`);
      const match = time.match(regex);
      if (match) {
        if (part === 'H') result.hours = match[0];
        if (part === 'M') result.minutes = match[0];
        if (part === 'S') result.seconds = match[0];
      }
    });

    // Format as HH:MM:SS
    return `${this.padTime(result.hours)}:${this.padTime(result.minutes)}:${this.padTime(result.seconds)}`;
  }

  // Helper method to add leading zeros to time parts
  private padTime(time: string): string {
    return time.length === 1 ? `0${time}` : time;
  }
}
