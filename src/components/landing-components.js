import { createElement, Fragment } from "react";

const h = createElement;
const selected = (components, id) => components.some((entry) => entry.id === id && entry.status !== "excluded");

/**
 * The forms each landing component can take. A zone keeps its place in the
 * page; its form decides the silhouette. Twenty products sharing one zone
 * order stop sharing one shape, and no form invents copy: each renders typed
 * plan content only, which is why the content contract is written next to it
 * in `landing-components.json`.
 */
export const landingForms = {
  "landing.header": ["bar"],
  "landing.hero": ["statement", "split", "terminal"],
  "landing.recognition": ["list", "columns"],
  "landing.mechanism": ["steps", "pairs"],
  "landing.proof": ["terminal", "table", "quote", "screenshot"],
  "landing.objection": ["qa"],
  "landing.decision": ["panel"],
  "landing.footer": ["links"],
};

export const landingDefaultForms = {
  "landing.header": "bar",
  "landing.hero": "statement",
  "landing.recognition": "list",
  "landing.mechanism": "steps",
  "landing.proof": "terminal",
  "landing.objection": "qa",
  "landing.decision": "panel",
  "landing.footer": "links",
};

/**
 * The form a human component plan chose for one component, or its default.
 * A plan may name an ordered list when the zone appears more than once on
 * the page (two proofs: a transcript, then a table); `ordinal` is the
 * section's position among sections of its kind, and the nth section takes
 * the nth form. The generator refuses more sections than named forms, so a
 * missing entry here is a plan that bypassed it and falls back to the default.
 */
export function landingFormOf(componentPlan, componentId, ordinal = 0) {
  const entry = (componentPlan?.components ?? []).find((candidate) => candidate.id === componentId);
  const chosen = Array.isArray(entry?.form) ? entry.form[ordinal] : entry?.form;
  return (landingForms[componentId] ?? []).includes(chosen) ? chosen : landingDefaultForms[componentId];
}

/**
 * Where a screenshot artifact's image lives in a generated site. The plan
 * names a file from the brief's canonical assets; the generator copies it to
 * `public/proof/` (see `landing-cli/src/emit/site.js`), so the served path is
 * the file's own name under that directory.
 */
export function landingProofImagePath(source) {
  return `/proof/${String(source).split("/").pop()}`;
}

export function LandingRich({ text }) {
  return h(Fragment, null, ...String(text).split("`").map((part, index) =>
    index % 2 ? h("code", { key: index }, part) : h("span", { key: index }, part),
  ));
}

export function LandingAction({ action, variant = "primary", className = "" }) {
  const classes = ["button", `button--${variant}`, className].filter(Boolean).join(" ");
  return h("a", {
    className: classes,
    href: action.target,
    "data-primary-action": variant === "primary" ? "true" : undefined,
    "data-action-kind": action.kind,
    ...(String(action.target).startsWith("http") ? { rel: "noreferrer" } : {}),
  }, action.label);
}

export function LandingHeader({ site }) {
  return h("header", { className: "site-header" }, h("div", { className: "shell site-header__inner" },
    h("a", { className: "wordmark", href: "/" }, site.product),
    h("nav", { className: "site-nav", "aria-label": "Primary" },
      ...site.nav.map((link) => h("a", { key: link.href, href: link.href, className: "site-nav__optional" }, link.label)),
      h(LandingAction, { action: site.primaryAction, variant: "secondary", className: "site-nav__cta" }),
    ),
  ));
}

function heroStatement({ site, hero }) {
  return [
    hero.eyebrow ? h("p", { className: "eyebrow", key: "eyebrow" }, hero.eyebrow) : null,
    h("h1", { id: "hero-heading", className: "hero__headline", key: "headline" }, hero.headline),
    hero.lede ? h("p", { className: "hero__lede", key: "lede" }, h(LandingRich, { text: hero.lede })) : null,
    h("div", { className: "actions hero__actions", key: "actions" },
      h(LandingAction, { action: site.primaryAction }),
      site.secondaryAction?.target ? h("a", { className: "button button--secondary", href: site.secondaryAction.target }, site.secondaryAction.label) : null,
    ),
    site.commitment ? h("p", { className: "commitment hero__commitment", key: "commitment" }, site.commitment) : null,
  ];
}

function heroProofStrip(hero) {
  if (!hero.proofStrip?.length) return null;
  return h("ul", { className: "proof-strip", key: "strip" }, ...hero.proofStrip.map((entry) => h("li", { key: entry }, entry)));
}

export function LandingHero({ site, hero, form = "statement" }) {
  const body = form === "split"
    ? [
        h("div", { className: "hero__split", key: "split" },
          h("div", { className: "hero__column" }, ...heroStatement({ site, hero })),
          h("div", { className: "hero__aside" }, h(LandingArtifact, { artifact: hero.artifact })),
        ),
        heroProofStrip(hero),
      ]
    : form === "terminal"
      ? [
          ...heroStatement({ site, hero }),
          h("div", { className: "hero__artifact", key: "artifact" }, h(LandingArtifact, { artifact: hero.artifact })),
          heroProofStrip(hero),
        ]
      : [...heroStatement({ site, hero }), heroProofStrip(hero)];
  return h("section", { className: `hero hero--${form}`, "aria-labelledby": "hero-heading" },
    h("div", { className: "shell" }, ...body),
  );
}

export function LandingRecognition({ section, form = "list" }) {
  const items = form === "columns"
    ? h("div", { className: "columns" }, ...section.items.map((item) => h("article", { className: "columns__item", key: item.title },
        h("h3", { className: "columns__title" }, item.title), h("p", null, h(LandingRich, { text: item.text })),
      )))
    : h("div", { className: "card-grid" }, ...section.items.map((item) => h("article", { className: "card", key: item.title },
        h("h3", null, item.title), h("p", null, h(LandingRich, { text: item.text })),
      )));
  return h(LandingSectionShell, { section, form },
    h("p", { className: "section-lede" }, h(LandingRich, { text: section.lede })),
    items,
  );
}

export function LandingMechanism({ section, form = "steps" }) {
  const items = form === "pairs"
    ? h("div", { className: "pairs" },
        h("p", { className: "pairs__label", key: "before-heading" }, section.beforeHeading),
        h("p", { className: "pairs__label", key: "after-heading" }, section.afterHeading),
        ...section.items.map((item) => h(Fragment, { key: item.title },
          h("h3", { className: "pairs__title" }, item.title),
          h("p", { className: "pairs__cell pairs__cell--before" }, h(LandingRich, { text: item.before })),
          h("p", { className: "pairs__cell pairs__cell--after" }, h(LandingRich, { text: item.after })),
        )),
      )
    : h("ol", { className: "steps" }, ...section.items.map((item) => h("li", { key: item.step },
        h("span", { className: "steps__number", "aria-hidden": "true" }, item.step),
        h("div", null, h("h3", null, item.title), h("p", null, h(LandingRich, { text: item.text }))),
      )));
  return h(LandingSectionShell, { section, form },
    h("p", { className: "section-lede" }, h(LandingRich, { text: section.lede })),
    items,
  );
}

function LandingArtifact({ artifact }) {
  if (artifact.type === "terminal") return h("figure", { className: "artifact" },
    h("pre", { className: "artifact__body", tabIndex: 0, role: "group", "aria-label": artifact.caption }, h("code", null, artifact.lines.join("\n"))),
    h("figcaption", null, artifact.caption),
  );
  if (artifact.type === "code") return h("figure", { className: "artifact" },
    h("pre", { className: "artifact__body", tabIndex: 0, role: "group", "aria-label": artifact.caption }, h("code", { "data-language": artifact.language }, artifact.code)),
    h("figcaption", null, artifact.caption),
  );
  if (artifact.type === "quote") return h("figure", { className: "artifact artifact--quote" },
    h("blockquote", { className: "artifact__quote" }, h("p", null, artifact.text)),
    h("figcaption", null, artifact.caption, " ", h("cite", { className: "artifact__source" }, artifact.source)),
  );
  if (artifact.type === "screenshot") return h("figure", { className: "artifact artifact--screenshot" },
    h("img", {
      className: "artifact__image",
      src: landingProofImagePath(artifact.source),
      alt: artifact.alt,
      loading: "lazy",
      decoding: "async",
      ...(artifact.width && artifact.height ? { width: artifact.width, height: artifact.height } : {}),
    }),
    h("figcaption", null, artifact.caption),
  );
  return h("div", { className: "artifact artifact--table" }, h("table", null,
    h("caption", null, artifact.caption),
    h("thead", null, h("tr", null, ...artifact.columns.map((column) => h("th", { key: column, scope: "col" }, column)))),
    h("tbody", null, ...artifact.rows.map((row) => h("tr", { key: row.join("|") }, ...row.map((cell, index) =>
      index === 0 ? h("th", { key: cell, scope: "row" }, cell) : h("td", { key: cell }, cell),
    )))),
  ));
}

export function LandingProof({ section, form = "terminal" }) {
  return h(LandingSectionShell, { section, form },
    h("p", { className: "section-lede" }, h(LandingRich, { text: section.lede })),
    h(LandingArtifact, { artifact: section.artifact }),
  );
}

export function LandingObjection({ section, form = "qa" }) {
  return h(LandingSectionShell, { section, form }, h("div", { className: "qa" }, ...section.items.map((item) =>
    h("div", { className: "qa__item", key: item.question }, h("h3", null, item.question), h("p", null, h(LandingRich, { text: item.answer }))),
  )));
}

export function LandingDecision({ site, section, form = "panel" }) {
  return h("section", { className: `decision decision--${form}`, id: section.id, "aria-labelledby": `${section.id}-heading` }, h("div", { className: "shell decision__inner" },
    h("h2", { id: `${section.id}-heading`, className: "section-heading" }, section.heading),
    h("p", { className: "section-lede" }, h(LandingRich, { text: section.lede })),
    h("div", { className: "actions" }, h(LandingAction, { action: site.primaryAction })),
    site.commitment ? h("p", { className: "commitment" }, site.commitment) : null,
  ));
}

export function LandingFooter({ site }) {
  return h("footer", { className: "site-footer" }, h("div", { className: "shell site-footer__inner" },
    h("p", null, `${site.product} — ${site.description}`),
    h("nav", { "aria-label": "Footer" }, ...site.footer.map((link) => h("a", { key: link.href, href: link.href }, link.label))),
  ));
}

function LandingSectionShell({ section, form, children }) {
  const headingId = `${section.id}-heading`;
  return h("section", {
    id: section.id,
    className: form ? `${section.kind} ${section.kind}--${form}` : undefined,
    "aria-labelledby": headingId,
  }, h("div", { className: "shell" },
    h("h2", { id: headingId, className: "section-heading" }, section.heading), children,
  ));
}

const sectionComponents = {
  recognition: ["landing.recognition", LandingRecognition],
  mechanism: ["landing.mechanism", LandingMechanism],
  proof: ["landing.proof", LandingProof],
  objection: ["landing.objection", LandingObjection],
};

export function LandingPage({ site, plan, componentPlan }) {
  const components = componentPlan.components ?? [];
  const decision = plan.sections.find((section) => section.kind === "decision");
  const body = plan.sections.filter((section) => section.kind !== "decision");
  return h(Fragment, null,
    selected(components, "landing.hero")
      ? h(LandingHero, { site, hero: plan.hero, form: landingFormOf(componentPlan, "landing.hero") })
      : null,
    ...body.map((section, index) => {
      const match = sectionComponents[section.kind];
      if (!match || !selected(components, match[0])) return null;
      const ordinal = body.slice(0, index).filter((earlier) => earlier.kind === section.kind).length;
      return h(match[1], { key: section.id, section, form: landingFormOf(componentPlan, match[0], ordinal) });
    }),
    decision && selected(components, "landing.decision")
      ? h(LandingDecision, { site, section: decision, form: landingFormOf(componentPlan, "landing.decision") })
      : null,
  );
}
