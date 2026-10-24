// The docs' code blocks in the two looks: Expressive Code's themes, made from the Java colours tokens.css gives the
// home page's demo (--code-bg, --kw, --fn, --st). Expressive Code needs literal colours to work out contrast, so
// they are repeated here; a change to those tokens changes these too.

const theme = (name, type, c) => ({
  name,
  type,
  colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.muted, fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'constant.language'], settings: { foreground: c.kw } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.type', 'support.class', 'entity.name.class'],
      settings: { foreground: c.fn } },
    { scope: ['string', 'string.quoted'], settings: { foreground: c.st } },
    { scope: ['constant.numeric'], settings: { foreground: c.num } },
    { scope: ['variable.parameter', 'variable.other.option'], settings: { foreground: c.fg } },
  ],
});

export const MANUAL = theme('botmaker-manual', 'light', {
  bg: '#ffffff', fg: '#1d1b17', muted: '#6a645a', kw: '#b4460a', fn: '#1d1b17', st: '#4f6b22', num: '#b4460a',
});

export const DARK_EDITOR = theme('botmaker-dark-editor', 'dark', {
  bg: '#1b1c21', fg: '#ebe9e3', muted: '#a3a197', kw: '#ffd23f', fn: '#5cc8ff', st: '#ff7a59', num: '#9be37a',
});
