import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './test/global-setup.ts',
    // The suite shares one database, so files must not run concurrently.
    fileParallelism: false,
    include: ['test/**/*.test.ts'],
  },
});
