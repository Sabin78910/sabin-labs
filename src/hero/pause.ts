export const PAUSE_KEY = "hero-paused";

export const togglePaused = (paused: boolean): boolean => !paused;

const store = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export function readPaused(storage: Storage | undefined = store()): boolean {
  try {
    return storage?.getItem(PAUSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePaused(paused: boolean, storage: Storage | undefined = store()): void {
  try {
    storage?.setItem(PAUSE_KEY, paused ? "1" : "0");
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
}
