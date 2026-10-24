// The light/dark choice, shared by the site and the Starlight docs: the same localStorage key and values
// Starlight's own ThemeSelect uses ('light' | 'dark' | '' for the system setting), and the same
// `data-theme` attribute on <html>. One choice holds on every page.
//
// Storage can be missing or throw (private window, blocked site data): every read and write is guarded,
// and a page without storage still switches; it just forgets on the next load.

export const KEY = 'starlight-theme';

/** The saved choice, or '' (follow the system) when there is none or it cannot be read. */
export function readChoice(storage) {
  let value = null;
  try {
    value = storage ? storage.getItem(KEY) : null;
  } catch {
    return '';
  }
  return value === 'light' || value === 'dark' ? value : '';
}

/** Saves a choice; '' forgets it so the system setting applies again. Never throws. */
export function writeChoice(storage, choice) {
  try {
    if (choice === 'light' || choice === 'dark') storage.setItem(KEY, choice);
    else storage.removeItem(KEY);
  } catch {
    // Not remembered; the page still switches.
  }
}

/** Sets `data-theme` from a choice and the system setting; returns the theme applied. */
export function applyChoice(root, choice, prefersDark) {
  const theme = choice === 'light' || choice === 'dark' ? choice : prefersDark ? 'dark' : 'light';
  root.dataset.theme = theme;
  return theme;
}

/**
 * The script inlined in <head>, so the page paints in the right theme from the first frame. Built from the
 * functions above rather than copied, so the two cannot disagree.
 */
export function bootScript() {
  return [
    `var KEY=${JSON.stringify(KEY)};`,
    readChoice.toString(),
    applyChoice.toString(),
    `applyChoice(document.documentElement, readChoice((function(){try{return localStorage}catch(e){return null}})()),`
      + ` matchMedia('(prefers-color-scheme: dark)').matches);`,
  ].join('\n');
}
