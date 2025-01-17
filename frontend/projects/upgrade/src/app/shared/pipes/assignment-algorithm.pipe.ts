import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'assignmentAlgorithmFormat',
})
export class assignmentAlgorithmPipe implements PipeTransform {
  // Special cases that should remain as-is
  private readonly specialCases = new Map([['ts', 'TS']]);

  transform(value: string): string {
    if (!value) return value;

    // Split the string into words
    const words = value.toLowerCase().split('_');

    // Transform each word
    const transformedWords = words.map((word, index) => {
      // Check if the word is a special case
      for (const [key, replacement] of this.specialCases) {
        if (word === key.toLowerCase()) {
          return replacement;
        }
      }

      // Apply regular title case
      return word.charAt(0).toUpperCase() + word.slice(1);
    });

    return transformedWords.join(' ');
  }
}
