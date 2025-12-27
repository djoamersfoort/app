import { Directory, File, Paths } from 'expo-file-system';

const logDirectory = new Directory(Paths.document, "logs");

class Logging {
  private _log = "";
  public currentFile: string | null = null;

  constructor() {
    this.loadLog().then((restored) => {
      if (restored) this.log("LOGGING", "Log restored");
      else this.log("LOGGING", "New log created");
    });
  }

  limitSize() {
    this._log = this._log.slice(-102400);
  }

  async ensureExists() {
    logDirectory.create({idempotent: true});
  }

  async loadLog() {
    await this.ensureExists();
    for (const item of logDirectory.list()) {
      if (item.name.endsWith(".txt")) {
        const logFile = new File(item.uri);
        const contents = await logFile.text();

        this.currentFile = item.uri;
        this._log = contents + this._log;
        this.limitSize();
      }
    }
    return true;
  }

  async saveLog() {
    await this.ensureExists();

    const name = `log.${new Date().getTime()}.txt`;
    const logFile = new File(logDirectory.uri, name);
    logFile.create();
    logFile.write(this.export());

    this.currentFile = logFile.uri;
    for (const item of logDirectory.list()) {
      if (item.name === name) continue;
      new File(item.uri).delete();
    }
  }

  async clear() {
    this._log = "";
    this.saveLog().then();
    this.log("LOGGING", "Log cleared");
  }

  export() {
    return this._log;
  }

  log(category: string, message: string) {
    console.log(`[${new Date().toISOString()}] (${category}) ${message}`);
    this._log += `[${new Date().toISOString()}] (${category}) ${message}\n`;
    this.limitSize();

    this.saveLog().then();
  }
}

export default new Logging();
