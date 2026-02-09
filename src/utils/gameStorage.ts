const GAME_STATE_STORAGE_KEY = "deputavasGameState";
const GUESSES_STORAGE_KEY = "deputavasGuesses";
const PROJECT_GUESSES_STORAGE_KEY = "deputavasProjectGuesses";

export function clearGameState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GAME_STATE_STORAGE_KEY);
}

export function clearGuessesFromStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUESSES_STORAGE_KEY);
  localStorage.removeItem(PROJECT_GUESSES_STORAGE_KEY);
}

export function clearAllGameData() {
  clearGameState();
  clearGuessesFromStorage();
}
