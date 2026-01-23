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
    logo: "/images/partidos/ps.svg",
  },
  PSD: {
    label: "PSD",
    name: "Partido Social Democrata",
    bloc: "right",
    color: "#FF9900",
    logo: "/images/partidos/psd.svg",
  },
  CH: {
    label: "CH",
    name: "Chega",
    bloc: "right",
    color: "#1D1C59",
    logo: "/images/partidos/ch.webp",
  },
  IL: {
    label: "IL",
    name: "Iniciativa Liberal",
    bloc: "right",
    color: "#00ADEF",
    logo: "/images/partidos/il.png",
  },
  "CDS-PP": {
    label: "CDS-PP",
    name: "CDS - Partido Popular",
    bloc: "right",
    color: "#005C9E",
    logo: "/images/partidos/cds.svg",
  },
  BE: {
    label: "BE",
    name: "Bloco de Esquerda",
    bloc: "left",
    color: "#E20613",
    logo: "/images/partidos/be.png",
  },
  PCP: {
    label: "PCP",
    name: "Partido Comunista Portugues",
    bloc: "left",
    color: "#B91C1C",
    logo: "/images/partidos/pcp.svg",
  },
  L: {
    label: "L",
    name: "Livre",
    bloc: "left",
    color: "#C3D500",
    logo: "/images/partidos/livre.png",
  },
  PAN: {
    label: "PAN",
    name: "Pessoas-Animais-Natureza",
    bloc: "left",
    color: "#00667E",
    logo: "/images/partidos/pan.svg",
  },
  JPP: {
    label: "JPP",
    name: "Juntos Pelo Povo",
    bloc: "left",
    color: "#00AA85",
    logo: "/images/partidos/jpp.png",
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
