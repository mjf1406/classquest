import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://app.classquest.app',
            lastModified: new Date(),
        },
    ]
}