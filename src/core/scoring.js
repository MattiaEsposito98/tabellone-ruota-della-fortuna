(function () {
  function totalsForPlayers(match) {
    return match.players.map((_, playerIdx) =>
      match.history.reduce((sum, item) => sum + (item.points[playerIdx] || 0), 0)
    );
  }

  function roundWinnerPoints(round, winnerIdx) {
    return round.points.map((points, idx) => (idx === winnerIdx ? points : 0));
  }

  function addHistory(match, wheelRoman, round, winnerIdx, reason) {
    const savedPoints = roundWinnerPoints(round, winnerIdx);
    match.history.push({
      wheel: wheelRoman,
      reason,
      winnerIdx,
      points: savedPoints
    });
  }

  function stealHalfFromOpponents(round, currentIdx) {
    let total = 0;
    round.points.forEach((points, idx) => {
      if (idx === currentIdx) return;
      const stolen = Math.floor(points * 0.5);
      round.points[idx] -= stolen;
      total += stolen;
    });
    round.points[currentIdx] += total;
    return total;
  }

  window.GiroScoring = {
    totalsForPlayers,
    roundWinnerPoints,
    addHistory,
    stealHalfFromOpponents
  };
})();
