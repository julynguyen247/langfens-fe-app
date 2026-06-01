export type DiffTokenType = 'equal' | 'removed' | 'added';

export interface DiffToken {
  type: DiffTokenType;
  text: string;
}

function tokenize(input: string): string[] {
  if (!input) return [];
  return input.match(/\s+|\S+/g) ?? [];
}

export function diffWords(original: string, improved: string): DiffToken[] {
  const a = tokenize(original);
  const b = tokenize(improved);
  const m = a.length;
  const n = b.length;

  if (m === 0 && n === 0) return [];
  if (m === 0) return [{ type: 'added', text: improved }];
  if (n === 0) return [{ type: 'removed', text: original }];

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const backtrack: DiffToken[] = [];

  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      backtrack.push({ type: 'equal', text: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      backtrack.push({ type: 'removed', text: a[i - 1] });
      i--;
    } else {
      backtrack.push({ type: 'added', text: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    backtrack.push({ type: 'removed', text: a[i - 1] });
    i--;
  }
  while (j > 0) {
    backtrack.push({ type: 'added', text: b[j - 1] });
    j--;
  }

  const ordered = backtrack.reverse();
  const merged: DiffToken[] = [];
  for (const token of ordered) {
    const last = merged[merged.length - 1];
    if (last && last.type === token.type) {
      last.text += token.text;
    } else {
      merged.push({ type: token.type, text: token.text });
    }
  }
  return merged;
}
