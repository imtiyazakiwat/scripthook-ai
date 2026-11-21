import type { Metadata } from "next";
import { Studio } from "@/components/studio/studio";

export const metadata: Metadata = {
  title: "Studio",
  description: "Paste your script and simulate audience retention second by second.",
};

export default function StudioPage() {
  return <Studio />;
}
