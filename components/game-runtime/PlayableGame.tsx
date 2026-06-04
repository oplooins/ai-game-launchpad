"use client";

import { UniversalGamePlayer } from "@/components/playable/UniversalGamePlayer";

type Props = {
  rawConfig: unknown;
  title?: string;
};

export function PlayableGame({ rawConfig, title }: Props) {
  return <UniversalGamePlayer rawConfig={rawConfig} title={title} />;
}
