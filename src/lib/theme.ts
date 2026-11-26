export const MIDNIGHT_PALETTE = {
  obsidian: "#08090D",
  midnightBlue: "#101827",
  electricBlue: "#367BFF",
  deepViolet: "#7547D8",
  silver: "#C5CAD6",
  softWhite: "#F0F2F8",
} as const;

export const MIDNIGHT_SECTIONS = [
  { id: "home", code: "01", label: "HOME", href: "/#home" },
  { id: "about", code: "02", label: "ABOUT", href: "/#about" },
  { id: "expertise", code: "03", label: "EXPERTISE", href: "/#expertise" },
  { id: "projects", code: "04", label: "PROJECTS", href: "/#projects" },
  { id: "experience", code: "05", label: "EXPERIENCE", href: "/#experience" },
  { id: "playground", code: "06", label: "PLAYGROUND", href: "/#playground" },
  { id: "contact", code: "07", label: "CONTACT", href: "/#contact" },
] as const;

export type MidnightSectionId = (typeof MIDNIGHT_SECTIONS)[number]["id"];
