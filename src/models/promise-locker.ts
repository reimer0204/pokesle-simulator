class PromiseLocker {
  count: number;
  beforePromise: Promise<any> | null;

  constructor() {
    this.count = 0;
    this.beforePromise = null;
  }

  async wait(f: Function) {
    if (this.count >= 2) {
      return;
    }

    this.count++;
    await this.beforePromise;

    try {
      this.beforePromise = f();
      await this.beforePromise;
      this.beforePromise = null;
    } finally {
      this.count--;
    }
  }

  get executing() {
    return this.count > 0
  }
}

export {
  PromiseLocker,
}