import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  WEB_URL: z.url(),
  API_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url(),
  MONGODB_URI: z.url(),
  REDIS_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  ADMIN_API_KEY: z.string().min(32),
  COMMAND_SIGNING_SECRET: z.string().min(32),
  OPERATOR_METRICS_TOKEN: z.string().min(32),
});
export const parseEnvironment = (input: NodeJS.ProcessEnv) =>
  schema.parse(input);
export type Environment = z.infer<typeof schema>;
