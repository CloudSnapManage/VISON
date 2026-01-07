
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
  // Quiz integration
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GameState {
  score: number;
  clearedNodes: number;
  totalNodes: number;
  activeBriefing: NewsBriefing | null;
  activeQuiz: NewsBriefing | null;
  loading: boolean;
  gameStarted: boolean;
  archive: NewsBriefing[];
}
