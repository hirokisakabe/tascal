const { getDefaultConfig } = require("expo/metro-config");
const { withStorybook } = require("@storybook/react-native/withStorybook");

const config = getDefaultConfig(__dirname);

// Storybook 10.4+ swaps the complete entry point only when
// STORYBOOK_ENABLED=true. Without it this wrapper is a strict no-op, keeping
// Storybook code out of the normal application bundle.
module.exports = withStorybook(config);
