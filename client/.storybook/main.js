module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials'],
  framework: '@storybook/react',
  core: {
    builder: 'storybook-builder-vite',
  },
  viteFinal: async (config, { configType }) => {
    // config is storybook's vite config
    // config type is 'DEVELOPMENT'

    // configure camelCase CSS Modules
    return {
      ...config,
      css: {
        modules: {
          localsConvention: 'camelCaseOnly',
        },
      },
    };
  },
};
