export interface SubCase {
  id: string;
  title: string;
  summary: string;
  description: string;
  businessValue: string[];
  techStack: string[];
}

export interface UseCase {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  businessValue: string[];
  techStack: string[];
  limitations: string[];
  complianceFlags: string[];
  subCases?: SubCase[];
  owner?: string;
  lastUpdated?: string;
}

export interface Tracker {
  id: string;
  title: string;
  description?: string;
  usecases: UseCase[];
}

export interface TrackerData {
  trackers: Tracker[];
}
