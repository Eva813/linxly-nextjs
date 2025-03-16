export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Linxly",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Snippets",
      href: "/snippets"
    },
    {
      title: "Workspace",
      href: "/workspace"
    }
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/Eva813/linxly-nextjs",
    docs: "https://ui.shadcn.com",
  },
}
