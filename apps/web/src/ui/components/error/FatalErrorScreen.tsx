import { Link } from "@tanstack/react-router"
import { css } from "~/generated/styled-system/css"
import { vstack } from "~/generated/styled-system/patterns"
import { Button } from "~/ui/components/button/Button"

type FatalErrorScreenVariant = "terminal" | "boundary" | "notFound"

type FatalErrorScreenProps = {
  readonly variant: FatalErrorScreenVariant
  readonly onRetry?: () => void
}

const COPY: Record<FatalErrorScreenVariant, { readonly title: string; readonly message: string }> = {
  terminal: {
    title: "Something went wrong",
    message: "An unexpected error occurred and your request couldn't be completed."
  },
  boundary: {
    title: "Something went wrong",
    message: "This page ran into an unexpected error."
  },
  notFound: {
    title: "Page not found",
    message: "The page you're looking for doesn't exist or has moved."
  }
}

export function FatalErrorScreen({ variant, onRetry }: FatalErrorScreenProps) {
  const { title, message } = COPY[variant]

  return (
    <div
      className={vstack({
        minHeight: "100vh",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        paddingInline: 4,
        textAlign: "center",
        lightDarkBg: "grey.bg.canvas"
      })}
    >
      <div className={vstack({ gap: 2, alignItems: "center" })}>
        <h1
          className={css({
            fontSize: "3xl",
            fontWeight: "bold",
            lightDarkColor: "grey.12"
          })}
        >
          {title}
        </h1>
        <p
          className={css({
            fontSize: "lg",
            maxW: "md",
            lightDarkColor: "grey.11"
          })}
        >
          {message}
        </p>
      </div>

      <div className={vstack({ gap: 3, alignItems: "center" })}>
        {variant === "boundary" && onRetry !== undefined && (
          <Button onClick={onRetry}>
            Try again
          </Button>
        )}
        <Link
          to="/"
          reloadDocument
          className={css({
            fontSize: "md",
            lightDarkColor: "grey.11",
            textDecoration: "underline",
            _hover: { lightDarkColor: "grey.12" }
          })}
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
