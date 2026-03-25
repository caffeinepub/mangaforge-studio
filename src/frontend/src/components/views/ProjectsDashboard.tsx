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
            {projects.map((proj, idx) => (
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
                    <div
                      className="w-8 h-8 rounded mb-2 flex items-center justify-center"
                      style={{ background: "oklch(var(--red-brand) / 0.15)" }}
                    >
                      <FolderOpen
                        className="w-4 h-4"
                        style={{ color: "oklch(var(--red-brand))" }}
                      />
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
                  <CardContent className="pt-0">
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
            ))}
          </div>
        )}
      </div>
      {showNew && <NewProjectModal open onClose={() => setShowNew(false)} />}
    </div>
  );
}
