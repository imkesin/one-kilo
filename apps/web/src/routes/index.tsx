import { createFileRoute } from "@tanstack/react-router"
import { HomeFooterContent } from "~/ui/features/marketing/home/footer/HomeFooterContent"
import { HomeHeaderContent } from "~/ui/features/marketing/home/header/HomeHeaderContent"
import { HomeHeroContent } from "~/ui/features/marketing/home/hero/HomeHeroContent"
import { HomeLayout } from "~/ui/features/marketing/home/HomeLayout"
import { HomePageComingSoonSectionContent } from "~/ui/features/marketing/home/sections/HomeComingSoonSectionContent"

function Home() {
  return (
    <HomeLayout
      header={<HomeHeaderContent />}
      hero={<HomeHeroContent />}
      sections={[<HomePageComingSoonSectionContent key={0} />]}
      footer={<HomeFooterContent />}
    />
  )
}

export const Route = createFileRoute("/")({ component: Home })
