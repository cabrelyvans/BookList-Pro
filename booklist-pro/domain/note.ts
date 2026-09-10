import { z } from 'zod';

export const schemaNote = z.object({
  id: z.string(),
  livreId: z.string(),
  contenu: z.string().max(1000),
  createdAt: z.string(),
});

export type NoteLecture = z.infer<typeof schemaNote>;
