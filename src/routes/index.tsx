import { createFileRoute } from "@tanstack/react-router";
import { TradePlatform } from "@/components/trade/platform";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <TradePlatform />;
}
