import brws from 'webextension-polyfill';

const isGoodLink = (link: any) => {
  if (typeof link !== 'string' || (link.split('#')[0] === window.location.href.split('#')[0])) return false;
  try {
    const u = new URL(decodeURI(link)
      .trim()
      .toLocaleLowerCase());
    // check if host is a private/internal ip
    if (u.hostname === 'localhost' || u.hostname === '[::1]' || /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(u.hostname)) return false;

    const parts = u.hostname.split('.');
    if (parts[0] === '10' || (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) || (parts[0] === '192' && parts[1] === '168')) return false;
    // Check if protocol is safe
    const safeProtocols = ['http:', 'https:', 'mailto:', 'irc:', 'telnet:', 'tel:', 'svn:'];
    if (!safeProtocols.includes(u.protocol)) return false;
  } catch (e) {
    return false;
  }
  return true;
};

const getRedirect = (url: string, referer?: string, safe_in?: string) => {
  if (!isGoodLink(url)) return;

  let redirectUrl = `${brws.runtime.getURL('html/before-navigate.html')}?target=${encodeURIComponent(url)}`;
  if (referer) redirectUrl += `&referer=${encodeURIComponent(referer)}`;

  if (safe_in !== undefined) redirectUrl += `&safe_in=${safe_in}`;

  countIt();
  return {redirectUrl};
};

const encodedRedirect = (url: string, referer?: string, safe_in?: string) => getRedirect(decodeURIComponent(url), referer, safe_in);

export {getRedirect, isGoodLink, encodedRedirect};
