import { z } from "zod";

// Bounds keep a hostile request from making argon2 hash megabytes of input.
const MAX_USERNAME_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 1024;

const loginSchema = z.object({
  username: z.string().trim().min(1).max(MAX_USERNAME_LENGTH),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Validated login fields, or null when the form is incomplete or invalid. */
export function parseLoginInput(form: FormData): LoginInput | null {
  const result = loginSchema.safeParse({
    username: form.get("username"),
    password: form.get("password"),
  });
  return result.success ? result.data : null;
}
