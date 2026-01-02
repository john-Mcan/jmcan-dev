import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://johnmcan.dev";

export const SITE_NAME = "John Moya Cantillana";
export const FAVICON_SVG_PATH = "/favicon.svg";
export const OG_IMAGE_PATH = "/og.png";
export const TWITTER_HANDLE = "@johnmcan";
export const OPEN_GRAPH_LOCALE = "es_ES";
export const OPEN_GRAPH_ALTERNATE_LOCALE = "en_US";

type CreatePageMetadataInput = {
  title: string;
  description: string;
  path: `/${string}` | "/";
  socialTitle?: string;
  openGraphType?: "website" | "article";
};

export function createPageMetadata({
  title,
  description,
  path,
  socialTitle,
  openGraphType,
}: CreatePageMetadataInput): Metadata {
  const resolvedSocialTitle = socialTitle ?? `${title} | ${SITE_NAME}`;
  const resolvedOpenGraphType = openGraphType ?? "website";

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: resolvedOpenGraphType,
      siteName: SITE_NAME,
      locale: OPEN_GRAPH_LOCALE,
      alternateLocale: OPEN_GRAPH_ALTERNATE_LOCALE,
      title: resolvedSocialTitle,
      description,
      url: path,
      images: [
        {
          url: OG_IMAGE_PATH,
          alt: `${SITE_NAME} — Portfolio`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      creator: TWITTER_HANDLE,
      site: TWITTER_HANDLE,
      title: resolvedSocialTitle,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}


