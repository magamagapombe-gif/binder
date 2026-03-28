/**
 * Elo ranking utility for Binder
 *
 * K-factor: how much a single swipe moves the score
 *   - K=32  for new users (< 100 swipes received) — bigger swings to calibrate fast
 *   - K=16  for established profiles
 *
 * Expected score formula (standard chess Elo):
 *   E = 1 / (1 + 10^((opponentRating - myRating) / 400))
 *
 * Super-like counts as a stronger signal: weight 1.5 instead of 1
 */

const K_NEW  = 32;
const K_EST  = 16;
const DEFAULT_ELO = 1000;

function expectedScore(myElo, opponentElo) {
  return 1 / (1 + Math.pow(10, (opponentElo - myElo) / 400));
}

/**
 * Calculate new Elo for the target profile after being swiped on.
 *
 * @param {number} targetElo       Current Elo of the person being swiped
 * @param {number} swiperElo       Elo of the person swiping
 * @param {'like'|'pass'|'super_like'} direction
 * @param {number} totalSwipesReceived  How many times the target has been swiped on total
 * @returns {number} new Elo (rounded integer)
 */
function updateElo(targetElo, swiperElo, direction, totalSwipesReceived) {
  const K = totalSwipesReceived < 100 ? K_NEW : K_EST;
  const E = expectedScore(targetElo, swiperElo);

  let actual;
  if (direction === 'super_like') actual = 1.5;   // super = strong positive signal
  else if (direction === 'like')  actual = 1.0;
  else                            actual = 0.0;   // pass

  const newElo = Math.round(targetElo + K * (actual - E));
  // Floor at 100 so no one goes negative
  return Math.max(100, newElo);
}

module.exports = { updateElo, DEFAULT_ELO };
