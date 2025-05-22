export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "PromptBear",
  description:
    "A tool for quickly creating and managing prompts.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Prompts",
      href: "/prompts"
    },
    {
      title: "Workspace",
      href: "/workspace"
    }
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/yourusername/promptbear",
    docs: "https://ui.shadcn.com",
  },
}
