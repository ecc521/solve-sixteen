import axios from 'axios';
import { format } from 'date-fns';

interface NytCard {
  content: string;
  position: number;
}

interface NytCategory {
  title: string;
  cards: NytCard[];
}

interface NytResponse {
  status: string;
  id: number;
  print_date: string;
  editor: string;
  categories: NytCategory[];
}

export interface Word {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'tricky';
}

const DIFFICULTIES = ['easy', 'medium', 'hard', 'tricky'] as const;

export const getLatestConnections = async (): Promise<Word[]> => {
  try {
    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');
    const url = `https://www.nytimes.com/svc/connections/v2/${formattedDate}.json`;

    console.log(`Fetching Connections data for ${formattedDate} from ${url}...`);
    const response = await axios.get<NytResponse>(url);
    const data = response.data;

    if (data.status !== 'OK') {
      throw new Error(`NYT API returned status: ${data.status}`);
    }

    const words: Word[] = [];
    let idCounter = 1;

    data.categories.forEach((category, index) => {
      const difficulty = DIFFICULTIES[index] || 'tricky';
      category.cards.forEach((card) => {
        words.push({
          id: String(idCounter++),
          text: card.content,
          category: category.title,
          difficulty,
        });
      });
    });

    return words;
  } catch (error) {
    console.error('Error fetching Connections data:', error);
    // Return empty array or throw, depending on how we want to handle failure.
    // For now, let's return an empty array so the server can fallback or just have no words.
    return [];
  }
};
