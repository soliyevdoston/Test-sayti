const ensureMetaTag = (name, attr = "name") => {
  const selector = `${attr}="${name}"`;
  let node = document.head.querySelector(`meta[${selector}]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, name);
    document.head.appendChild(node);
  }
  return node;
};

const ensureCanonical = () => {
  let node = document.head.querySelector("link[rel='canonical']");
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }
  return node;
};

export const applySeoMeta = ({
  title,
  description,
  keywords,
  canonicalPath = "/",
}) => {
  if (typeof document === "undefined") return;

  if (title) {
    document.title = title;
    ensureMetaTag("og:title", "property").setAttribute("content", title);
    ensureMetaTag("twitter:title").setAttribute("content", title);
  }

  if (description) {
    ensureMetaTag("description").setAttribute("content", description);
    ensureMetaTag("og:description", "property").setAttribute("content", description);
    ensureMetaTag("twitter:description").setAttribute("content", description);
  }

  if (keywords) {
    ensureMetaTag("keywords").setAttribute("content", keywords);
  }

  const canonical = ensureCanonical();
  canonical.setAttribute("href", `https://testonlinee.uz${canonicalPath}`);
  ensureMetaTag("og:url", "property").setAttribute("content", `https://testonlinee.uz${canonicalPath}`);
};
