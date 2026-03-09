import { Nunito, Outfit, Recursive } from "next/font/google";

export const testerBodyFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"]
});

export const testerDisplayFont = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"]
});

export const testerHeadingFont = Recursive({
  subsets: ["latin"],
  weight: ["700", "800"]
});
