(function () {
  const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

  function normalizeText(value) {
    return String(value || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function normalizeLetter(value) {
    return normalizeText(value).replace(/[^A-Z]/g, '').charAt(0);
  }

  function isLetter(value) {
    return /^[A-Z]$/.test(value);
  }

  function isVowel(value) {
    return VOWELS.has(value);
  }

  function isConsonant(value) {
    return isLetter(value) && !isVowel(value);
  }

  function countInPhrase(phraseNorm, letter) {
    return String(phraseNorm || '').split('').filter(ch => ch === letter).length;
  }

  function solutionEquals(a, b) {
    return normalizeText(a).replace(/\s+/g, ' ').trim() === normalizeText(b).replace(/\s+/g, ' ').trim();
  }

  window.GiroLetters = {
    VOWELS,
    normalizeText,
    normalizeLetter,
    isLetter,
    isVowel,
    isConsonant,
    countInPhrase,
    solutionEquals
  };
})();
