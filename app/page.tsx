import Sheet from "@/components/home/Sheet";
import SelectedWork from "@/components/home/SelectedWork";
import SheetContact from "@/components/home/SheetContact";
import SheetHero, { HomeAside, HomeHeading } from "@/components/home/SheetHero";

/** Home (Figma 8780:35610): the ruled sheet, its opening, Selected Work and contact. */
export default function Home() {
  return (
    <Sheet>
      <SheetHero heading={<HomeHeading />} aside={<HomeAside />} />
      <SelectedWork />
      <SheetContact />
    </Sheet>
  );
}
