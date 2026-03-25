import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, FolderOpen, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useGetAllProjects } from "../../hooks/useQueries";
import NewProjectModal from "../modals/NewProjectModal";

const TAG_COLORS: Record<string, string> = {
  Action: "oklch(0.5 0.2 28)",
  Romance: "oklch(0.5 0.18 355)",
  Fantasy: "oklch(0.45 0.15 290)",
  "Sci-Fi": "oklch(0.45 0.15 210)",
  Horror: "oklch(0.35 0.12 22)",
  Comedy: "oklch(0.55 0.18 85)",
  Drama: "oklch(0.45 0.10 250)",
  Mystery: "oklch(0.4 0.12 270)",
  Adventure: "oklch(0.5 0.18 150)",
  "Slice-of-Life": "oklch(0.5 0.14 180)",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: "Planning", color: "oklch(0.5 0.05 250)" },
  in_progress: { label: "In Progress", color: "oklch(0.5 0.15 220)" },
  complete: { label: "Complete", color: "oklch(0.5 0.15 145)" },
};

function getProjectTags(id: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`tags_project_${id}`) ?? "[]");
  } catch {
    return [];
  }
}

function getProjectStatus(id: string): string {
  return localStorage.getItem(`status_project_${id}`) ?? "planning";
}

export default function ProjectsDashboard() {
  const { data: projects = [], isLoading } = useGetAllProjects();
  const { navigateTo } = useAppContext();
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Your Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Each project is a manga universe
            </p>
          </div>
          <Button
            data-ocid="dashboard.new_project.button"
            onClick={() => setShowNew(true)}
            style={{ background: "oklch(var(--blue-action))", color: "white" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-3 gap-4">
            {["sk-1", "sk-2", "sk-3"].map((k) => (
              <div
                key={k}
                className="h-40 bg-card rounded-lg border border-border animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
            data-ocid="dashboard.empty_state"
          >
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first manga project to get started
            </p>
            <Button
              onClick={() => setShowNew(true)}
              style={{
                background: "oklch(var(--blue-action))",
                color: "white",
              }}
              data-ocid="dashboard.empty_state.new_project.button"
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Project
            </Button>
          </motion.div>
        )}

        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj, idx) => {
              const projTags = getProjectTags(proj.id.toString());
              const projStatus = getProjectStatus(proj.id.toString());
              const statusCfg =
                STATUS_CONFIG[projStatus] ?? STATUS_CONFIG.planning;
              return (
                <motion.div
                  key={proj.id.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  data-ocid={`dashboard.project.item.${idx + 1}`}
                >
                  <Card
                    className="bg-card border-border hover:border-muted-foreground cursor-pointer transition-all hover:shadow-lg group"
                    onClick={() => navigateTo(proj.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div
                          className="w-8 h-8 rounded mb-2 flex items-center justify-center"
                          style={{
                            background: "oklch(var(--red-brand) / 0.15)",
                          }}
                        >
                          <FolderOpen
                            className="w-4 h-4"
                            style={{ color: "oklch(var(--red-brand))" }}
                          />
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: `${statusCfg.color}33`,
                            color: statusCfg.color,
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        {proj.name}
                      </CardTitle>
                      {proj.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {proj.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {projTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {projTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 rounded-full text-white"
                              style={{
                                background:
                                  TAG_COLORS[tag] ?? "oklch(0.45 0.1 250)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(
                            Number(proj.createdAt / BigInt(1000000)),
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      {showNew && <NewProjectModal open onClose={() => setShowNew(false)} />}
    </div>
  );
}
