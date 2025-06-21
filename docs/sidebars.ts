import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  sidebar: {
    Guides: [
      "guides/getting-started",
      "guides/asset-loading",
      "guides/transformation",
      "guides/light",
      "guides/skybox",
      "guides/camera",
      "guides/animator",
      "guides/images",
      "guides/physics",
      "guides/instancing",
      "guides/reanimated"
    ],
    API: [
      "api/index",
      ...require('./docs/api/typedoc-sidebar.cjs'),
    ],
  },
};

export default sidebars;
