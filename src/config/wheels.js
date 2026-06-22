(function () {
  const COLORS = {
    gold: { bg: '#f0a12a', tx: '#1a1a1a' },
    tan: { bg: '#d6c78a', tx: '#1a1a1a' },
    navy: { bg: '#2e3b66', tx: '#ffffff' },
    steel: { bg: '#9aa7bd', tx: '#1a1a1a' },
    olive: { bg: '#6b6248', tx: '#ffffff' },
    cream: { bg: '#d8cf77', tx: '#1a1a1a' },
    black: { bg: '#151515', tx: '#ffffff' },
    white: { bg: '#f5f5f5', tx: '#1a1a1a' },
    orange: { bg: '#e0641e', tx: '#1a1a1a' },
    red: { bg: '#d85032', tx: '#1a1a1a' },
    green: { bg: '#1d7438', tx: '#ffffff' },
    brown: { bg: '#5a5036', tx: '#ffffff' }
  };

  const numberColors = ['gold', 'tan', 'steel', 'navy', 'cream', 'olive'];

  function point(value, color) {
    const col = color || numberColors[Math.abs(value / 100) % numberColors.length];
    return { type: 'points', label: String(value), value, col };
  }

  function special(label, type, col, value) {
    return { type, label, value: value || 0, col };
  }

  function segment(item) {
    if (typeof item === 'object' && item.item !== undefined) {
      const base = segment(item.item);
      base.col = item.col || base.col;
      return base;
    }
    if (typeof item === 'number') return point(item);
    if (item === 'FREEZE') return special('FREEZE', 'freeze', 'white');
    if (item === 'AL VERDE') return special('AL VERDE', 'alVerde', 'green');
    if (item === 'MIDA') return special('MIDA', 'mida', 'brown', 1000);
    if (item === 'MIDA X2') return special('MIDA X2', 'midaX2', 'brown', 2000);
    if (item === 'ORACOLO') return special('ORACOLO', 'oracolo', 'brown', 500);
    if (item === 'ROBIN') return special('ROBIN', 'robin', 'orange');
    if (item === 'DIMEZZA') return special('DIMEZZA', 'dimezza', 'orange');
    return special(String(item), 'manual', 'white');
  }

  function c(item, col) {
    return { item, col };
  }

  function wheel(id, roman, name, rawSegments) {
    return {
      id,
      roman,
      name,
      segments: rawSegments.map(segment)
    };
  }

  const WHEELS = [
    wheel('round1', 'I', 'Round I', [
      c('AL VERDE', 'green'), c(300, 'cream'), c(100, 'gold'), c(700, 'steel'),
      c(400, 'navy'), c(500, 'brown'), c('FREEZE', 'white'), c(500, 'cream'),
      c(200, 'gold'), c(400, 'steel'), c(300, 'navy'), c(500, 'brown'),
      c('AL VERDE', 'green'), c(100, 'cream'), c(800, 'gold'), c(200, 'steel'),
      c(500, 'brown'), c(300, 'navy'), c('FREEZE', 'white'), c(400, 'cream'),
      c(100, 'gold'), c(300, 'red'), c(500, 'steel'), c(200, 'navy')
    ]),
    wheel('round2', 'II', 'Round II', [
      c('FREEZE', 'white'), c(400, 'cream'), c(100, 'gold'), c('ORACOLO', 'red'),
      c(500, 'steel'), c(200, 'navy'), c('AL VERDE', 'green'), c(300, 'cream'),
      c(100, 'gold'), c(700, 'steel'), c(400, 'navy'), c('MIDA', 'brown'),
      c('FREEZE', 'white'), c(500, 'cream'), c(200, 'gold'), c('ORACOLO', 'red'),
      c(300, 'navy'), c('MIDA', 'brown'), c('AL VERDE', 'green'), c(100, 'cream'),
      c(800, 'gold'), c(200, 'steel'), c('MIDA', 'brown'), c(300, 'navy')
    ]),
    // wheel('round2', 'II', 'Round II', [
    //   c('ORACOLO', 'red'), c('ORACOLO', 'red'), c('ORACOLO', 'red'), c('ORACOLO', 'red'),
    //   c('ORACOLO', 'red'), c('ORACOLO', 'red'), c('ORACOLO', 'red'), c('ORACOLO', 'red'),
    //   c('AL VERDE', 'green'), c('AL VERDE', 'green'), c('AL VERDE', 'green'), c('AL VERDE', 'green'),
    //   c('FREEZE', 'white'), c('AL VERDE', 'green'), c(200, 'gold'), c('ORACOLO', 'red'),
    //   c(300, 'navy'), c('MIDA', 'brown'), c('AL VERDE', 'green'), c(100, 'cream'),
    //   c(800, 'gold'), c(200, 'steel'), c('MIDA', 'brown'), c(300, 'navy')
    // ]),

    //Da produzione
    wheel('round3', 'III', 'Round III', [
      c('ROBIN', 'red'), c(500, 'steel'), c(200, 'navy'), c('AL VERDE', 'green'),
      c(300, 'cream'), c(100, 'gold'), c(700, 'steel'), c(400, 'navy'),
      c('MIDA', 'brown'), c('FREEZE', 'white'), c(500, 'cream'), c(200, 'gold'),
      c('ROBIN', 'red'), c(300, 'navy'), c('MIDA', 'brown'), c('AL VERDE', 'green'),
      c(100, 'cream'), c(800, 'gold'), c(200, 'steel'), c('MIDA', 'brown'),
      c(300, 'navy'), c('FREEZE', 'white'), c(400, 'cream'), c(100, 'gold')
    ]),

    //Per testare
    // wheel('round3', 'III', 'Round III', [
    //   c('ROBIN', 'red'), c('ROBIN', 'red'), c('ROBIN', 'red'), c('ROBIN', 'red'),
    //   c('ROBIN', 'red'), c('ROBIN', 'red'), c('ROBIN', 'red'), c('ROBIN', 'red'),
    //   c('AL VERDE', 'green'), c('AL VERDE', 'green'), c('FREEZE', 'white'), c('FREEZE', 'white'),
    //   c('ROBIN', 'red'), c('ROBIN', 'red'), c(200, 'gold'), c(300, 'navy'),
    //   c('MIDA', 'brown'), c('AL VERDE', 'green'), c(100, 'cream'), c(800, 'gold'),
    //   c('ROBIN', 'red'), c('ROBIN', 'red'), c(400, 'cream'), c(100, 'gold')
    // ]),
    wheel('round4', 'IV', 'Round IV', [
      c(1000, 'steel'), c(400, 'navy'), c('AL VERDE', 'green'), c(600, 'cream'),
      c(200, 'gold'), c(1400, 'steel'), c(800, 'navy'), c('MIDA X2', 'brown'),
      c('FREEZE', 'white'), c(1000, 'cream'), c(400, 'gold'), c('DIMEZZA', 'red'),
      c(600, 'navy'), c('MIDA X2', 'brown'), c('AL VERDE', 'green'), c(200, 'cream'),
      c(1600, 'gold'), c(400, 'steel'), c('MIDA X2', 'brown'), c(600, 'navy'),
      c('FREEZE', 'white'), c(800, 'cream'), c(200, 'gold'), c('DIMEZZA', 'red')
    ])
  ];

  window.GiroConfig = {
    COLORS,
    WHEELS,
    VOWEL_COST: 400,
    SOLVE_BONUS: 1000,
    TIMERS: {
      flash: 5,
      final: 20
    }
  };
})();
