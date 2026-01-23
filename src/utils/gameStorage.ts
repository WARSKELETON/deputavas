const GAME_STATE_STORAGE_KEY = "deputavasGameState";
const GUESSES_STORAGE_KEY = "deputavasGuesses";

export function clearGameState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GAME_STATE_STORAGE_KEY);
}

export function clearGuessesFromStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUESSES_STORAGE_KEY);
}

export function clearAllGameData() {
  clearGameState();
  clearGuessesFromStorage();
}
