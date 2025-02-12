import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://app.classclarus.com',
            lastModified: new Date(),
        },
    ]
}