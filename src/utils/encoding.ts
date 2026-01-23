import { type Guess } from "../context/GameContext";
import { type Party, partyMeta } from "../data/parties";
import deputadosData from "../data/deputados.json";

const PARTY_TO_CODE: Record<string, string> = {
  PS: "a",
  PSD: "b",
  CH: "c",
  IL: "d",
  "CDS-PP": "e",
  BE: "f",
  PCP: "g",
  L: "h",
  PAN: "i",
  JPP: "j",
};

const CODE_TO_PARTY: Record<string, Party> = Object.fromEntries(
  Object.entries(PARTY_TO_CODE).map(([k, v]) => [v, k as Party])
);

export function encodeGuesses(guesses: Guess[]): string {
  return guesses
    .map((g) => {
      const index = deputadosData.findIndex((d) => d.id === g.id);
      if (index === -1) return "";
      const partyCode = PARTY_TO_CODE[g.partyGuess] || "x";
      // Use base36 for index to save space
      return `${index.toString(36)}${partyCode}`;
    })
    .filter(Boolean)
    .join("-");
}

export function decodeGuesses(encoded: string | null): Guess[] {
  if (!encoded) return [];
  
  return encoded.split("-").map((part) => {
    const indexStr = part.slice(0, -1);
    const partyCode = part.slice(-1);
    
    const index = parseInt(indexStr, 36);
    const deputy = deputadosData[index];
    const partyGuess = CODE_TO_PARTY[partyCode];
    
    if (!deputy || !partyGuess) return null;
    
    const actualParty = deputy.party as Party;
    const actualBloc = partyMeta[actualParty].bloc;
    const guessBloc = partyMeta[partyGuess].bloc;
    
    return {
      id: deputy.id,
      name: deputy.name,
      party: actualParty,
      bloc: actualBloc,
      blocGuess: guessBloc,
      partyGuess: partyGuess,
      isBlocCorrect: actualBloc === guessBloc,
      isPartyCorrect: actualParty === partyGuess,
    };
  }).filter((g): g is Guess => g !== null);
}
