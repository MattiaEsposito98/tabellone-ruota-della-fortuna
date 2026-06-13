// ========================
//  STATO DEL GIOCO
// ========================
let frase = '';
let fraseNorm = '';   // frase normalizzata (uppercase, senza accenti)
let lettereRivelate = new Set();

// ========================
//  NORMALIZZA CARATTERE
// ========================
function normalizza(str) {
  return str.toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ========================
//  AVVIA IL GIOCO
// ========================
function startGame() {
  const input = document.getElementById('frase-input').value.trim();
  if (!input || input.replace(/\s/g, '').length === 0) {
    document.getElementById('frase-input').focus();
    document.getElementById('frase-input').style.borderColor = '#ea5455';
    setTimeout(() => {
      document.getElementById('frase-input').style.borderColor = '';
    }, 800);
    return;
  }

  frase = input.toUpperCase();
  fraseNorm = normalizza(frase);
  lettereRivelate = new Set();

  buildTabellone();
  showScreen('screen-game');

  // Focus automatico sull'input lettera
  setTimeout(() => {
    document.getElementById('lettera-input').focus();
  }, 200);
}

// ========================
//  COSTRUISCE IL TABELLONE
// ========================
function buildTabellone() {
  const tabellone = document.getElementById('tabellone');
  tabellone.innerHTML = '';

  // Dividi la frase in parole
  const parole = frase.split(' ');
  const paroleNorm = fraseNorm.split(' ');

  // Calcola la larghezza disponibile per decidere il layout
  // Raggruppa le parole in righe da max ~14 celle ciascuna
  const MAX_PER_RIGA = 14;
  let righe = [];
  let rigaCorrente = [];
  let celleRiga = 0;

  for (let i = 0; i < parole.length; i++) {
    const len = parole[i].length;
    // Se la parola da sola supera il max, va da sola
    if (len > MAX_PER_RIGA) {
      if (rigaCorrente.length > 0) {
        righe.push(rigaCorrente);
        rigaCorrente = [];
        celleRiga = 0;
      }
      righe.push([{ parola: parole[i], parolaNorm: paroleNorm[i] }]);
    } else {
      // +1 per lo spazio tra parole (tranne prima)
      const aggiunta = rigaCorrente.length === 0 ? len : len + 1;
      if (celleRiga + aggiunta > MAX_PER_RIGA && rigaCorrente.length > 0) {
        righe.push(rigaCorrente);
        rigaCorrente = [];
        celleRiga = 0;
      }
      rigaCorrente.push({ parola: parole[i], parolaNorm: paroleNorm[i] });
      celleRiga += rigaCorrente.length === 1 ? len : aggiunta;
    }
  }
  if (rigaCorrente.length > 0) righe.push(rigaCorrente);

  // Crea le righe nel DOM
  righe.forEach(riga => {
    const lineaDiv = document.createElement('div');
    lineaDiv.className = 'linea-row';

    riga.forEach(({ parola, parolaNorm }) => {
      const parolaDiv = document.createElement('div');
      parolaDiv.className = 'parola-row';

      for (let i = 0; i < parola.length; i++) {
        const cella = document.createElement('div');
        cella.className = 'cella';
        cella.dataset.lettera = parola[i];
        cella.dataset.norm = parolaNorm[i];
        cella.textContent = parola[i];

        // Se la lettera è già rivelata (es. dopo nuova frase stessa sessione)
        if (lettereRivelate.has(parolaNorm[i])) {
          cella.classList.add('revealed');
        }

        parolaDiv.appendChild(cella);
      }

      lineaDiv.appendChild(parolaDiv);
    });

    tabellone.appendChild(lineaDiv);
  });

  // Reset UI
  document.getElementById('msg-feedback').className = 'feedback hidden';
  document.getElementById('msg-feedback').textContent = '';
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('lettera-input').value = '';
  document.getElementById('input-area').style.display = '';
}

// ========================
//  CONTROLLA LETTERA
// ========================
function checkLettera() {
  const inputEl = document.getElementById('lettera-input');
  const raw = inputEl.value.trim();

  if (!raw) {
    inputEl.focus();
    return;
  }

  const lettNorm = normalizza(raw);

  // Già provata
  if (lettereRivelate.has(lettNorm)) {
    mostraFeedback('Hai già provato questa lettera!', 'no');
    inputEl.value = '';
    inputEl.focus();
    return;
  }

  // Controlla se presente nella frase
  const presente = fraseNorm.includes(lettNorm);

  if (presente) {
    lettereRivelate.add(lettNorm);
    rivela(lettNorm);
    mostraFeedback('✔ Lettera presente!', 'ok');
    // Verifica vittoria
    if (haVinto()) {
      setTimeout(() => {
        winGame();
      }, 700);
      return;
    }
  } else {
    mostraFeedback('✘ Lettera non presente!', 'no');
  }

  inputEl.value = '';
  inputEl.focus();
}

// ========================
//  RIVELA CELLE
// ========================
function rivela(lettNorm) {
  const celle = document.querySelectorAll('.cella');
  let delay = 0;
  celle.forEach(cella => {
    if (cella.dataset.norm === lettNorm) {
      setTimeout(() => {
        cella.classList.add('revealed');
        // Flash verde brevemente
        cella.classList.add('flash-correct');
        setTimeout(() => cella.classList.remove('flash-correct'), 500);
      }, delay);
      delay += 80;
    }
  });
}

// ========================
//  CONTROLLA VITTORIA
// ========================
function haVinto() {
  const celle = document.querySelectorAll('.cella');
  for (const cella of celle) {
    if (!cella.classList.contains('revealed')) return false;
  }
  return true;
}

// ========================
//  MOSTRA FEEDBACK
// ========================
function mostraFeedback(testo, tipo) {
  const el = document.getElementById('msg-feedback');
  el.textContent = testo;
  el.className = 'feedback ' + tipo;

  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => {
    el.className = 'feedback hidden';
  }, 2000);
}

// ========================
//  VITTORIA
// ========================
function winGame() {
  document.getElementById('win-frase').textContent = frase;
  showScreen('screen-win');
}

// ========================
//  NUOVA FRASE
// ========================
function newGame() {
  frase = '';
  fraseNorm = '';
  lettereRivelate = new Set();
  document.getElementById('frase-input').value = '';
  showScreen('screen-input');
  setTimeout(() => {
    document.getElementById('frase-input').focus();
  }, 100);
}

// ========================
//  MOSTRA UNA SCHERMATA
// ========================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========================
//  KEYBOARD SUPPORT
// ========================
document.addEventListener('keydown', (e) => {
  // Enter su input frase → avvia
  if (e.key === 'Enter') {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id === 'screen-input') {
      if (document.activeElement !== document.getElementById('frase-input')) {
        startGame();
      }
    } else if (activeScreen && activeScreen.id === 'screen-game') {
      checkLettera();
    }
  }

  // Ctrl+Enter su textarea → avvia
  if (e.key === 'Enter' && e.ctrlKey) {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id === 'screen-input') {
      startGame();
    }
  }
});

// Auto-uppercase sull'input lettera
document.addEventListener('DOMContentLoaded', () => {
  const letInput = document.getElementById('lettera-input');
  if (letInput) {
    letInput.addEventListener('input', function () {
      this.value = this.value.toUpperCase();
    });
    // Enter su input lettera → conferma
    letInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') checkLettera();
    });
  }

  // Ctrl+Enter per avviare dalla textarea
  const fraseInput = document.getElementById('frase-input');
  if (fraseInput) {
    fraseInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        startGame();
      }
    });
    fraseInput.addEventListener('input', function () {
      this.value = this.value.toUpperCase();
    });
  }
});