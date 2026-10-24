// Which system the Install page opens on. A guess from the browser's platform string
// (`navigator.userAgentData?.platform ?? navigator.platform`); anything unknown is Linux, the one with a package.

/** @returns {'linux' | 'windows' | 'macos'} */
export function systemOf(platform) {
  const p = String(platform ?? '');
  if (/^win/i.test(p)) return 'windows';
  if (/^mac/i.test(p)) return 'macos';
  return 'linux';
}
