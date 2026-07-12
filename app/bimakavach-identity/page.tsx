import type { Metadata } from "next";
import PasswordGate from "@/components/PasswordGate";
import IdentityContent from "@/components/bk/IdentityContent";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `BimaKavach Identity — ${SITE.name}`,
  description:
    "Pivoting the perception of BimaKavach into an intelligence company rooted in India's rich history of ornamentation, beauty and aesthetic identity.",
  robots: { index: false }, // gated case study
};

export default function BimakavachIdentityPage() {
  return (
    <PasswordGate project="BimaKavach Identity" password="bkt4">
      <IdentityContent />
    </PasswordGate>
  );
}
