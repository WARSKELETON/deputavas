export type Bloc = "left" | "right";

export const blocLabels: Record<Bloc, string> = {
  left: "Esquerda",
  right: "Direita",
};

export const partyMeta = {
  PS: {
    label: "PS",
    name: "Partido Socialista",
    bloc: "left",
    color: "#E11D48",
  },
  PSD: {
    label: "PSD",
    name: "Partido Social Democrata",
    bloc: "right",
    color: "#F59E0B",
  },
  CH: {
    label: "CH",
    name: "Chega",
    bloc: "right",
    color: "#0F172A",
  },
  IL: {
    label: "IL",
    name: "Iniciativa Liberal",
    bloc: "right",
    color: "#2563EB",
  },
  "CDS-PP": {
    label: "CDS-PP",
    name: "CDS - Partido Popular",
    bloc: "right",
    color: "#0EA5E9",
  },
  BE: {
    label: "BE",
    name: "Bloco de Esquerda",
    bloc: "left",
    color: "#BE123C",
  },
  PCP: {
    label: "PCP",
    name: "Partido Comunista Portugues",
    bloc: "left",
    color: "#B91C1C",
  },
  L: {
    label: "L",
    name: "Livre",
    bloc: "left",
    color: "#C3D500",
  },
  PAN: {
    label: "PAN",
    name: "Pessoas-Animais-Natureza",
    bloc: "left",
    color: "#016681",
  },
  JPP: {
    label: "JPP",
    name: "Juntos Pelo Povo",
    bloc: "left",
    color: "#00AB85",
  },
} as const;

export type Party = keyof typeof partyMeta;

export const partiesByBloc: Record<Bloc, Party[]> = {
  left: ["PS", "BE", "PCP", "L", "PAN", "JPP"],
  right: ["PSD", "CDS-PP", "IL", "CH"],
};

export const partyOrder: Party[] = [
  "PS",
  "PSD",
  "CH",
  "IL",
  "BE",
  "PCP",
  "L",
  "PAN",
  "CDS-PP",
  "JPP",
];
