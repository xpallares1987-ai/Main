import { defineConfig } from 'vite';
import { getBaseViteConfig } from '../Shared-Utils/src/vite.config.shared';
import path from 'path';

export default defineConfig(getBaseViteConfig(__dirname));
