import { en } from "./en";
import { hi } from "./hi";
import { te } from "./te";

import type { Language } from "@/lib/types";

const dict = { en, hi, te } as const;

export function strings(lang: Language) {
  return dict[lang];
}
