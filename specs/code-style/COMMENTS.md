# Code Style | Comments

## When to comment

The bar is high; code should read on its own.

Comment to capture **non-obvious behavior** or a **strange code path**. Do not narrate what the code
plainly does. If a reader could derive it by reading the lines below, drop the comment.

## Style

When a comment is warranted, prefer a **block comment**, even for a single line.

A block comment breaks up the flow and signals "stop and read this":

```ts
/*
 * If you want to write a comment, it should break-up the flow.
 */
```

## JSDoc

Use JSDoc (`/** ... */`) when intellisense on a symbol or its parameters — would _significantly_
help the caller. This applies mostly to **package and library code**, where a name carries
domain-specific meaning.
