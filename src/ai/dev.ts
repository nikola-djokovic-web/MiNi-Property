'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-optimized-property-listing.ts';
import '@/ai/flows/triage-maintenance-request.ts';
import '@/ai/flows/tenant-chatbot.ts';
