export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    url.pathname = '/countdown.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
}
