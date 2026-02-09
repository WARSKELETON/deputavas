import { type Guess } from "../context/GameContext";
import { type Party, partyMeta } from "../data/parties";
import deputadosData from "../data/deputados.json";
import projetosLeiData from "../data/projetos-lei.json";

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

const DEPUTY_TOKEN_PREFIX = "d";
const PROJECT_TOKEN_PREFIX = "p";

function isParty(value: unknown): value is Party {
  return typeof value === "string" && value in partyMeta;
}

export function encodeGuesses(guesses: Guess[]): string {
  return guesses
    .map((g) => {
      const partyCode = PARTY_TO_CODE[g.partyGuess] || "x";
      if (partyCode === "x") return "";

      if (g.type === "project") {
        const projectIndex = projetosLeiData.findIndex((p) => p.id === g.id);
        if (projectIndex === -1) return "";
        return `${PROJECT_TOKEN_PREFIX}${projectIndex.toString(36)}${partyCode}`;
      }

      const index = deputadosData.findIndex((d) => d.id === g.id);
      if (index === -1) return "";
      return `${DEPUTY_TOKEN_PREFIX}${index.toString(36)}${partyCode}`;
    })
    .filter(Boolean)
    .join("-");
}

export function decodeGuesses(encoded: string | null): Guess[] {
  if (!encoded) return [];

  const decoded = encoded.split("-").map((part): Guess | null => {
    if (!part) return null;

    const hasPrefix = part[0] === DEPUTY_TOKEN_PREFIX || part[0] === PROJECT_TOKEN_PREFIX;
    const tokenType = hasPrefix ? part[0] : DEPUTY_TOKEN_PREFIX;
    const indexStr = hasPrefix ? part.slice(1, -1) : part.slice(0, -1);
    const partyCode = part.slice(-1);
    
    const index = parseInt(indexStr, 36);
    const partyGuess = CODE_TO_PARTY[partyCode];
    if (!Number.isInteger(index) || !partyGuess) return null;

    const guessBloc = partyMeta[partyGuess].bloc;
    if (tokenType === PROJECT_TOKEN_PREFIX) {
      const project = projetosLeiData[index];
      if (!project || !isParty(project.party)) return null;

      const actualParty = project.party;
      const actualBloc = partyMeta[actualParty].bloc;

      return {
        id: project.id,
        name: project.number,
        type: "project" as const,
        party: actualParty,
        bloc: actualBloc,
        blocGuess: guessBloc,
        partyGuess,
        isBlocCorrect: actualBloc === guessBloc,
        isPartyCorrect: actualParty === partyGuess,
      };
    }

    const deputy = deputadosData[index];
    if (!deputy || !isParty(deputy.party)) return null;

    const actualParty = deputy.party;
    const actualBloc = partyMeta[actualParty].bloc;

    return {
      id: deputy.id,
      name: deputy.name,
      type: "deputy" as const,
      party: actualParty,
      bloc: actualBloc,
      blocGuess: guessBloc,
      partyGuess,
      isBlocCorrect: actualBloc === guessBloc,
      isPartyCorrect: actualParty === partyGuess,
    };
  });

  return decoded.filter((g): g is Guess => g !== null);
}
