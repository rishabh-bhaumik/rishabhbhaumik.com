import type { BotDefinition, NetraAnimation } from "./types";

/** Key of the animation `withHeldExpression` adds. */
export const HELD_ANIMATION_KEY = "__held";

/**
 * The definition plus one loop that simply holds `expressionKey` (still
 * blinking, with its ambient motion), so any saved face can be a resting state:
 * <NetraBot expression="sceptical" />. (From BimaNetra's lib/netrabot/edit.ts.)
 */
export function withHeldExpression(definition: BotDefinition, expressionKey: string): BotDefinition {
  if (!definition.expressions[expressionKey]) return definition;
  const blink = definition.animations.idle?.blink ?? definition.animations[definition.animationOrder[0]]?.blink;
  const held: NetraAnimation = {
    label: definition.expressions[expressionKey].label,
    group: "Held face",
    description: "",
    kind: "loop",
    playbackMode: "loop",
    steps: [
      { expression: expressionKey, holdMs: 4000, transitionMs: 400, easing: "smooth", bounce: 0.3, intensity: 1, effect: "none" },
    ],
    blink: blink ?? {
      enabled: true,
      initialDelayMs: 1800,
      minIntervalMs: 2800,
      maxIntervalMs: 5000,
      durationMs: 260,
      closedHeight: 4,
      doubleChance: 0.12,
    },
  };
  return { ...definition, animations: { ...definition.animations, [HELD_ANIMATION_KEY]: held } };
}
