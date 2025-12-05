import type { PropsWithChildren, ReactNode } from "react"
import { cq, grid, hstack, vstack } from "~/generated/styled-system/patterns"

function HomeHeaderBlueprint({ children }: PropsWithChildren) {
  return (
    <header
      className={cq({
        display: "grid",
        lightDarkBg: "grey.bg",
        lightDarkBorderColor: "grey.6",
        borderBottomWidth: 1
      })}
    >
      <div
        className={hstack({
          display: "grid",
          paddingInline: 4,
          paddingBlock: 4,
          "@/6xl": {
            width: "6xl",
            mx: "auto",
            lightDarkBorderColor: "grey.6",
            borderInlineWidth: 1
          }
        })}
      >
        {children}
      </div>
    </header>
  )
}

function HomeHeroBlueprint({ children }: PropsWithChildren) {
  return (
    <section
      className={cq({
        display: "grid",
        bgLinear: "to-b",
        lightDarkGradientFrom: "grey.bg",
        lightDarkGradientTo: "grey.bg.canvas",
        gradientFromPosition: "10%",
        gradientToPosition: "90%",
        paddingBlock: 16
      })}
    >
      <div
        className={vstack({
          display: "grid",
          paddingInline: 4,
          paddingBlock: 32,
          "@/6xl": {
            width: "6xl",
            mx: "auto"
          }
        })}
      >
        {children}
      </div>
    </section>
  )
}

function HomeSectionBlueprint({ children }: PropsWithChildren) {
  return (
    <section
      className={cq({
        display: "grid",
        lightDarkBg: "grey.bg.canvas",
        lightDarkBorderColor: "grey.6",
        borderTopWidth: 1
      })}
    >
      <div
        className={vstack({
          display: "grid",
          paddingBlock: 4,
          paddingInline: 4,
          "@/6xl": {
            width: "6xl",
            mx: "auto",
            lightDarkBorderColor: "grey.6",
            borderInlineWidth: 1
          }
        })}
      >
        {children}
      </div>
    </section>
  )
}

function HomeFooterBlueprint({ children }: PropsWithChildren) {
  return (
    <footer
      className={cq({
        lightDarkBg: "grey.bg.canvas",
        color: "grey.text",
        borderTopWidth: 1,
        lightDarkBorderColor: "grey.6"
      })}
    >
      <div
        className={vstack({
          display: "grid",
          paddingBlock: 4,
          paddingInline: 4,
          "@/6xl": {
            width: "6xl",
            mx: "auto",
            lightDarkBorderColor: "grey.6",
            borderInlineWidth: 1
          }
        })}
      >
        {children}
      </div>
    </footer>
  )
}

type HomeLayoutProps = {
  header: ReactNode
  hero: ReactNode
  sections: ReadonlyArray<ReactNode>
  footer: ReactNode
}

export function HomeLayout({ header, hero, sections, footer }: HomeLayoutProps) {
  return (
    <div
      className={grid({
        minHeight: "100vh",
        gap: 0,
        gridTemplateRows: "auto auto 1fr auto"
      })}
    >
      <HomeHeaderBlueprint>{header}</HomeHeaderBlueprint>
      <HomeHeroBlueprint>{hero}</HomeHeroBlueprint>
      {sections.map((section, index) => <HomeSectionBlueprint key={index}>{section}</HomeSectionBlueprint>)}
      <HomeFooterBlueprint>{footer}</HomeFooterBlueprint>
    </div>
  )
}
