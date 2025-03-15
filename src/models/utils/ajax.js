export default class Ajax {
  static async get(...args) {
    return await this.request('GET', ...args)
  }

  static async request(method, url) {
    const response = await fetch(url, { method });
    return response.json();
  }
}