import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const siteUrl = "https://wavelens.expo.app";
const previewImageUrl = `${siteUrl}/social-preview.png`;
const title = "WaveLens | Surf Photography and Video";
const description =
  "Find local surf photographers and videographers, request a session, and capture your best waves.";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />

        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={siteUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="WaveLens" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={previewImageUrl} />
        <meta property="og:image:secure_url" content={previewImageUrl} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="WaveLens surfer riding a wave at sunrise"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={previewImageUrl} />
        <meta name="theme-color" content="#061827" />
        <meta name="apple-mobile-web-app-title" content="WaveLens" />
      </head>
      <body>{children}</body>
    </html>
  );
}
