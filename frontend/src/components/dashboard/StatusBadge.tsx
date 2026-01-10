import type { QueryStatus } from "@/types"

interface StatusBadgeProps {
  status: QueryStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isCompleted = status === "completed"

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
        ${isCompleted ? "gradient-success glow-success" : "gradient-warning glow-warning"}
        text-white shadow-lg
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-white ${!isCompleted ? "animate-pulse" : ""}`}></span>
      {isCompleted ? "Completed" : "Pending"}
    </span>
  )
}
