const ALLOWED = [
  '/public/assets/fonts/loveletter.ttf',
  '/public/assets/images/favicon-pylon.svg',
  '/public/assets/images/apple-touch-icon-pylon.png',
];

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (ALLOWED.includes(pathname)) {
      return env.ASSETS.fetch(request);
    }

    const url = new URL(request.url);
    url.pathname = '/countdown.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
}
