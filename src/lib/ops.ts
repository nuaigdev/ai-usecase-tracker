import type { TrackerData, TrackerOp } from '../types';

export class OpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function applyOp(data: TrackerData, op: TrackerOp): TrackerData {
  switch (op.type) {
    case 'addUsecase': {
      if (!data.trackers.some(t => t.id === op.trackerId)) {
        throw new OpError(404, `Tracker "${op.trackerId}" no longer exists.`);
      }
      if (data.trackers.some(t => t.usecases.some(u => u.id === op.usecase.id))) {
        throw new OpError(409, `ID "${op.usecase.id}" already exists.`);
      }
      return {
        trackers: data.trackers.map(t =>
          t.id === op.trackerId ? { ...t, usecases: [...t.usecases, op.usecase] } : t
        ),
      };
    }
    case 'updateUsecase': {
      const oldTrackerId = data.trackers.find(t => t.usecases.some(u => u.id === op.usecaseId))?.id;
      if (!oldTrackerId) {
        throw new OpError(404, `Use case "${op.usecaseId}" no longer exists (someone else may have deleted it).`);
      }
      if (!data.trackers.some(t => t.id === op.trackerId)) {
        throw new OpError(404, `Tracker "${op.trackerId}" no longer exists.`);
      }
      if (oldTrackerId !== op.trackerId) {
        return {
          trackers: data.trackers.map(t => {
            if (t.id === oldTrackerId) return { ...t, usecases: t.usecases.filter(u => u.id !== op.usecaseId) };
            if (t.id === op.trackerId) return { ...t, usecases: [...t.usecases, op.usecase] };
            return t;
          }),
        };
      }
      return {
        trackers: data.trackers.map(t =>
          t.id === oldTrackerId
            ? { ...t, usecases: t.usecases.map(u => (u.id === op.usecaseId ? op.usecase : u)) }
            : t
        ),
      };
    }
    case 'deleteUsecase': {
      return {
        trackers: data.trackers.map(t => ({ ...t, usecases: t.usecases.filter(u => u.id !== op.usecaseId) })),
      };
    }
    case 'addTracker': {
      if (data.trackers.some(t => t.id === op.tracker.id)) {
        throw new OpError(409, `A tracker with id "${op.tracker.id}" already exists.`);
      }
      return { trackers: [...data.trackers, op.tracker] };
    }
    case 'updateTracker': {
      if (!data.trackers.some(t => t.id === op.trackerId)) {
        throw new OpError(404, `Tracker "${op.trackerId}" no longer exists.`);
      }
      return {
        trackers: data.trackers.map(t =>
          t.id === op.trackerId ? { ...t, title: op.title, description: op.description } : t
        ),
      };
    }
    case 'deleteTracker': {
      return { trackers: data.trackers.filter(t => t.id !== op.trackerId) };
    }
  }
}
