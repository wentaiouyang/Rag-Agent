import type { Mood } from "@/lib/conversationStorage";

interface MoodAvatarProps {
  mood?: Mood;
  size?: number;
  className?: string;
}

const moodLabels: Record<Mood, string> = {
  happy: "Happy",
  thinking: "Thinking",
  confused: "Confused",
  excited: "Excited",
  neutral: "Neutral",
  sad: "Sad",
};

function MoodFace({ mood, size }: { mood: Mood; size: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const eyeY = cy - s * 0.06;
  const eyeSpacing = s * 0.15;
  const mouthY = cy + s * 0.14;

  const eyeProps = {
    fill: "white",
    r: s * 0.045,
  };

  switch (mood) {
    case "happy":
      return (
        <g>
          {/* Smiling eyes (curved) */}
          <path
            d={`M${cx - eyeSpacing - 3},${eyeY + 1} Q${cx - eyeSpacing},${eyeY - 3} ${cx - eyeSpacing + 3},${eyeY + 1}`}
            stroke="white"
            strokeWidth={s * 0.06}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M${cx + eyeSpacing - 3},${eyeY + 1} Q${cx + eyeSpacing},${eyeY - 3} ${cx + eyeSpacing + 3},${eyeY + 1}`}
            stroke="white"
            strokeWidth={s * 0.06}
            strokeLinecap="round"
            fill="none"
          />
          {/* Smile */}
          <path
            d={`M${cx - s * 0.12},${mouthY} Q${cx},${mouthY + s * 0.1} ${cx + s * 0.12},${mouthY}`}
            stroke="white"
            strokeWidth={s * 0.05}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case "thinking":
      return (
        <g>
          {/* One eye normal, one squinted */}
          <circle cx={cx - eyeSpacing} cy={eyeY} {...eyeProps} />
          <line
            x1={cx + eyeSpacing - 3}
            y1={eyeY}
            x2={cx + eyeSpacing + 3}
            y2={eyeY}
            stroke="white"
            strokeWidth={s * 0.06}
            strokeLinecap="round"
          />
          {/* Wavy/flat mouth */}
          <path
            d={`M${cx - s * 0.1},${mouthY} Q${cx - s * 0.04},${mouthY - s * 0.04} ${cx},${mouthY} Q${cx + s * 0.04},${mouthY + s * 0.04} ${cx + s * 0.1},${mouthY}`}
            stroke="white"
            strokeWidth={s * 0.05}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case "confused":
      return (
        <g>
          {/* Uneven eyes */}
          <circle cx={cx - eyeSpacing} cy={eyeY} {...eyeProps} r={s * 0.05} />
          <circle cx={cx + eyeSpacing} cy={eyeY - 1} {...eyeProps} r={s * 0.035} />
          {/* Squiggly mouth */}
          <path
            d={`M${cx - s * 0.1},${mouthY + s * 0.02} Q${cx - s * 0.04},${mouthY - s * 0.06} ${cx + s * 0.02},${mouthY + s * 0.02} Q${cx + s * 0.06},${mouthY + s * 0.06} ${cx + s * 0.1},${mouthY - s * 0.02}`}
            stroke="white"
            strokeWidth={s * 0.05}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case "excited":
      return (
        <g>
          {/* Wide open eyes (larger circles) */}
          <circle cx={cx - eyeSpacing} cy={eyeY} fill="white" r={s * 0.06} />
          <circle cx={cx + eyeSpacing} cy={eyeY} fill="white" r={s * 0.06} />
          {/* Sparkle dots */}
          <circle cx={cx - eyeSpacing + s * 0.04} cy={eyeY - s * 0.04} fill="white" r={s * 0.015} opacity={0.7} />
          <circle cx={cx + eyeSpacing + s * 0.04} cy={eyeY - s * 0.04} fill="white" r={s * 0.015} opacity={0.7} />
          {/* Open smile */}
          <path
            d={`M${cx - s * 0.1},${mouthY - s * 0.02} Q${cx},${mouthY + s * 0.14} ${cx + s * 0.1},${mouthY - s * 0.02}`}
            stroke="white"
            strokeWidth={s * 0.05}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case "sad":
      return (
        <g>
          {/* Droopy eyes */}
          <circle cx={cx - eyeSpacing} cy={eyeY + 1} {...eyeProps} />
          <circle cx={cx + eyeSpacing} cy={eyeY + 1} {...eyeProps} />
          {/* Eyebrows angled down */}
          <line
            x1={cx - eyeSpacing - 3}
            y1={eyeY - s * 0.1}
            x2={cx - eyeSpacing + 3}
            y2={eyeY - s * 0.08}
            stroke="white"
            strokeWidth={s * 0.04}
            strokeLinecap="round"
            opacity={0.7}
          />
          <line
            x1={cx + eyeSpacing + 3}
            y1={eyeY - s * 0.1}
            x2={cx + eyeSpacing - 3}
            y2={eyeY - s * 0.08}
            stroke="white"
            strokeWidth={s * 0.04}
            strokeLinecap="round"
            opacity={0.7}
          />
          {/* Frown */}
          <path
            d={`M${cx - s * 0.1},${mouthY + s * 0.06} Q${cx},${mouthY - s * 0.06} ${cx + s * 0.1},${mouthY + s * 0.06}`}
            stroke="white"
            strokeWidth={s * 0.05}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );

    case "neutral":
    default:
      return (
        <g>
          {/* Neutral eyes */}
          <circle cx={cx - eyeSpacing} cy={eyeY} {...eyeProps} />
          <circle cx={cx + eyeSpacing} cy={eyeY} {...eyeProps} />
          {/* Flat mouth */}
          <line
            x1={cx - s * 0.09}
            y1={mouthY}
            x2={cx + s * 0.09}
            y2={mouthY}
            stroke="white"
            strokeWidth={s * 0.05}
            strokeLinecap="round"
          />
        </g>
      );
  }
}

export function MoodAvatar({ mood = "neutral", size = 32, className = "" }: MoodAvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title={moodLabels[mood]}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transition-all duration-300 ease-out"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2}
          fill="#8B7CF6"
        />
        {/* Face expression */}
        <MoodFace mood={mood} size={size} />
      </svg>
    </div>
  );
}
