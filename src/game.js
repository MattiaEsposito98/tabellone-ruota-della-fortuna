(function () {
  const $ = id => document.getElementById(id);
  const cfg = window.GiroConfig;
  const state = window.GiroState;
  const letters = window.GiroLetters;
  const board = window.GiroBoard;
  const wheelUi = window.GiroWheel;
  const scoring = window.GiroScoring;
  const timers = window.GiroTimers;

  let setupCount = 3;
  let solveContext = 'round';

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    $(id).classList.add('active');
  }

  function closeModal(id) {
    $(id).classList.add('hidden');
  }

  function modal(title, html, actions) {
    $('info-title').textContent = title;
    $('info-text').innerHTML = html;
    const wrap = $('info-actions');
    wrap.innerHTML = '';
    (actions || [{ label: 'OK', kind: 'close' }]).forEach(action => {
      const btn = document.createElement('button');
      btn.className = action.secondary ? 'modal-cancel' : 'modal-close';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        closeModal('modal-info');
        if (action.onClick) action.onClick();
      });
      wrap.appendChild(btn);
    });
    $('modal-info').classList.remove('hidden');
  }

  function feedback(id, text, type) {
    const el = $(id);
    el.innerHTML = text;
    el.className = 'feedback ' + type;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.className = 'feedback hidden'; }, 3000);
  }

  function currentWheel() {
    return cfg.WHEELS[state.round.wheelIdx];
  }

  function currentPlayerName() {
    const player = state.match.players[state.round.current];
    return player ? player.name : '-';
  }

  function flashPlayerName() {
    const player = state.match.players[state.flash.current];
    return player ? player.name : '-';
  }

  function nextIndex(idx) {
    return (idx - 1 + state.match.players.length) % state.match.players.length;
  }

  function selectCount(n) {
    setupCount = n;
    document.querySelectorAll('.count-btn').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.n) === n));
    renderNameInputs();
  }

  function renderNameInputs() {
    const wrap = $('names-wrap');
    wrap.innerHTML = '';
    for (let i = 0; i < setupCount; i += 1) {
      const row = document.createElement('div');
      row.className = 'name-field';
      row.innerHTML = `<span class="name-idx">${i + 1}</span>
        <input class="name-input" maxlength="18" value="Giocatore ${i + 1}" />`;
      wrap.appendChild(row);
    }
  }

  function confirmSetup() {
    state.match.players = Array.from(document.querySelectorAll('.name-input')).map((input, idx) => ({
      name: input.value.trim() || `Giocatore ${idx + 1}`
    }));

    if (state.match.mode === 'main') {
      state.match.history = [];
      renderStarter();
      showScreen('screen-starter');
      return;
    }

    state.flash.current = 0;
    showScreen('screen-flash-input');
    setTimeout(() => $('flash-input').focus(), 80);
  }

  function renderStarter() {
    const list = $('starter-list');
    list.innerHTML = '';
    state.match.players.forEach((player, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = player.name;
      btn.addEventListener('click', () => {
        state.match.startingPlayer = idx;
        state.round.current = idx;
        renderRoundChoices();
        showScreen('screen-round');
      });
      list.appendChild(btn);
    });
  }

  function renderRoundChoices() {
    $('round-counter').textContent = `Round numero ${state.match.history.length + 1}`;
    const grid = $('round-grid');
    grid.innerHTML = '';
    cfg.WHEELS.forEach((wheel, idx) => {
      const btn = document.createElement('button');
      btn.className = 'round-card';
      btn.innerHTML = `<span class="round-num">${wheel.roman}</span><span class="round-label">${wheel.name}</span>`;
      btn.addEventListener('click', () => selectRound(idx));
      grid.appendChild(btn);
    });
  }

  function selectRound(idx) {
    state.round.wheelIdx = idx;
    $('round-roman').textContent = cfg.WHEELS[idx].roman;
    $('frase-input').value = '';
    showScreen('screen-input');
    setTimeout(() => $('frase-input').focus(), 80);
  }

  function startRound() {
    const phrase = $('frase-input').value.trim();
    if (!phrase) {
      $('frase-input').focus();
      return;
    }

    const wheelIdx = state.round.wheelIdx;
    const current = state.match.history.length === 0 ? state.match.startingPlayer : state.round.current;
    state.resetRound();
    state.round.wheelIdx = wheelIdx;
    state.round.current = current;
    state.round.phrase = phrase.toUpperCase();
    state.round.phraseNorm = letters.normalizeText(phrase);
    state.round.points = state.match.players.map(() => 0);
    state.round.oracleTokens = state.match.players.map(() => 0);
    state.round.rotation = -Math.PI / 2;

    board.renderBoard($('tabellone'), state.round.phrase, state.round.phraseNorm, state.round.revealed);
    wheelUi.resizeCanvas($('wheel-canvas'));
    wheelUi.draw($('wheel-canvas'), currentWheel(), state.round.rotation);
    renderScoreboard();
    hideWheelResult();
    setTurnState('spin');
    showScreen('screen-game');
  }

  function setTurnState(kind, label) {
    const spin = $('btn-spin');
    const input = $('lettera-input');
    const confirm = $('btn-lettera');
    const canSpin = kind === 'spin';

    spin.disabled = !canSpin;
    input.disabled = canSpin;
    confirm.disabled = canSpin;
    input.value = '';
    $('lettera-label').textContent = label || (canSpin ? 'Gira la ruota o usa una azione:' : 'Indovina una lettera:');
    $('btn-buy-vowel').disabled = !canSpin;
    $('btn-use-oracle').disabled = !canSpin || state.round.oracleTokens[state.round.current] <= 0;
    $('btn-solve').disabled = !canSpin;
    if (!canSpin) setTimeout(() => input.focus(), 60);
  }

  function nextTurn() {
    state.round.current = nextIndex(state.round.current);
    state.round.pending = null;
    renderScoreboard();
    setTurnState('spin');
  }

  function spinWheel() {
    if (state.round.spinning || state.round.pending) return;
    state.round.spinning = true;
    hideWheelResult();
    $('btn-spin').disabled = true;
    $('btn-spin').classList.add('spinning');
    wheelUi.spin({
      canvas: $('wheel-canvas'),
      wheel: currentWheel(),
      getRotation: () => state.round.rotation,
      setRotation: rotation => { state.round.rotation = rotation; },
      onDone: segment => {
        state.round.spinning = false;
        $('btn-spin').classList.remove('spinning');
        handleSegment(segment);
      }
    });
  }

  function handleSegment(segment) {
    const name = currentPlayerName();

    if (segment.type === 'points' || segment.type === 'mida' || segment.type === 'midaX2') {
      const value = segment.value;
      state.round.pending = { kind: 'score', value };
      showWheelResult(`${segment.label}: ${value} punti per consonante`, 'res-win');
      setTurnState('letter', 'Dichiara una consonante o compra una vocale:');
      return;
    }

    if (segment.type === 'oracolo') {
      handleOracleSegment();
      return;
    }

    if (segment.type === 'robin') {
      state.round.pending = { kind: 'robin' };
      showWheelResult('ROBIN: se indovini una consonante rubi il 50% agli avversari', 'res-special');
      setTurnState('letter', 'Dichiara una consonante per tentare il furto:');
      return;
    }

    if (segment.type === 'freeze') {
      handleNegativeSegment('FREEZE', `${name} perde il turno.`, () => nextTurn());
      return;
    }

    if (segment.type === 'alVerde') {
      handleNegativeSegment('AL VERDE', `${name} perde i punti del round e il turno.`, () => {
        state.round.points[state.round.current] = 0;
        renderScoreboard();
        nextTurn();
      });
      return;
    }

    if (segment.type === 'dimezza') {
      state.round.points[state.round.current] = Math.floor(state.round.points[state.round.current] / 2);
      renderScoreboard();
      showWheelResult(`DIMEZZA: punti del round dimezzati per ${name}`, 'res-bad');
      setTimeout(nextTurn, 800);
      return;
    }

    showWheelResult(`${segment.label}: gestisci manualmente`, 'res-special');
    setTurnState('spin');
  }

  function handleNegativeSegment(title, text, applyEffect) {
    const tokens = state.round.oracleTokens[state.round.current];
    if (tokens > 0) {
      modal(title, `${text}<br><br><b>${currentPlayerName()}</b> ha uno Scudo Oracolo. Vuole usarlo?`, [
        {
          label: 'Usa scudo',
          onClick: () => {
            state.round.oracleTokens[state.round.current] -= 1;
            renderScoreboard();
            showWheelResult(`${title} annullato con Scudo Oracolo`, 'res-special');
            setTurnState('spin');
          }
        },
        {
          label: 'Subisci effetto',
          secondary: true,
          onClick: applyEffect
        }
      ]);
      return;
    }

    showWheelResult(text, 'res-bad');
    setTimeout(applyEffect, 650);
  }

  function handleOracleSegment() {
    modal('ORACOLO', 'Valore del turno: <b>500 punti per consonante</b>.<br>Scegli se usarlo subito in Attacco oppure conservarlo.', [
      {
        label: 'Attacco',
        onClick: () => startOracleAttack(false)
      },
      {
        label: 'Conserva',
        secondary: true,
        onClick: () => {
          state.round.oracleTokens[state.round.current] += 1;
          state.round.pending = { kind: 'score', value: 500 };
          renderScoreboard();
          showWheelResult('Gettone Oracolo conservato. Ora chiama una consonante da 500.', 'res-special');
          setTurnState('letter', 'Dichiara una consonante da 500:');
        }
      }
    ]);
  }

  function startOracleAttack(consumesStoredToken) {
    if (consumesStoredToken) {
      state.round.oracleTokens[state.round.current] -= 1;
      renderScoreboard();
    }
    state.round.pending = {
      kind: 'oracleAttack',
      value: 500,
      phase: 'ask',
      askedLetter: '',
      consumesStoredToken
    };
    showWheelResult('ORACOLO Attacco: chiedi una consonante alla regia.', 'res-special');
    setTurnState('letter', 'Consonante da chiedere alla regia:');
  }

  function buyVowelAction() {
    if (state.round.pending) return;
    state.round.pending = { kind: 'buyVowel' };
    setTurnState('letter', 'Compra una vocale per 400 punti:');
  }

  function checkLetter() {
    const letter = letters.normalizeLetter($('lettera-input').value);
    if (!letter || !letters.isLetter(letter)) {
      $('lettera-input').focus();
      return;
    }

    if (state.round.called.has(letter)) {
      feedback('msg-feedback', 'Lettera già detta: passa il turno.', 'no');
      nextTurn();
      return;
    }

    const pending = state.round.pending;
    if (!pending) return;

    if (pending.kind === 'oracleAttack') {
      handleOracleLetter(letter);
      return;
    }

    if (letters.isVowel(letter) || pending.kind === 'buyVowel') {
      handleVowel(letter);
      return;
    }

    if (!letters.isConsonant(letter)) return;

    if (pending.kind === 'robin') {
      handleRobinLetter(letter);
      return;
    }

    resolveScoredConsonant(letter, pending.value);
  }

  function handleOracleLetter(letter) {
    const pending = state.round.pending;
    if (!letters.isConsonant(letter)) {
      feedback('msg-feedback', 'Con Oracolo serve una consonante.', 'no');
      return;
    }

    if (pending.phase === 'ask') {
      pending.askedLetter = letter;
      modal('Risposta regia', `La consonante richiesta è <b>${letter}</b>. Cosa risponde la regia?`, [
        {
          label: 'Sì, presente',
          onClick: () => {
            pending.phase = 'call';
            feedback('msg-feedback', 'Regia: Sì. Ora dichiara la consonante definitiva.', 'ok');
            setTurnState('letter', 'Consonante definitiva da chiamare:');
          }
        },
        {
          label: 'No, assente',
          secondary: true,
          onClick: () => {
            pending.phase = 'call';
            feedback('msg-feedback', 'Regia: No. Puoi dichiarare un’altra consonante.', 'no');
            setTurnState('letter', 'Consonante definitiva da chiamare:');
          }
        }
      ]);
      return;
    }

    resolveScoredConsonant(letter, pending.value, true);
  }

  function handleVowel(letter) {
    if (!letters.isVowel(letter)) {
      feedback('msg-feedback', 'Qui puoi inserire solo una vocale.', 'no');
      return;
    }
    const cur = state.round.current;
    if (state.round.points[cur] < cfg.VOWEL_COST) {
      feedback('msg-feedback', 'Servono almeno 400 punti nel round per comprare una vocale.', 'no');
      $('lettera-input').value = '';
      return;
    }

    state.round.called.add(letter);
    state.round.points[cur] -= cfg.VOWEL_COST;
    const count = letters.countInPhrase(state.round.phraseNorm, letter);
    if (count > 0) {
      state.round.revealed.add(letter);
      board.revealLetter(letter);
      feedback('msg-feedback', `Vocale ${letter}: -400 punti, ${count} occorrenza/e.`, 'ok');
      renderScoreboard();
      if (board.isComplete(state.round.phraseNorm, state.round.revealed)) {
        setTimeout(() => endRound(cur, 'completed'), 700);
        return;
      }
      state.round.pending = null;
      setTurnState('spin');
    } else {
      feedback('msg-feedback', `Vocale ${letter} assente: -400 e passa il turno.`, 'no');
      renderScoreboard();
      nextTurn();
    }
  }

  function resolveScoredConsonant(letter, value, fromOracle) {
    if (!letters.isConsonant(letter)) {
      feedback('msg-feedback', 'Serve una consonante.', 'no');
      return;
    }

    state.round.called.add(letter);
    const count = letters.countInPhrase(state.round.phraseNorm, letter);
    if (count > 0) {
      const gain = value * count;
      state.round.revealed.add(letter);
      state.round.points[state.round.current] += gain;
      board.revealLetter(letter);
      feedback('msg-feedback', `${letter}: ${count} × ${value} = +${gain}`, 'ok');
      renderScoreboard();
      if (board.isComplete(state.round.phraseNorm, state.round.revealed)) {
        setTimeout(() => endRound(state.round.current, 'completed'), 700);
        return;
      }
      state.round.pending = null;
      setTurnState('spin');
      return;
    }

    feedback('msg-feedback', `${letter} assente: passa il turno${fromOracle ? ' e Oracolo consumato' : ''}.`, 'no');
    nextTurn();
  }

  function handleRobinLetter(letter) {
    if (!letters.isConsonant(letter)) {
      feedback('msg-feedback', 'Con Robin serve una consonante.', 'no');
      return;
    }

    state.round.called.add(letter);
    const count = letters.countInPhrase(state.round.phraseNorm, letter);
    if (count > 0) {
      state.round.revealed.add(letter);
      board.revealLetter(letter);
      const stolen = scoring.stealHalfFromOpponents(state.round, state.round.current);
      feedback('msg-feedback', `${letter} presente: Robin ruba ${stolen} punti.`, 'ok');
      renderScoreboard();
      if (board.isComplete(state.round.phraseNorm, state.round.revealed)) {
        setTimeout(() => endRound(state.round.current, 'completed'), 700);
        return;
      }
      state.round.pending = null;
      setTurnState('spin');
      return;
    }

    feedback('msg-feedback', `${letter} assente: furto fallito e passa il turno.`, 'no');
    nextTurn();
  }

  function openSolve(context) {
    solveContext = context || 'round';
    $('solve-name').textContent = solveContext === 'flash' ? flashPlayerName() : currentPlayerName();
    $('solve-input').value = '';
    $('modal-solve').classList.remove('hidden');
    setTimeout(() => $('solve-input').focus(), 60);
  }

  function confirmSolve() {
    const answer = $('solve-input').value;
    closeModal('modal-solve');
    if (solveContext === 'flash') {
      if (letters.solutionEquals(answer, state.flash.phraseNorm)) {
        board.revealAll(state.flash.revealed);
        modal('Round Flash', `${flashPlayerName()} vince lo spareggio.`, [{ label: 'OK' }]);
      } else {
        flashNextTurn();
      }
      return;
    }

    if (letters.solutionEquals(answer, state.round.phraseNorm)) {
      state.round.points[state.round.current] += cfg.SOLVE_BONUS;
      renderScoreboard();
      board.revealAll(state.round.revealed);
      setTimeout(() => endRound(state.round.current, 'solved'), 400);
    } else {
      feedback('msg-feedback', 'Soluzione errata: passa il turno.', 'no');
      nextTurn();
    }
  }

  function revealSolution() {
    modal('Mostra soluzione', 'Rivelare la frase senza assegnare il round?', [
      {
        label: 'Rivela',
        onClick: () => {
          board.revealAll(state.round.revealed);
          endRound(null, 'shown');
        }
      },
      { label: 'Annulla', secondary: true }
    ]);
  }

  function chooseManualWinner() {
    const actions = state.match.players.map((player, idx) => ({
      label: player.name,
      onClick: () => endRound(idx, 'manual')
    }));
    actions.push({ label: 'Nessun vincitore', secondary: true, onClick: () => endRound(null, 'manual') });
    modal('Assegna round', 'Scegli chi deve prendere i punti del round.', actions);
  }

  function endRound(winnerIdx, reason) {
    const wheelRoman = currentWheel().roman;
    if (winnerIdx === null || winnerIdx === undefined) {
      state.match.history.push({ wheel: wheelRoman, reason, winnerIdx: null, points: state.match.players.map(() => 0) });
    } else {
      scoring.addHistory(state.match, wheelRoman, state.round, winnerIdx, reason);
    }

    const winnerName = winnerIdx === null || winnerIdx === undefined ? 'Nessun vincitore' : state.match.players[winnerIdx].name;
    $('result-title').textContent = reason === 'solved' ? 'FRASE RISOLTA!' : reason === 'completed' ? 'FRASE COMPLETATA!' : 'ROUND FINITO';
    $('result-frase').textContent = state.round.phrase;
    buildResultTable(winnerName);
    showScreen('screen-result');
  }

  function buildResultTable(winnerName) {
    const cont = $('result-tables');
    const totals = scoring.totalsForPlayers(state.match);
    let head = '<th>Partecipante</th>';
    state.match.history.forEach((item, idx) => { head += `<th>R${idx + 1}<br><small>${item.wheel}</small></th>`; });
    head += '<th>Totale</th>';

    let rows = '';
    state.match.players.forEach((player, idx) => {
      let cells = `<td class="pname">${player.name}</td>`;
      state.match.history.forEach(item => { cells += `<td>${item.points[idx] || 0}</td>`; });
      cells += `<td class="ptot">${totals[idx]}</td>`;
      rows += `<tr>${cells}</tr>`;
    });

    cont.innerHTML = `
      <h3 class="result-sub">Vincitore round: ${winnerName}</h3>
      <div class="table-scroll">
        <table class="score-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  }

  function nextRound() {
    state.resetRound();
    state.round.current = state.match.startingPlayer;
    renderRoundChoices();
    showScreen('screen-round');
  }

  function renderScoreboard() {
    $('turn-name').textContent = currentPlayerName();
    const totals = scoring.totalsForPlayers(state.match);
    const list = $('players-list');
    list.innerHTML = '';
    state.match.players.forEach((player, idx) => {
      const card = document.createElement('div');
      card.className = 'player-card' + (idx === state.round.current ? ' active' : '');
      const tokens = state.round.oracleTokens[idx] || 0;
      card.innerHTML = `
        <div class="player-top">
          <span class="player-name">${idx === state.round.current ? '▶ ' : ''}${player.name}</span>
          ${tokens ? `<span class="jolly-badge">Oracolo x${tokens}</span>` : ''}
        </div>
        <div class="player-points">${state.round.points[idx] || 0}<span class="pp-label"> pt round</span></div>
        <div class="player-total">Totale gioco: ${totals[idx] + (state.round.points[idx] || 0)}</div>`;
      list.appendChild(card);
    });
    renderManualButtons();
    $('btn-use-oracle').disabled = state.round.oracleTokens[state.round.current] <= 0 || !!state.round.pending;
  }

  function renderManualButtons() {
    const wrap = $('manual-buttons');
    wrap.innerHTML = '';
    state.match.players.forEach((player, idx) => {
      const row = document.createElement('div');
      row.className = 'manual-row';
      row.innerHTML = `<span>${player.name}</span>`;
      const minus = document.createElement('button');
      minus.textContent = '-100';
      minus.addEventListener('click', () => {
        state.round.points[idx] = Math.max(0, (state.round.points[idx] || 0) - 100);
        renderScoreboard();
      });
      const plus = document.createElement('button');
      plus.textContent = '+100';
      plus.addEventListener('click', () => {
        state.round.points[idx] = (state.round.points[idx] || 0) + 100;
        renderScoreboard();
      });
      row.append(minus, plus);
      wrap.appendChild(row);
    });
  }

  function showWheelResult(text, cls) {
    const el = $('wheel-result');
    el.innerHTML = text;
    el.className = 'wheel-result ' + cls;
  }

  function hideWheelResult() {
    $('wheel-result').className = 'wheel-result hidden';
  }

  function startMode(mode) {
    state.resetMatch();
    state.match.mode = mode;
    if (mode === 'finale') {
      showScreen('screen-final-menu');
      return;
    }
    selectCount(mode === 'main' ? 3 : 2);
    showScreen('screen-setup');
  }

  function goHome() {
    timers.stop();
    state.resetMatch();
    showScreen('screen-home');
  }

  function startFlash() {
    const phrase = $('flash-input').value.trim();
    if (!phrase) {
      $('flash-input').focus();
      return;
    }
    state.resetFlash();
    state.flash.phrase = phrase.toUpperCase();
    state.flash.phraseNorm = letters.normalizeText(phrase);
    state.flash.current = 0;
    board.renderBoard($('flash-board'), state.flash.phrase, state.flash.phraseNorm, state.flash.revealed);
    timers.reset(cfg.TIMERS.flash, $('flash-timer'));
    renderFlashPlayers();
    showScreen('screen-flash-game');
  }

  function renderFlashPlayers() {
    $('flash-turn-name').textContent = flashPlayerName();
    const list = $('flash-players-list');
    list.innerHTML = '';
    state.match.players.forEach((player, idx) => {
      const card = document.createElement('div');
      card.className = 'player-card' + (idx === state.flash.current ? ' active' : '');
      card.innerHTML = `<div class="player-top"><span class="player-name">${idx === state.flash.current ? '▶ ' : ''}${player.name}</span></div>`;
      list.appendChild(card);
    });
  }

  function flashNextTurn() {
    state.flash.current = nextIndex(state.flash.current);
    renderFlashPlayers();
  }

  function checkFlashLetter() {
    const letter = letters.normalizeLetter($('flash-letter').value);
    if (!letter || !letters.isLetter(letter)) return;
    $('flash-letter').value = '';
    if (state.flash.called.has(letter)) {
      feedback('flash-feedback', 'Lettera già detta: passa il turno.', 'no');
      flashNextTurn();
      return;
    }
    state.flash.called.add(letter);
    const count = letters.countInPhrase(state.flash.phraseNorm, letter);
    if (count > 0) {
      state.flash.revealed.add(letter);
      board.revealLetter(letter);
      feedback('flash-feedback', `${letter} presente. La lettera resta sul tabellone.`, 'ok');
    } else {
      feedback('flash-feedback', `${letter} assente: passa il turno.`, 'no');
      flashNextTurn();
    }
  }

  function chooseFinal(type) {
    state.resetFinale();
    state.finale.type = type;
    $('final-input-title').textContent = type === 'board1' ? 'TABELLONE 1' : 'TASTIERA ROTTA';
    $('final-phrase-label').textContent = type === 'board1' ? 'Frase finale' : 'Frase cifrata da mostrare';
    $('final-phrase').value = '';
    $('final-solution').value = '';
    showScreen('screen-final-input');
  }

  function openFinalBoard() {
    const phrase = $('final-phrase').value.trim();
    if (!phrase) {
      $('final-phrase').focus();
      return;
    }
    state.finale.phrase = phrase.toUpperCase();
    state.finale.phraseNorm = letters.normalizeText(phrase);
    state.finale.solution = $('final-solution').value.trim().toUpperCase();
    const isKeyboardBroken = state.finale.type === 'board2';
    board.renderBoard($('final-board'), state.finale.phrase, state.finale.phraseNorm, state.finale.revealed, { open: isKeyboardBroken });
    renderQwerty(!isKeyboardBroken);
    timers.reset(cfg.TIMERS.final, $('final-timer'));
    showScreen('screen-final-game');
  }

  function renderQwerty(clickable) {
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const wrap = $('qwerty');
    wrap.innerHTML = '';
    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'qwerty-row';
      row.split('').forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch;
        btn.disabled = !clickable;
        btn.addEventListener('click', () => {
          state.finale.revealed.add(ch);
          board.revealLetter(ch);
        });
        rowEl.appendChild(btn);
      });
      wrap.appendChild(rowEl);
    });
  }

  function showFinalSolution() {
    const solution = state.finale.solution || state.finale.phrase;
    modal('Soluzione', `<b>${solution}</b>`);
  }

  function bindEvents() {
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => startMode(btn.dataset.mode));
    });
    document.querySelectorAll('[data-home]').forEach(btn => btn.addEventListener('click', goHome));
    document.querySelectorAll('.count-btn').forEach(btn => btn.addEventListener('click', () => selectCount(Number(btn.dataset.n))));
    $('btn-setup').addEventListener('click', confirmSetup);
    $('btn-back-round').addEventListener('click', () => showScreen('screen-round'));
    $('btn-start').addEventListener('click', startRound);
    $('btn-spin').addEventListener('click', spinWheel);
    $('btn-lettera').addEventListener('click', checkLetter);
    $('lettera-input').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
    $('lettera-input').addEventListener('keydown', e => { if (e.key === 'Enter') checkLetter(); });
    $('frase-input').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
    $('btn-buy-vowel').addEventListener('click', buyVowelAction);
    $('btn-use-oracle').addEventListener('click', () => startOracleAttack(true));
    $('btn-solve').addEventListener('click', () => openSolve('round'));
    $('btn-solve-cancel').addEventListener('click', () => closeModal('modal-solve'));
    $('btn-solve-confirm').addEventListener('click', confirmSolve);
    $('solve-input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmSolve(); } });
    $('btn-reveal').addEventListener('click', revealSolution);
    $('btn-manual-winner').addEventListener('click', chooseManualWinner);
    $('btn-next-turn').addEventListener('click', nextTurn);
    $('btn-newround-game').addEventListener('click', nextRound);
    $('btn-newmatch-game').addEventListener('click', goHome);
    $('btn-result-next').addEventListener('click', nextRound);

    $('btn-flash-start').addEventListener('click', startFlash);
    $('flash-input').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
    $('flash-letter').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
    $('flash-letter').addEventListener('keydown', e => { if (e.key === 'Enter') checkFlashLetter(); });
    $('btn-flash-letter').addEventListener('click', checkFlashLetter);
    $('btn-flash-timer').addEventListener('click', () => timers.start(cfg.TIMERS.flash, $('flash-timer'), () => modal('Tempo scaduto', 'Passa il turno.', [{ label: 'OK', onClick: flashNextTurn }])));
    $('btn-flash-reset').addEventListener('click', () => timers.reset(cfg.TIMERS.flash, $('flash-timer')));
    $('btn-flash-solve').addEventListener('click', () => openSolve('flash'));
    $('btn-flash-next').addEventListener('click', flashNextTurn);

    document.querySelectorAll('.final-choice').forEach(btn => btn.addEventListener('click', () => chooseFinal(btn.dataset.final)));
    $('btn-final-back').addEventListener('click', () => showScreen('screen-final-menu'));
    $('btn-final-open').addEventListener('click', openFinalBoard);
    $('final-phrase').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
    $('final-solution').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
    $('btn-final-timer').addEventListener('click', () => timers.start(cfg.TIMERS.final, $('final-timer'), () => modal('Tempo scaduto', 'Timer finale terminato.')));
    $('btn-final-reset').addEventListener('click', () => timers.reset(cfg.TIMERS.final, $('final-timer')));
    $('btn-final-solution').addEventListener('click', showFinalSolution);
    $('btn-final-edit').addEventListener('click', () => showScreen('screen-final-input'));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
      }
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });

    window.addEventListener('resize', () => {
      if ($('screen-game').classList.contains('active')) {
        wheelUi.resizeCanvas($('wheel-canvas'));
        wheelUi.draw($('wheel-canvas'), currentWheel(), state.round.rotation);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    selectCount(3);
    timers.reset(cfg.TIMERS.flash, $('flash-timer'));
    timers.reset(cfg.TIMERS.final, $('final-timer'));
  });
})();
