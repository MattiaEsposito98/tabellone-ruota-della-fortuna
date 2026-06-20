(function () {
  function colorOf(segment) {
    return GiroConfig.COLORS[segment.col] || GiroConfig.COLORS.gold;
  }

  function resizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 440 * dpr;
    canvas.height = 440 * dpr;
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(canvas, wheel, rotation) {
    if (!canvas || !wheel) return;
    const ctx = canvas.getContext('2d');
    const size = 440;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 3;
    const segments = wheel.segments;
    const arc = (Math.PI * 2) / segments.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    segments.forEach((segment, idx) => {
      const start = idx * arc;
      const colors = colorOf(segment);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, start + arc);
      ctx.closePath();
      ctx.fillStyle = colors.bg;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colors.tx;
      const isSpecial = segment.type !== 'points';
      const fontSize = isSpecial ? Math.max(10, Math.round(radius * (segment.label.length > 7 ? 0.052 : 0.068))) : 22;
      ctx.font = '900 ' + fontSize + 'px Arial, sans-serif';
      ctx.fillText(segment.label, radius - 12, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#182033';
    ctx.stroke();
    ctx.restore();
  }

  function resultAtPointer(wheel, rotation) {
    const arc = (Math.PI * 2) / wheel.segments.length;
    const pointer = -Math.PI / 2;
    let rel = (pointer - rotation) % (Math.PI * 2);
    if (rel < 0) rel += Math.PI * 2;
    return wheel.segments[Math.floor(rel / arc) % wheel.segments.length];
  }

  function spin({ canvas, wheel, getRotation, setRotation, onDone }) {
    const startRot = getRotation();
    const turns = 5 + Math.floor(Math.random() * 4);
    const extra = Math.random() * Math.PI * 2;
    const total = turns * Math.PI * 2 + extra;
    const duration = 4200;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const rotation = startRot + total * ease(progress);
      setRotation(rotation);
      draw(canvas, wheel, rotation);
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone(resultAtPointer(wheel, rotation));
      }
    }

    requestAnimationFrame(frame);
  }

  window.GiroWheel = {
    resizeCanvas,
    draw,
    spin
  };
})();
