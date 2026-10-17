import { Button, HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
    activityBackgroundTint,
    background,
    buttonStyle,
    font,
    foregroundStyle,
    frame,
    lineLimit,
    monospacedDigit,
    padding,
    shapes,
} from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";

export type WorkoutActivityProps = {
  type: "CARDIO" | "STRENGTH";
  isPaused: boolean;
  effectiveStartMs: number;
  pausedAtMs: number;
  title: string;
  metric1Value: string;
  metric1Label: string;
  metric2Value: string;
  metric2Label: string;
  detail: string;
};

const WorkoutActivity = (
  props: WorkoutActivityProps,
  environment: LiveActivityEnvironment,
) => {
  "widget";
  const ORANGE = "#FC4C02";
  const GRAY = "#8E8E93";
  const accent = environment.isLuminanceReduced ? "#FFF" : ORANGE;
  const icon = props.type === "CARDIO" ? "figure.run" : "dumbbell.fill";
  const status = props.isPaused ? "SZUNET" : props.title.toUpperCase();

  const start = new Date(props.effectiveStartMs);
  const end = new Date(props.effectiveStartMs + 12 * 60 * 60 * 1000);
  const pauseTime = props.isPaused
    ? new Date(props.effectiveStartMs)
    : undefined;

  const timer = (size: number) => (
    <Text
      timerInterval={{ lower: start, upper: end }}
      countsDown={false}
      pauseTime={pauseTime}
      modifiers={[
        font({ size, weight: "heavy", design: "rounded" }),
        monospacedDigit(),
        foregroundStyle(props.isPaused ? GRAY : "#FFF"),
      ]}
    />
  );

  const metric = (value: string, label: string) => (
    <VStack alignment="leading" spacing={0}>
      <Text
        modifiers={[
          font({ size: 20, weight: "bold", design: "rounded" }),
          monospacedDigit(),
          foregroundStyle("#FFFFFF"),
        ]}
      >
        {value}
      </Text>
      <Text
        modifiers={[
          font({ size: 10, weight: "semibold" }),
          foregroundStyle(GRAY),
        ]}
      >
        {label}
      </Text>
    </VStack>
  );

  const pauseButton = (size: number) => (
    <Button
      target={props.isPaused ? "resume" : "pause"}
      modifiers={[buttonStyle("plain")]}
    >
      <Image
        systemName={props.isPaused ? "play.fill" : "pause.fill"}
        size={size * 0.42}
        color="#000000"
        modifiers={[
          frame({ width: size, height: size }),
          background(accent, shapes.circle()),
        ]}
      />
    </Button>
  );

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={10}
        modifiers={[padding({ all: 16 }), activityBackgroundTint("#0B0B0C")]}
      >
        <HStack spacing={6}>
          <Image systemName={icon} size={13} color={accent} />
          <Text
            modifiers={[
              font({ size: 12, weight: "heavy" }),
              foregroundStyle(accent),
            ]}
          >
            {status}
          </Text>
          <Spacer />
          <Text
            modifiers={[
              font({ size: 12, weight: "medium" }),
              foregroundStyle(GRAY),
              lineLimit(1),
            ]}
          >
            {props.detail}
          </Text>
        </HStack>

        <HStack alignment="center">
          {timer(40)}
          <Spacer />
          {pauseButton(48)}
        </HStack>

        <HStack spacing={28}>
          {metric(props.metric1Value, props.metric1Label)}
          {metric(props.metric2Value, props.metric2Label)}
          <Spacer />
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName={icon} color={accent} />,
    compactTrailing: (
      <Text
        timerInterval={{ lower: start, upper: end }}
        countsDown={false}
        pauseTime={pauseTime}
        modifiers={[
          monospacedDigit(),
          frame({ maxWidth: 56 }),
          foregroundStyle(accent),
        ]}
      />
    ),
    minimal: <Image systemName={icon} color={accent} />,
    expandedLeading: metric(props.metric1Value, props.metric1Label),
    expandedTrailing: metric(props.metric2Value, props.metric2Label),
    expandedCenter: timer(28),
    expandedBottom: (
      <HStack>
        <Text
          modifiers={[font({ size: 13 }), foregroundStyle(GRAY), lineLimit(1)]}
        >
          {props.detail}
        </Text>
        <Spacer />
        {pauseButton(40)}
      </HStack>
    ),
  };
};

export const WorkoutLiveActivity = createLiveActivity<WorkoutActivityProps>(
  "WorkoutActivity",
  WorkoutActivity,
);
