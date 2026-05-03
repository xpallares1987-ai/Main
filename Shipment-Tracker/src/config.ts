import { z } from "zod";
import { createEnvValidator } from "@torre/shared";

const envSchema = {
    VITE_GITHUB_GIST_ID: z.string().optional(),
};

const validateEnv = createEnvValidator(envSchema);
export const env = validateEnv(import.meta.env);

export const APP_CONFIG = {
    pageSize: 20,
    theme: 'light',
};
