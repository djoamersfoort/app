import { Directory, File, Paths } from "expo-file-system";

const directory = new Directory(Paths.document, "logs");
const LOG_NAME = "log.txt";
const MAX_SIZE = 102_400;
/** Batch window, so a burst of lines costs one disk write instead of one each. */
const FLUSH_DELAY_MS = 2_000;

class Logging {
  private buffer = "";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly file = new File(directory, LOG_NAME);

  constructor() {
    this.restore().then((restored) =>
      this.log("LOGGING", restored ? "Log restored" : "New log created"),
    );
  }

  /** Path to export, or null when nothing has been written to disk yet. */
  get currentFile(): string | null {
    return this.file.exists ? this.file.uri : null;
  }

  export() {
    return this.buffer;
  }

  log(category: string, message: string) {
    const line = `[${new Date().toISOString()}] (${category}) ${message}`;
    console.log(line);

    this.buffer = `${this.buffer}${line}\n`.slice(-MAX_SIZE);
    this.schedule();
  }

  async clear() {
    this.buffer = "";
    this.log("LOGGING", "Log cleared");
    this.flush();
  }

  private async restore(): Promise<boolean> {
    directory.create({ idempotent: true });

    // Older builds wrote a new timestamped file per log line; drop the leftovers.
    for (const item of directory.list()) {
      if (item.name !== LOG_NAME) new File(item.uri).delete();
    }

    if (!this.file.exists) return false;

    this.buffer = (await this.file.text()).slice(-MAX_SIZE);
    return true;
  }

  /**
   * Writes are debounced and always target the same file. The previous version
   * created a fresh timestamped file and deleted every other one on *each*
   * call, so a single log line meant a directory scan plus two file operations.
   */
  private schedule() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, FLUSH_DELAY_MS);
  }

  private flush() {
    try {
      if (!this.file.exists) this.file.create({ intermediates: true });
      this.file.write(this.buffer);
    } catch (error) {
      // Logging must never take the app down with it.
      console.log(`[LOGGING] could not write log: ${error}`);
    }
  }
}

export default new Logging();
