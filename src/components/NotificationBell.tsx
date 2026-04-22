import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useUnreadDelegationsCount, useDelegationsRealtime } from "@/hooks/use-delegations";

export default function NotificationBell({ compact = false }: { compact?: boolean }) {
  useDelegationsRealtime();
  const { data: count = 0 } = useUnreadDelegationsCount();

  return (
    <Link
      to="/caixa-de-entrada"
      title={count > 0 ? `${count} delegação(ões) não lida(s)` : "Caixa de entrada"}
      className={`relative inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
        compact ? "p-1.5" : "p-2"
      }`}
    >
      <Bell className={compact ? "w-4 h-4" : "w-4 h-4"} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
