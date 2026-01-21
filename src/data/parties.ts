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
    color: "#D4338F",
  },
  PSD: {
    label: "PSD",
    name: "Partido Social Democrata",
    bloc: "right",
    color: "#FF9900",
  },
  CH: {
    label: "CH",
    name: "Chega",
    bloc: "right",
    color: "#1D1C59",
  },
  IL: {
    label: "IL",
    name: "Iniciativa Liberal",
    bloc: "right",
    color: "#00ADEF",
  },
  "CDS-PP": {
    label: "CDS-PP",
    name: "CDS - Partido Popular",
    bloc: "right",
    color: "#005C9E",
  },
  BE: {
    label: "BE",
    name: "Bloco de Esquerda",
    bloc: "left",
    color: "#E20613",
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
    color: "#00667E",
  },
  JPP: {
    label: "JPP",
    name: "Juntos Pelo Povo",
    bloc: "left",
    color: "#00AA85",
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
