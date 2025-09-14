// for page navigation & to sort on leftbar

export type EachRoute = {
  title: string;
  href: string;
  noLink?: true; // noLink will create a route segment (section) but cannot be navigated
  items?: EachRoute[];
  tag?: string;
};

export const ROUTES: EachRoute[] = [
  {
    title: "Getting Started",
    href: "/getting-started",
    noLink: true,
    items: [
      { title: "Introduction", href: "/introduction" },
      { title: "Installation", href: "/installation" },
      { title: "Quick Start Guide", href: "/quick-start-guide" },
    ],
  },
  {
    title: "API Reference",
    href: "/api",
    noLink: true,
    items: [
      { title: "proxy()", href: "/proxy" },
      { title: "useStore()", href: "/useStore" },
      { title: "useInitSync()", href: "/useInitSync" },
    ],
  },
  {
    title: "Guides",
    href: "/guides",
    noLink: true,
    items: [
      { title: "API Integration Guide", href: "/integration" },
      { title: "Fine-Grained Reactivity", href: "/fine-grained" },
      { title: "Working with Arrays and Objects", href: "/arrays-objects" },
      // { title: "Performance Optimization", href: "/performance" },
      // { title: "TypeScript Usage", href: "/typescript" },
      // { title: "Advanced Patterns", href: "/advanced" },
    ],
  },
  {
    title: "Examples",
    href: "/examples",
    noLink: true,
    items: [
      { title: "Counter Example", href: "/counter" },
      { title: "Shopping Cart", href: "/shopping-cart" },
      { title: "Dashboard", href: "/dashboard" },
      { title: "Todo List", href: "/todo-list" },
    ],
  },
];

type Page = { title: string; href: string };

function getRecurrsiveAllLinks(node: EachRoute) {
  const ans: Page[] = [];
  if (!node.noLink) {
    ans.push({ title: node.title, href: node.href });
  }
  node.items?.forEach((subNode) => {
    const temp = { ...subNode, href: `${node.href}${subNode.href}` };
    ans.push(...getRecurrsiveAllLinks(temp));
  });
  return ans;
}

export const page_routes = ROUTES.map((it) => getRecurrsiveAllLinks(it)).flat();
