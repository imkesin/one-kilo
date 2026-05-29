import { createFileRoute } from "@tanstack/react-router"
import { HomeFooterContent } from "~/content/home/components/footer/HomeFooterContent"
import { HomeHeaderContent } from "~/content/home/components/header/HomeHeaderContent"
import { HomeHeroContent } from "~/content/home/components/hero/HomeHeroContent"
import { HomeLayout } from "~/content/home/components/HomeLayout"
import { HomePageComingSoonSectionContent } from "~/content/home/components/sections/HomeComingSoonSectionContent"

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
