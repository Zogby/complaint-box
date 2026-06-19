import serverless from "serverless-http";
import { createApp } from "./_core/app";

export const handler = serverless(createApp());
