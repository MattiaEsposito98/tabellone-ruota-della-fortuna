(function () {
  function emptyMatch() {
    return {
      mode: 'home',
      players: [],
      history: [],
      startingPlayer: 0
    };
  }

  function emptyRound() {
    return {
      wheelIdx: 0,
      phrase: '',
      phraseNorm: '',
      theme: '',
      revealed: new Set(),
      called: new Set(),
      points: [],
      oracleTokens: [],
      oracleModes: [],
      oracleAttackLocked: [],
      current: 0,
      pending: null,
      spinning: false,
      rotation: -Math.PI / 2
    };
  }

  function emptyFlash() {
    return {
      phrase: '',
      phraseNorm: '',
      theme: '',
      revealed: new Set(),
      called: new Set(),
      current: 0
    };
  }

  function emptyFinale() {
    return {
      type: 'board1',
      phrase: '',
      phraseNorm: '',
      solution: '',
      solutionNorm: '',
      theme: '',
      revealed: new Set()
    };
  }

  window.GiroState = {
    match: emptyMatch(),
    round: emptyRound(),
    flash: emptyFlash(),
    finale: emptyFinale(),
    resetMatch() {
      this.match = emptyMatch();
      this.round = emptyRound();
      this.flash = emptyFlash();
      this.finale = emptyFinale();
    },
    resetRound() {
      this.round = emptyRound();
    },
    resetFlash() {
      this.flash = emptyFlash();
    },
    resetFinale() {
      this.finale = emptyFinale();
    }
  };
})();
