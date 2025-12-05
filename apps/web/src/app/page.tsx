import { HomeFooterContent } from "~/modules/(public)/Home/components/footer/HomeFooterContent"
import { HomeHeaderContent } from "~/modules/(public)/Home/components/header/HomeHeaderContent"
import { HomeHeroContent } from "~/modules/(public)/Home/components/hero/HomeHeroContent"
import { HomeLayout } from "~/modules/(public)/Home/components/HomeLayout"
import { HomePageComingSoonSectionContent } from "~/modules/(public)/Home/components/sections/HomeComingSoonSectionContent"

export default function Home() {
  return (
    <HomeLayout
      header={<HomeHeaderContent />}
      hero={<HomeHeroContent />}
      sections={[<HomePageComingSoonSectionContent key={0} />]}
      footer={<HomeFooterContent />}
    />
  )
}
