import { z } from "zod";

export const SigninRequest = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const SigninResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const RefreshRequest = z.object({
  refresh_token: z.string().min(1),
});

export const RefreshResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const TrackRequest = z.object({
  company_name: z.string().min(1),
  position: z.string().min(1),
  url: z.string().url(),
});

export const TrackResponse = z.object({
  application_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export const ErrorResponse = z.object({
  error: z.string(),
});

export const DuplicateResponse = z.object({
  error: z.string(),
  application_id: z.string().uuid(),
});
