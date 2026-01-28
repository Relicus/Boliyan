export type SmokeRoute = {
  name: string;
  path: string;
  readySelector: string;
  requiresAuth?: boolean;
};

const MOCK_ITEM_ID = "00000000-0000-0000-0000-000000000023";

export const SMOKE_ROUTES: SmokeRoute[] = [
  { name: "Home", path: "/", readySelector: "#marketplace-grid-root" },
  { name: "Categories", path: "/categories", readySelector: "#categories-page-01" },
  { name: "Privacy Policy", path: "/privacy-policy", readySelector: "#privacy-page-01" },
  { name: "Terms of Service", path: "/terms-of-service", readySelector: "#terms-page-01" },
  { name: "Data Deletion", path: "/data-deletion", readySelector: "#deletion-page-01" },
  { name: "Sign In", path: "/signin", readySelector: "#signin-card" },
  { name: "Sign Up", path: "/signup", readySelector: "#signup-card" },
  {
    name: "Product",
    path: `/product/${MOCK_ITEM_ID}`,
    readySelector: `#product-page-${MOCK_ITEM_ID}`
  },
  {
    name: "Complete Profile",
    path: "/complete-profile",
    readySelector: "#complete-profile-page-01",
    requiresAuth: true
  },
  {
    name: "List Item",
    path: "/list",
    readySelector: "#list-page-container",
    requiresAuth: true
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    readySelector: "#dashboard-actions",
    requiresAuth: true
  },
  {
    name: "Seller Analytics",
    path: "/dashboard/seller",
    readySelector: "#analytics-page",
    requiresAuth: true
  },
  {
    name: "Inbox",
    path: "/inbox",
    readySelector: "#inbox-container",
    requiresAuth: true
  },
  {
    name: "Profile",
    path: "/profile",
    readySelector: "#profile-settings-root",
    requiresAuth: true
  }
];
