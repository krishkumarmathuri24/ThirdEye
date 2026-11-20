import React from "react";
import Component from "@/components/ui/saa-s-template";

export default function Demo({ onLaunchApp }: { onLaunchApp?: () => void }) {
  return <Component onLaunchApp={onLaunchApp} />;
}
