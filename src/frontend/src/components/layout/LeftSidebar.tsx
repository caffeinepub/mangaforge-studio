import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import SidebarProjectTree from "./SidebarProjectTree";

export default function LeftSidebar() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  // On mobile, sidebar is shown in the Header's Sheet instead
  if (isMobile) return null;

  if (collapsed) {
    return (
      <aside className="w-10 border-r border-border bg-sidebar flex flex-col items-center pt-3 shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="text-muted-foreground hover:text-foreground p-1"
          data-ocid="sidebar.expand.button"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0">
      <div className="flex items-center justify-end px-3 py-2 border-b border-border">
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <SidebarProjectTree />
      </div>
    </aside>
  );
}
