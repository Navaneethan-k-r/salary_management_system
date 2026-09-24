import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/frontend-web/vite.config.ts',
      {
        test: {
          name: 'shared-auth',
          root: './libs/shared-auth',
          environment: 'node',
          globals: true,
        },
      },
      {
        test: {
          name: 'service-employee',
          root: './apps/service-employee',
          environment: 'node',
          globals: true,
        },
      },
      {
        test: {
          name: 'service-worker',
          root: './apps/service-worker',
          environment: 'node',
          globals: true,
        },
      },
    ],
  },
});
