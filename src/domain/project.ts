export type SimilarProject = {
  name: string;
  reason: string;
  url: string;
};

export type Project = {
  origin: 'github';
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage?: string | null;
  language?: string | null;
  createdAt: string;
  updatedAt: string;
  readme: string;
  tags: string[];
  similarTo?: SimilarProject[];
};
