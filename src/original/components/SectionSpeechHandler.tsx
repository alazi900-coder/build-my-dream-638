import { useSectionSpeech } from "@/original/hooks/useSectionSpeech";

// This component uses the speech hook inside the router context
export function SectionSpeechHandler() {
  useSectionSpeech();
  return null;
}
