import { useEffect } from "react";

const SITE = "https://sire.lol";
const DEFAULT_TITLE = "sire.lol — free biolink | one link for everything";
const DEFAULT_DESCRIPTION = "create your free biolink on sire.lol — drop your links, host your files, tell your story. no templates, no bullshit.";

export default function SEO({
  title,
  description,
  image = "/logo.png",
  path = "",
  noindex = false,
  favicon,
}: {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  noindex?: boolean;
  favicon?: string;
}) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    const removeMeta = (name: string, property = false) => {
      const attr = property ? "property" : "name";
      document.querySelectorAll(`meta[${attr}="${name}"]`).forEach((el) => el.remove());
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, true);
      setMeta("twitter:description", description);
    } else {
      setMeta("description", DEFAULT_DESCRIPTION);
      setMeta("og:description", DEFAULT_DESCRIPTION, true);
      setMeta("twitter:description", DEFAULT_DESCRIPTION);
    }

    setMeta("og:title", title || DEFAULT_TITLE, true);
    setMeta("twitter:title", title || DEFAULT_TITLE);
    setMeta("og:type", "website", true);
    setMeta("og:url", `${SITE}${path}`, true);
    setMeta("twitter:card", "summary_large_image");
    const imageUrl = image.startsWith("http") ? image : `${SITE}${image}`;
    setMeta("og:image", imageUrl, true);
    setMeta("twitter:image", imageUrl);
    setMeta("og:site_name", "sire.lol", true);

    setLink("canonical", `${SITE}${path}`);
    if (favicon) {
      const faviconUrl = favicon.startsWith("http") ? favicon : `${SITE}${favicon}`;
      setLink("icon", faviconUrl);
      setLink("shortcut icon", faviconUrl);
    }

    if (noindex) {
      setMeta("robots", "noindex, nofollow");
    } else {
      setMeta("robots", "index, follow");
    }

    return () => {
      removeMeta("robots");
      removeMeta("description");
      removeMeta("og:description", true);
      removeMeta("twitter:description");
      removeMeta("twitter:image");
      removeMeta("og:image", true);
      if (favicon) {
        document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => el.remove());
      }
    };
  }, [title, description, image, path, noindex, favicon]);

  return null;
}
