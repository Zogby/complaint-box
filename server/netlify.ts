import serverless from "serverless-http";
import { createApp } from "./_core/app";

const app = createApp();

export const handler = serverless(app);