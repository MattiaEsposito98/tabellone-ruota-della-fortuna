(function () {
  const COLORS = {
    gold: { bg: '#f0a500', tx: '#1a1a1a' },
    tan: { bg: '#d6c78a', tx: '#1a1a1a' },
    navy: { bg: '#2e3b66', tx: '#ffffff' },
    steel: { bg: '#9aa7bd', tx: '#1a1a1a' },
    olive: { bg: '#6b6248', tx: '#ffffff' },
    cream: { bg: '#e8e2cf', tx: '#1a1a1a' },
    black: { bg: '#151515', tx: '#ffffff' },
    white: { bg: '#f5f5f5', tx: '#1a1a1a' },
    orange: { bg: '#e0641e', tx: '#ffffff' },
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
      'AL VERDE', 300, 100, 700, 400, 500, 'FREEZE', 500,
      200, 400, 300, 500, 'AL VERDE', 100, 800, 200,
      500, 300, 'FREEZE', 400, 100, 300, 500, 200
    ]),
    wheel('round2', 'II', 'Round II', [
      'FREEZE', 400, 100, 'ORACOLO', 500, 200, 'AL VERDE', 300,
      100, 700, 400, 'MIDA', 'FREEZE', 500, 200, 'ORACOLO',
      300, 'MIDA', 'AL VERDE', 100, 800, 200, 'MIDA', 300
    ]),
    wheel('round3', 'III', 'Round III', [
      'ROBIN', 500, 200, 'AL VERDE', 300, 100, 700, 400,
      'MIDA', 'FREEZE', 500, 200, 'ROBIN', 300, 'MIDA', 'AL VERDE',
      100, 800, 200, 'MIDA', 300, 'FREEZE', 400, 100
    ]),
    wheel('round4', 'IV', 'Round IV', [
      1000, 400, 'AL VERDE', 600, 200, 1400, 800, 'MIDA X2',
      'FREEZE', 1000, 400, 'DIMEZZA', 600, 'MIDA X2', 'AL VERDE', 200,
      1600, 400, 'MIDA X2', 600, 'FREEZE', 800, 200, 'DIMEZZA'
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
