import { cn } from "@/lib/cn"
import type { User } from "@/lib/user"

interface UserAvatarProps {
  user: Pick<User, "name" | "initials" | "avatarUrl">
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-16 w-16 text-base",
}

export function UserAvatar({ user, size = "sm", className }: UserAvatarProps) {
  const label = user.name || user.initials || "User"
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-on-surface font-mono font-bold text-surface shadow-sm",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{user.initials || "OS"}</span>
      )}
    </span>
  )
}
