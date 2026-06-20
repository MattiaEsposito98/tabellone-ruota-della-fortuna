(function () {
  let timerId = null;
  let remaining = 0;

  function stop() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function render(display) {
    display.textContent = String(remaining).padStart(2, '0');
    display.classList.toggle('danger', remaining <= 5);
  }

  function start(seconds, display, onEnd) {
    stop();
    remaining = seconds;
    render(display);
    timerId = setInterval(() => {
      remaining -= 1;
      render(display);
      if (remaining <= 0) {
        stop();
        if (onEnd) onEnd();
      }
    }, 1000);
  }

  function reset(seconds, display) {
    stop();
    remaining = seconds;
    render(display);
  }

  window.GiroTimers = {
    start,
    stop,
    reset
  };
})();
