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

// A single, targeted mutation applied server-side against the latest stored
// data. Using operations instead of posting a whole TrackerData snapshot
// prevents one stale client from overwriting another admin's concurrent edits.
export type TrackerOp =
  | { type: 'addUsecase'; trackerId: string; usecase: UseCase }
  | { type: 'updateUsecase'; usecaseId: string; trackerId: string; usecase: UseCase }
  | { type: 'deleteUsecase'; usecaseId: string }
  | { type: 'addTracker'; tracker: Tracker }
  | { type: 'updateTracker'; trackerId: string; title: string; description?: string }
  | { type: 'deleteTracker'; trackerId: string };
