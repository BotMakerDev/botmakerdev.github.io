// Where the site's links go: the header's sections, and the docs pages other pages point at. One list, so the
// site's header, the docs' header and the docs' phone menu cannot disagree, and a docs page that moves is
// changed here once.

export const SECTIONS = [
  { href: '/install/', label: 'Install' },
  { href: '/docs/', label: 'Docs' },
  { href: '/plugins/', label: 'Plugins' },
  { href: '/gallery/', label: 'Gallery' },
];

export const GITHUB = 'https://github.com/BotMakerDev';

export const GUIDES = {
  firstProgram: '/docs/tutorials/first-program/',
  makePlugin: '/docs/how-to/make-a-plugin/',
  publishBot: '/docs/how-to/publish-a-bot/',
};

/** Whether the page at `path` is in the section at `href`. */
export const isCurrent = (path, href) => path === href || path.startsWith(href);
