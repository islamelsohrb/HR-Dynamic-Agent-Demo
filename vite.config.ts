import path from 'path';
<<<<<<< HEAD
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

=======
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
<<<<<<< HEAD
});
=======
});
>>>>>>> 20dafe6ed3bfb9c6cf74c4346460665892823523
