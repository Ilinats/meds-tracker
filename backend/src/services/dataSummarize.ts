import axios from 'axios';
 import { fetchFdaMedications } from './fdaFetcher'
 import { fixData } from '../utils/fixUpData';
 import * as dotenv from 'dotenv';
 
 dotenv.config();
 interface DeepSeekMessage {
   role: 'assistant';
   content: string;
 }
 
 interface DeepSeekChoice {
   index: number;
   message: DeepSeekMessage;
   finish_reason: string;
 }
 
 interface DeepSeekUsage {
   prompt_tokens: number;
   completion_tokens: number;
   total_tokens: number;
 }
 
 interface DeepSeekApiResponse {
   id: string;
   object: string;
   created: number;
   choices: DeepSeekChoice[];
   usage: DeepSeekUsage;
 }
 
 interface DeepSeekError {
   error: {
     message: string;
     type?: string;
     code?: string;
   };
 }
 
 type AxiosError = {
   response?: {
     data: DeepSeekError;
   };
   message: string;
 };
 
 type FdaApiResponse = {
   results: Array<{
     description?: string[];
     precautions?: string[];
     dosage_and_administration?: string[];
     adverse_reactions?: string[];
   }>;
 };
 
 type FdaDrugInfo = {
   name: string;
   description?: string;
   precautions?: string;
   dosage_and_administration?: string;
   adverse_reactions?: string;
 };
 
 type SummarizedDrugInfo = {
   name: string;
   description: string;
   precautions: string;
   dosage: string;
   adverseReactions: string;
 };
 
 async function summarizeText(text: string, section: string): Promise<string> {
   const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
   const API_URL = 'https://api.deepseek.com/v1/chat/completions';
 
   if (!text) return 'No data available';
 
   try {
     const response = await axios.post<DeepSeekApiResponse>(API_URL, {
       model: 'deepseek-chat',
       messages: [{
         role: 'user',
         content: `Summarize the ${section} information below concisely, focusing on key points:\n\n${text}`
       }],
       max_tokens: 200,
       temperature: 0.3
     }, {
       headers: {
         'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
         'Content-Type': 'application/json'
       }
     });
 
     return response.data.choices[0].message.content;
   } catch (error) {
     const axiosError = error as AxiosError;
     console.error(`DeepSeek API error for ${section}:`, 
       axiosError.response?.data?.error?.message || axiosError.message);
     return `[Summary unavailable]`;
   }
 }
 
 export async function processMedications(): Promise<SummarizedDrugInfo[]> {
   try {
     const rawData = await fixData();
     const results: SummarizedDrugInfo[] = [];
 
     for (const med of rawData) {
       results.push({
         name: med.name,
         description: await summarizeText(med.description || '', 'description'),
         precautions: await summarizeText(med.precautions || '', 'precautions'),
         dosage: await summarizeText(med.dosage_and_administration || '', 'dosage'),
         adverseReactions: await summarizeText(med.adverse_reactions || '', 'adverse reactions')
       });
     }
 
     return results;
   } catch (error) {
     console.error('Error processing medications:', error);
     throw error;
   }
 }
 
 async function main() {
   try {
     const summarizedMeds = await processMedications();
     console.log(JSON.stringify(summarizedMeds, null, 2));
     
     const lisinopril = summarizedMeds.find(m => m.name === 'Lisinopril');
     if (lisinopril) {
       console.log('\nLisinopril Precautions:', lisinopril.precautions);
     }
   } catch (error) {
     console.error('Error in main:', error);
   }
 }
 
 main();