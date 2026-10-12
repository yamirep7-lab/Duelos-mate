// El resultado esperado depende de la diferencia de ELO: ganarle a un rival más fuerte suma más puntos.
function newRatings(rw, rl, k = 32) {
  const expected = 1 / (1 + 10 ** ((rl - rw) / 400));
  const d = Math.round(k * (1 - expected));
  return [rw + d, Math.max(100, rl - d)];
}
module.exports = { newRatings };
