import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
    server: {
        DISCORD_TOKEN: z.string(),
        PREFIX: z.string().max(1),
        BOT_ID: z.string(),
        GUILD_ID: z.string().optional(),
    },

    runtimeEnv: process.env,
});
