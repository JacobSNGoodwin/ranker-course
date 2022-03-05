// Courtesy https://github.com/The24thDS/vite-reactts17-chakra-jest-husky
module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  coverageProvider: 'v8',
  coverageDirectory: '<rootDir>/coverage/',
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$', '(.*).d.ts$'],
  moduleDirectories: ['node_modules', './src'],
  moduleNameMapper: {
    '.+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2|svg)$':
      'identity-obj-proxy',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testTimeout: 30000,
};
