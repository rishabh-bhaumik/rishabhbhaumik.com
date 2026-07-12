import type { Metadata } from "next";
import PasswordGate from "@/components/PasswordGate";
import SaathiContent from "@/components/saathi/SaathiContent";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `Bima Saathi — ${SITE.name}`,
  description:
    "Designing the product that turned 1,000 agents into BimaKavach's second-largest revenue channel.",
  robots: { index: false }, // gated case study
};

export default function BimaSaathiPage() {
  return (
    <PasswordGate project="Bima Saathi" password="bktsaathi">
      <SaathiContent />
    </PasswordGate>
  );
}
