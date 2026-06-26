import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUnreadDelegationsCount, useDelegationsRealtime } from "@/hooks/use-delegations";

export default function NotificationBell({
  compact = false,
  label,
  onClick,
}: {
  compact?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  useDelegationsRealtime();
  const { data: count = 0 } = useUnreadDelegationsCount();

  if (label) {
    return (
      <Link
        to="/caixa-de-entrada"
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
      >
        <Inbox className="w-4 h-4" />
        <span>{label}</span>
        {count > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    );
  }

  const tip = count > 0 ? `Caixa de entrada — ${count} não lida(s)` : "Caixa de entrada";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/caixa-de-entrada"
          aria-label={label}
          className={`relative inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
            compact ? "p-1.5" : "p-2"
          }`}
        >
          <Inbox className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
