export function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Like normalize but keeps accents — for typed dictation, where
// 'perche' vs 'perché' and 'vuele' vs 'vuole' must NOT match.
export function normalizeStrict(s) {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

// Returns { ok, expected, distance }. Tolerance: 10% of the expected
// length (min 1 edit), so short answers stay strict and long ones
// forgive a typo or an STT slip.
export function fuzzyMatch(answer, accepted) {
  if (!accepted.length) return { ok: false, expected: null, distance: Infinity };
  const na = normalize(answer);
  let best = null;
  for (const exp of accepted) {
    const d = levenshtein(na, normalize(exp));
    if (best === null || d < best.distance) best = { expected: exp, distance: d };
  }
  const tolerance = Math.max(1, Math.floor(normalize(best.expected).length * 0.1));
  return { ok: best.distance <= tolerance, ...best };
}

// LCS-based word alignment on normalized words.
// status: 'ok' (matched), 'missing' (expected, not said), 'extra' (said, not expected)
export function wordDiff(expected, actual, norm = normalize) {
  const e = norm(expected).split(' ').filter(Boolean);
  const a = norm(actual).split(' ').filter(Boolean);
  const m = e.length;
  const n = a.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = e[i] === a[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (e[i] === a[j]) {
      out.push({ word: e[i], status: 'ok' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ word: e[i], status: 'missing' });
      i++;
    } else {
      out.push({ word: a[j], status: 'extra' });
      j++;
    }
  }
  while (i < m) out.push({ word: e[i++], status: 'missing' });
  while (j < n) out.push({ word: a[j++], status: 'extra' });
  return out;
}
