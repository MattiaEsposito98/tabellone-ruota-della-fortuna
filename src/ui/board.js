(function () {
  function splitPhrase(phrase, phraseNorm, max) {
    const words = String(phrase || '').split(' ');
    const normWords = String(phraseNorm || '').split(' ');
    const rows = [];
    let current = [];
    let len = 0;

    words.forEach((word, idx) => {
      const add = current.length === 0 ? word.length : word.length + 1;
      if (word.length > max) {
        if (current.length) rows.push(current);
        rows.push([{ word, norm: normWords[idx] || '' }]);
        current = [];
        len = 0;
        return;
      }
      if (len + add > max && current.length) {
        rows.push(current);
        current = [];
        len = 0;
      }
      current.push({ word, norm: normWords[idx] || '' });
      len += add;
    });

    if (current.length) rows.push(current);
    return rows;
  }

  function renderBoard(container, phrase, phraseNorm, revealed, options) {
    const opts = options || {};
    const availableWidth = container.clientWidth || 900;
    const maxLettersPerRow = Math.max(14, Math.min(24, Math.floor(availableWidth / 58)));
    const rows = splitPhrase(phrase, phraseNorm, maxLettersPerRow);

    container.innerHTML = '';
    container.classList.toggle('board-open', !!opts.open);
    container.classList.toggle('board-compact', rows.length >= 5);
    container.classList.toggle('board-dense', rows.length >= 6);
    container.dataset.rowCount = String(rows.length);
    container.dataset.letterCount = String(String(phraseNorm || '').replace(/[^A-Z]/g, '').length);

    rows.forEach(row => {
      const line = document.createElement('div');
      line.className = 'linea-row';
      row.forEach(({ word, norm }) => {
        const wordEl = document.createElement('div');
        wordEl.className = 'parola-row';
        for (let i = 0; i < word.length; i++) {
          const cell = document.createElement('div');
          cell.className = 'cella';
          cell.dataset.norm = norm[i] || '';
          cell.textContent = word[i];
          if (opts.open || revealed.has(norm[i]) || !/^[A-Z]$/.test(norm[i] || '')) cell.classList.add('revealed');
          wordEl.appendChild(cell);
        }
        line.appendChild(wordEl);
      });
      container.appendChild(line);
    });
  }

  function revealLetter(letter) {
    let count = 0;
    let delay = 0;
    document.querySelectorAll('.screen.active .cella').forEach(cell => {
      if (cell.dataset.norm === letter) {
        count += 1;
        setTimeout(() => {
          cell.classList.add('revealed', 'flash-correct');
          setTimeout(() => cell.classList.remove('flash-correct'), 500);
        }, delay);
        delay += 70;
      }
    });
    return count;
  }

  function revealAll(revealedSet) {
    document.querySelectorAll('.screen.active .cella').forEach(cell => {
      if (cell.dataset.norm) revealedSet.add(cell.dataset.norm);
      cell.classList.add('revealed');
    });
  }

  function isComplete(phraseNorm, revealed) {
    for (const ch of phraseNorm) {
      if (/^[A-Z]$/.test(ch) && !revealed.has(ch)) return false;
    }
    return true;
  }

  window.GiroBoard = {
    renderBoard,
    revealLetter,
    revealAll,
    isComplete
  };
})();
