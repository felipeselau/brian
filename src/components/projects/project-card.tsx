"use client";

import Link from "next/link";
import { Project, ProjectStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Users, ListTodo, Archive } from "lucide-react";

interface ProjectWithCounts extends Project {
  _count: {
    tickets: number;
    members: number;
  };
}

interface ProjectCardProps {
  project: ProjectWithCounts;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-500",
  ARCHIVED: "bg-gray-500",
};

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export function ProjectCard({
  project,
  isOwner,
  onEdit,
  onDelete,
  onArchive,
}: ProjectCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <Link href={`/projects/${project.id}`}>
            <CardTitle className="text-xl hover:underline cursor-pointer">
              {project.title}
            </CardTitle>
          </Link>
          <Badge className={`${statusColors[project.status]} mt-2`} variant="default">
            {statusLabels[project.status]}
          </Badge>
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              )}
              {onArchive && project.status !== "ARCHIVED" && (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ListTodo className="h-4 w-4" />
            <span>{project._count.tickets} tickets</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project._count.members} members</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
