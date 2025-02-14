/** @format */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoHeader } from "./logo";
import {
  PRODUCT_LINKS,
  RESOURCE_LINKS,
  SOCIAL_LINKS,
} from "settings/navigation";
import { APP_NAME } from "settings/settings";

export default function Footer() {
  return (
    <footer className="border-t bg-gradient-to-t from-foreground/5 to-background">
      <div className="container mx-auto w-full px-4 py-12 md:px-6 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-12">
          {/* Brand Section */}
          <div className="md:col-span-full lg:col-span-1">
            <LogoHeader />
            <p className="mt-4 text-sm text-muted-foreground">
              Gamifying classroom engagement through modern technology
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">
              Product
            </h4>
            <nav className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                >
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">
              Resources
            </h4>
            <nav className="space-y-2">
              {RESOURCE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
                >
                  {link.text} <ArrowRight size={12} />
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">
              Connect
            </h4>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform text-muted-foreground transition-colors hover:-translate-y-0.5 hover:text-foreground"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-foreground/10 pt-8 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
