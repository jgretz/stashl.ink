export type TaskMessageType = 'import-feed' | 'import-all-feeds' | 'import-emails';

export interface ImportFeedPayload {
  feedId: string;
  feedUrl: string;
}

export interface ImportAllFeedsPayload {
  feeds: Array<{feedId: string; feedUrl: string}>;
}

export interface ImportEmailsPayload {
  userId: string;
}

export type TaskMessagePayload =
  | ImportFeedPayload
  | ImportAllFeedsPayload
  | ImportEmailsPayload;

export interface TaskMessage<T extends TaskMessageType = TaskMessageType> {
  type: T;
  payload: T extends 'import-feed'
    ? ImportFeedPayload
    : T extends 'import-all-feeds'
      ? ImportAllFeedsPayload
      : T extends 'import-emails'
        ? ImportEmailsPayload
        : never;
}

export function createTaskMessage<T extends TaskMessageType>(
  type: T,
  payload: TaskMessage<T>['payload']
): TaskMessage<T> {
  return {type, payload} as TaskMessage<T>;
}
