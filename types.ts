
export enum Category {
  TECH = 'Technology & AI',
  SPACE = 'Space & Science',
  CLIMATE = 'Environment',
  WORLD = 'Global Affairs',
  CULTURE = 'Art & Culture'
}

export interface NewsBriefing {
  id: string;
  category: Category;
  title: string;
  summary: string;
  keyTakeaways: string[];
  interestingFact: string;
  sourceUrls: string[];
}

// Added NewsItem interface to support the QuizModal component
export interface NewsItem {
  id: string;
  category: Category;
  title: string;
  summary: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourceUrls: string[];
}

export interface GameState {
  score: number;
  clearedNodes: number;
  totalNodes: number;
  activeBriefing: NewsBriefing | null;
  loading: boolean;
  gameStarted: boolean;
  archive: NewsBriefing[];
}
