import * as FileSystem from "expo-file-system";

const LOG_DIRECTORY = `${FileSystem.documentDirectory}logs`;

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
    const { exists } = await FileSystem.getInfoAsync(LOG_DIRECTORY);
    if (exists) return;

    await FileSystem.makeDirectoryAsync(LOG_DIRECTORY);
  }

  async loadLog() {
    await this.ensureExists();

    const logFiles = await FileSystem.readDirectoryAsync(LOG_DIRECTORY);
    const [log] = logFiles
      .filter((file) => file.endsWith(".txt"))
      .map((file) => ({
        date: new Date(file.split(".").at(-1) || new Date()).getTime(),
        file,
      }))
      .sort((a, b) => a.date - b.date);

    if (!log) return false;

    const contents = await FileSystem.readAsStringAsync(
      `${LOG_DIRECTORY}/${log.file}`,
    );
    this.currentFile = `${LOG_DIRECTORY}/${log.file}`;
    this._log = contents + this._log;
    this.limitSize();

    return true;
  }

  async saveLog() {
    await this.ensureExists();

    const name = `log.${new Date().getTime()}.txt`;
    const temp = `${LOG_DIRECTORY}/${name}`;

    await FileSystem.writeAsStringAsync(temp, this.export());

    this.currentFile = `${LOG_DIRECTORY}/${name}`;
    const logs = await FileSystem.readDirectoryAsync(LOG_DIRECTORY);
    await Promise.all(
      logs.map(async (log) => {
        if (log === name) return;

        try {
          await FileSystem.deleteAsync(`${LOG_DIRECTORY}/${log}`);
        } catch {}
      }),
    );
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
