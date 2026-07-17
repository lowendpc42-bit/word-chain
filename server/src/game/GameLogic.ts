import words from 'an-array-of-english-words';

// Create a Set for O(1) lookups
const wordSet = new Set(words);

export class GameLogic {
  /**
   * Returns a random, gameplay-friendly starting word.
   * Avoids words ending in Q, X, Z, or U.
   */
  static getRandomStartingWord(): string {
    const minLen = 4;
    const maxLen = 7;
    const badEndings = ['q', 'x', 'z', 'u', 'v', 'j']; // added a few more tricky ones

    const validWords = words.filter(word => {
      if (word.length < minLen || word.length > maxLen) return false;
      const lastChar = word[word.length - 1].toLowerCase();
      if (badEndings.includes(lastChar)) return false;
      return true;
    });

    if (validWords.length === 0) return 'start';
    
    const randomIndex = Math.floor(Math.random() * validWords.length);
    return validWords[randomIndex];
  }

  /**
   * Validates if a word is a real English word.
   */
  static isValidWord(word: string): boolean {
    return wordSet.has(word.toLowerCase());
  }

  /**
   * Calculates points for a given word and submission speed.
   */
  static calculatePoints(word: string, timeTakenMs: number, turnTimeLimitMs: number): number {
    let points = 1; // base point
    const len = word.length;

    // Length bonus
    if (len >= 6 && len <= 8) {
      points += 1;
    } else if (len >= 9) {
      points += 2;
    }

    // Speed bonus (if submitted in first half of time)
    if (timeTakenMs <= turnTimeLimitMs / 2) {
      points += 1;
    }

    return points;
  }
}
