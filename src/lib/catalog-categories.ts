import heroHairBonnets from "@/assets/hero-hair-bonnets.jpg";
import heroWaistBeads from "@/assets/hero-waistbeads.jpg";
import heroScrunchies from "@/assets/hero-scrunchies.jpg";
import heroHeadband from "@/assets/hero-headband.jpg";
import heroDresses from "@/assets/hero-dresses.jpeg";

export type CatalogCategoryPreset = {
  key: string;
  label: string;
  slugHints: string[];
  nameHints: string[];
  headline: string;
  description: string;
  cta: string;
  image: string;
};

export const CATALOG_CATEGORY_PRESETS: CatalogCategoryPreset[] = [
  {
    key: "hair-bonnets",
    label: "Hair Bonnets",
    slugHints: ["hair-bonnets", "hair-bonnet", "hairbonnets"],
    nameHints: ["hair bonnets", "hair bonnet"],
    headline: "Protective bonnets, handmade with love.",
    description:
      "Each bonnet is sewn by hand for comfort, care, and everyday confidence.",
    cta: "Shop Hair Bonnets",
    image: heroHairBonnets,
  },
  {
    key: "waist-beads",
    label: "Waist Beads",
    slugHints: ["waist-beads", "waistbeads", "waist-bead"],
    nameHints: ["waist beads", "waist bead"],
    headline: "Waist beads crafted to celebrate you.",
    description:
      "Carefully handcrafted strands designed to feel personal, beautiful, and meaningful.",
    cta: "Shop Waist Beads",
    image: heroWaistBeads,
  },
  {
    key: "scrunchies",
    label: "Scrunchies",
    slugHints: ["scrunchies", "scrunchie"],
    nameHints: ["scrunchies", "scrunchie"],
    headline: "Soft scrunchies, stitched by hand.",
    description:
      "From fabric selection to final stitch, every piece is handmade for gentle all-day wear.",
    cta: "Shop Scrunchies",
    image: heroScrunchies,
  },
  {
    key: "headbands",
    label: "Headbands",
    slugHints: ["headbands", "headband"],
    nameHints: ["headbands", "headband"],
    headline: "Headbands made by hand, styled with ease.",
    description:
      "Elegant handmade headbands that finish every look with comfort and character.",
    cta: "Shop Headbands",
    image: heroHeadband,
  },
  {
    key: "dresses",
    label: "Dresses",
    slugHints: ["dresses", "female-dresses", "dress"],
    nameHints: ["dresses", "female dresses", "dress"],
    headline: "Dresses sewn by hand, one careful stitch at a time.",
    description:
      "Original handmade dresses crafted with intention, detail, and premium finishing.",
    cta: "Shop Dresses",
    image: heroDresses,
  },
];

function normalizeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[_\s]+/g, "-");
}

type CategoryLike = { slug: string; name: string };

export function matchPresetToCategory<T extends CategoryLike>(
  preset: CatalogCategoryPreset,
  categories: T[],
): T | undefined {
  const slugHints = new Set(preset.slugHints.map(normalizeSlug));

  for (const category of categories) {
    if (slugHints.has(normalizeSlug(category.slug))) return category;
  }

  const nameHints = preset.nameHints.map((hint) => hint.toLowerCase());
  for (const category of categories) {
    const name = category.name.toLowerCase();
    if (nameHints.some((hint) => name.includes(hint) || hint.includes(name))) {
      return category;
    }
  }

  return undefined;
}

/** Shop filter slug: uses the admin-created slug when found, otherwise the first hint. */
export function resolvePresetShopSlug(
  preset: CatalogCategoryPreset,
  categories: CategoryLike[],
): string {
  return matchPresetToCategory(preset, categories)?.slug ?? preset.slugHints[0]!;
}

export type HomeCategoryCard = {
  key: string;
  slug: string;
  name: string;
  count: number;
  image: string;
};

export function buildHomeCategoryCards(
  categories: { slug: string; name: string; count: number; image_url?: string | null }[],
): HomeCategoryCard[] {
  const usedSlugs = new Set<string>();
  const cards: HomeCategoryCard[] = [];

  for (const preset of CATALOG_CATEGORY_PRESETS) {
    const category = matchPresetToCategory(preset, categories);
    if (!category) continue;

    usedSlugs.add(category.slug);
    cards.push({
      key: preset.key,
      slug: category.slug,
      name: category.name,
      count: category.count,
      image: preset.image,
    });
  }

  for (const category of categories) {
    if (usedSlugs.has(category.slug)) continue;
    cards.push({
      key: category.slug,
      slug: category.slug,
      name: category.name,
      count: category.count,
      image: category.image_url ?? presetFallbackImage(category) ?? "",
    });
  }

  return cards;
}

function presetFallbackImage(category: CategoryLike): string | undefined {
  const preset = CATALOG_CATEGORY_PRESETS.find(
    (item) => matchPresetToCategory(item, [category]) !== undefined,
  );
  return preset?.image;
}
