export type WorkoutNotificationAction = "pause" | "resume";

export type WorkoutNotificationData = {
  title: string;
  text: string;
  chipText?: string | null;
  chronometerBaseMs: number;
  isPaused: boolean;
  accentColor: string;
  keepAlive?: boolean;
  pauseLabel?: string;
  resumeLabel?: string;
};

export type WorkoutNotificationEvents = {
  onAction: (event: { action: WorkoutNotificationAction }) => void;
};
