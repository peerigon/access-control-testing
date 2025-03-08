import typescriptNodePreset from "@peerigon/configs/eslint/presets/typescript-node";

// https://github.com/peerigon/configs/blob/main/eslint/README.md
export default typescriptNodePreset.map((config) => ({
  ...config,
  ignores: [...(config.ignores ?? []), "demo-application/**/*"],
}));
