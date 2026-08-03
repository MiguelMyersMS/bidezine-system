# Third-Party Licenses & Attribution

`bidezine-system` is built on the shadcn/ui foundation and re-skins it to our own tokens. This file
records the third-party code we rely on and their licenses. It must be kept for as long as we ship code
derived from these projects.

## shadcn/ui

- **Project:** shadcn/ui — https://github.com/shadcn-ui/ui
- **License:** MIT
- **How we use it:** the entire shadcn source is vendored, read-only, under `reference/shadcn-ui/` for
  study and extraction. Its original license is preserved at `reference/shadcn-ui/LICENSE.md`. Components
  we adapt from it are re-cast in our own tokens and re-authored through our pipeline; the MIT notice
  continues to apply to any substantial portions that remain derived from the original.

## Radix UI

- **Project:** Radix UI Primitives — https://github.com/radix-ui/primitives
- **License:** MIT
- **How we use it:** shadcn components (and ours, by inheritance) build their behaviour on Radix
  primitives. Where Radix code ships in our distribution, the MIT notice applies.

## Notes

- MIT permits use, modification, and distribution — including under our own (even proprietary) license —
  provided the copyright and permission notice are retained for the portions that remain theirs.
- As we rewrite component internals room-by-room, portions cease to be "substantial portions" of the
  originals; attribution obligations narrow accordingly.
- Additional MIT/OSS dependencies pulled in during the build (e.g. via shadcn's registry) should be added
  here as they are adopted.
