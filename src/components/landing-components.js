import { createElement, Fragment } from "react";

const h = createElement;
const selected = (components, id) => components.some((entry) => entry.id === id && entry.status !== "excluded");

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

export function LandingHero({ site, hero }) {
  return h("section", { className: "hero", "aria-labelledby": "hero-heading" }, h("div", { className: "shell" },
    hero.eyebrow ? h("p", { className: "eyebrow" }, hero.eyebrow) : null,
    h("h1", { id: "hero-heading", className: "hero__headline" }, hero.headline),
    hero.lede ? h("p", { className: "hero__lede" }, h(LandingRich, { text: hero.lede })) : null,
    h("div", { className: "actions hero__actions" },
      h(LandingAction, { action: site.primaryAction }),
      site.secondaryAction?.target ? h("a", { className: "button button--secondary", href: site.secondaryAction.target }, site.secondaryAction.label) : null,
    ),
    site.commitment ? h("p", { className: "commitment hero__commitment" }, site.commitment) : null,
    hero.proofStrip?.length ? h("ul", { className: "proof-strip" }, ...hero.proofStrip.map((entry) => h("li", { key: entry }, entry))) : null,
  ));
}

export function LandingRecognition({ section }) {
  return h(LandingSectionShell, { section },
    h("p", { className: "section-lede" }, h(LandingRich, { text: section.lede })),
    h("div", { className: "card-grid" }, ...section.items.map((item) => h("article", { className: "card", key: item.title },
      h("h3", null, item.title), h("p", null, h(LandingRich, { text: item.text })),
    ))),
  );
}

export function LandingMechanism({ section }) {
  return h(LandingSectionShell, { section },
    h("p", { className: "section-lede" }, h(LandingRich, { text: section.lede })),
    h("ol", { className: "steps" }, ...section.items.map((item) => h("li", { key: item.step },
      h("span", { className: "steps__number", "aria-hidden": "true" }, item.step),
      h("div", null, h("h3", null, item.title), h("p", null, h(LandingRich, { text: item.text }))),
    ))),
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
  return h("div", { className: "artifact artifact--table" }, h("table", null,
    h("caption", null, artifact.caption),
    h("thead", null, h("tr", null, ...artifact.columns.map((column) => h("th", { key: column, scope: "col" }, column)))),
    h("tbody", null, ...artifact.rows.map((row) => h("tr", { key: row.join("|") }, ...row.map((cell, index) =>
      index === 0 ? h("th", { key: cell, scope: "row" }, cell) : h("td", { key: cell }, cell),
    )))),
  ));
}

export function LandingProof({ section }) {
  return h(LandingSectionShell, { section },
    h("p", { className: "section-lede" }, h(LandingRich, { text: section.lede })),
    h(LandingArtifact, { artifact: section.artifact }),
  );
}

export function LandingObjection({ section }) {
  return h(LandingSectionShell, { section }, h("div", { className: "qa" }, ...section.items.map((item) =>
    h("div", { className: "qa__item", key: item.question }, h("h3", null, item.question), h("p", null, h(LandingRich, { text: item.answer }))),
  )));
}

export function LandingDecision({ site, section }) {
  return h("section", { className: "decision", id: section.id, "aria-labelledby": `${section.id}-heading` }, h("div", { className: "shell decision__inner" },
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

function LandingSectionShell({ section, children }) {
  const headingId = `${section.id}-heading`;
  return h("section", { id: section.id, "aria-labelledby": headingId }, h("div", { className: "shell" },
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
    selected(components, "landing.hero") ? h(LandingHero, { site, hero: plan.hero }) : null,
    ...body.map((section) => {
      const match = sectionComponents[section.kind];
      return match && selected(components, match[0]) ? h(match[1], { key: section.id, section }) : null;
    }),
    decision && selected(components, "landing.decision") ? h(LandingDecision, { site, section: decision }) : null,
  );
}
