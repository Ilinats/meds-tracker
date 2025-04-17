import { Request, Response } from 'express';
import { PrismaClient } from '../../prisma/app/generated/prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

function startsWithAnyWord(text: string, searchWords: string[]): boolean {
  const words = text.toLowerCase().split(' ');
  return words.some(word =>
    searchWords.some(searchWord =>
      word.startsWith(searchWord.toLowerCase())
    )
  );
}

export const searchMedicines = async (req: Request, res: Response) => {
    try {
      const { query = '' } = req.query;
      const userId = "f6960d1a-db9a-46c5-b76d-147fd7743e76"; 
  
      if (typeof query !== 'string') {
            res.status(400).json({
            success: false,
            message: 'Search query must be at least 2 characters long',
            });
            return;
      }
  
      const searchWords = query.trim().toLowerCase().split(/\s+/);
  
      const presetResults = await prisma.presetMedicine.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              category: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
      });
  
      const filteredPreset = presetResults.filter(med => {
        return (
          startsWithAnyWord(med.name, searchWords) ||
          startsWithAnyWord(med.category, searchWords)
        );
      });
  
      const userCustomMeds = await prisma.userMedicine.findMany({
        where: {
          userId,
          isPreset: false,
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              category: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
      });
  
      const filteredCustom = userCustomMeds.filter(med => {
        return (
          startsWithAnyWord(med.name, searchWords) ||
          startsWithAnyWord(med.category, searchWords)
        );
      });

      const results = [
        ...filteredPreset.map(med => ({ ...med, type: 'preset' })),
        ...filteredCustom.map(med => ({ ...med, type: 'custom' })),
      ];
  
        res.json({
        success: true,
        data: results,
        metadata: {
          searchWords,
          presetCount: filteredPreset.length,
          customCount: filteredCustom.length,
          totalResults: results.length,
        },
        
      });
    } catch (error) {
      console.error('[searchMedicines error]', error);
        res.status(500).json({
        success: false,
        message: 'Search failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };