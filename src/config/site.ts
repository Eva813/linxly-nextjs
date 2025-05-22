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
      title: "Prompts",
      href: "/prompts"
    },
    {
      title: "Workspace",
      href: "/workspace"
    }
  ],
  links: {
    github: "https://github.com/Eva813",
  },
}
