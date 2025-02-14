import { Mail } from "lucide-react";
import { BsGithub, BsLinkedin, BsTwitterX, BsYoutube } from "react-icons/bs";
import { DOMAIN_NAME } from "./settings";

export const NAV_LINKS = [
  {
    title: "Top",
    href: "#hero",
    external: false,
  },
  {
    title: "Features",
    href: "#features",
    external: false,
  },
  {
    title: "Pricing",
    href: "#pricing",
    external: false,
  },
  {
    title: "FAQ",
    href: "#faq",
    external: false,
  },
];
export const PRODUCT_LINKS = [
  { href: "#features", text: "Features" },
  { href: "#pricing", text: "Pricing" },
  { href: "#hero", text: "Home" },
  { href: "#change-log", text: "Changelog" },
];

export const RESOURCE_LINKS = [
  { href: `https://app.${DOMAIN_NAME}`, text: `App` },
  { href: `https://blog.${DOMAIN_NAME}`, text: `Blog` },
  { href: `https://docs.${DOMAIN_NAME}`, text: `Docs` },
  {
    href: `https://tattered-raptor-b11.notion.site/18ff3919e41d8019a43ecc4a319fa9c8?v=18ff3919e41d80a19fe4000c4d124a87`,
    text: `Roadmap`,
  },
  { href: `https://status.${DOMAIN_NAME}`, text: "Status" },
];

export const SOCIAL_LINKS = [
  {
    icon: <BsTwitterX className="h-5 w-5" />,
    href: "https://X.com/classclarus",
  },
  {
    icon: <BsGithub className="h-5 w-5" />,
    href: "https://github.com/classclarus",
  },
  {
    icon: <BsLinkedin className="h-5 w-5" />,
    href: "https://linkedin.com/company/classclarus",
  },
  {
    icon: <BsYoutube className="h-5 w-5" />,
    href: "https://youtube.com/classclarus",
  },
  { icon: <Mail className="h-5 w-5" />, href: `mailto:hello@${DOMAIN_NAME}` },
];
