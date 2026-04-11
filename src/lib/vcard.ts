import type { Profile } from "./types";

export function generateVCard(profile: Profile): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profile.name}`,
  ];
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${profile.phone}`);
  if (profile.email) lines.push(`EMAIL:${profile.email}`);
  if (profile.website) lines.push(`URL:${profile.website}`);
  if (profile.address) lines.push(`ADR:;;${profile.address};;;;`);
  if (profile.description) lines.push(`NOTE:${profile.description}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function downloadVCard(profile: Profile) {
  const vcard = generateVCard(profile);
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profile.name.replace(/\s+/g, "_")}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}
