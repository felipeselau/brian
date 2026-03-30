"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Loader2,
  ListChecks,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  content: string;
  completed: boolean;
  position: number;
  createdAt: string;
}

interface Checklist {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  items: ChecklistItem[];
}

interface ChecklistSectionProps {
  projectId: string;
  ticketId: string;
  checklists: Checklist[];
  canEdit: boolean;
}

export function ChecklistSection({
  projectId,
  ticketId,
  checklists: initialChecklists,
  canEdit,
}: ChecklistSectionProps) {
  const router = useRouter();
  const [checklists, setChecklists] = useState(initialChecklists);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalItems = checklists.reduce((sum, cl) => sum + cl.items.length, 0);
  const completedItems = checklists.reduce(
    (sum, cl) => sum + cl.items.filter((i) => i.completed).length,
    0
  );

  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;

    setIsCreatingChecklist(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/checklists`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newChecklistTitle }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checklist");
      }

      const { checklist } = await response.json();
      setChecklists([...checklists, checklist]);
      setNewChecklistTitle("");
      setIsDialogOpen(false);
      toast.success("Checklist created");
    } catch (error) {
      console.error("Error creating checklist:", error);
      toast.error("Failed to create checklist");
    } finally {
      setIsCreatingChecklist(false);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (!confirm("Delete this checklist?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/checklists/${checklistId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete checklist");
      }

      setChecklists(checklists.filter((cl) => cl.id !== checklistId));
      toast.success("Checklist deleted");
    } catch (error) {
      console.error("Error deleting checklist:", error);
      toast.error("Failed to delete checklist");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Checklists
          {totalItems > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({completedItems}/{totalItems})
            </span>
          )}
        </h3>

        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Checklist</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateChecklist();
                }}
              >
                <Input
                  placeholder="Checklist title..."
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  autoFocus
                />
                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isCreatingChecklist || !newChecklistTitle.trim()}
                  >
                    {isCreatingChecklist && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {totalItems > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%`,
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        {checklists.map((checklist) => (
          <ChecklistGroup
            key={checklist.id}
            checklist={checklist}
            projectId={projectId}
            ticketId={ticketId}
            canEdit={canEdit}
            onDelete={handleDeleteChecklist}
            onUpdate={(updated) =>
              setChecklists(
                checklists.map((cl) => (cl.id === updated.id ? updated : cl))
              )
            }
          />
        ))}

        {checklists.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No checklists yet.
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistGroup({
  checklist,
  projectId,
  ticketId,
  canEdit,
  onDelete,
  onUpdate,
}: {
  checklist: Checklist;
  projectId: string;
  ticketId: string;
  canEdit: boolean;
  onDelete: (id: string) => void;
  onUpdate: (checklist: Checklist) => void;
}) {
  const [newItemContent, setNewItemContent] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const completedCount = checklist.items.filter((i) => i.completed).length;
  const totalCount = checklist.items.length;

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return;

    setIsAddingItem(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/checklists/${checklist.id}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newItemContent }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add item");
      }

      const { item } = await response.json();
      onUpdate({ ...checklist, items: [...checklist.items, item] });
      setNewItemContent("");
      toast.success("Item added");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: { content?: string; completed?: boolean }
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/checklists/${checklist.id}/items`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, ...updates }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item");
      }

      const { item } = await response.json();
      onUpdate({
        ...checklist,
        items: checklist.items.map((i) => (i.id === itemId ? { ...i, ...item } : i)),
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tickets/${ticketId}/checklists/${checklist.id}/items?itemId=${itemId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      onUpdate({
        ...checklist,
        items: checklist.items.filter((i) => i.id !== itemId),
      });
      toast.success("Item deleted");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{checklist.title}</span>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(checklist.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {totalCount > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>
      )}

      <div className="space-y-1">
        {checklist.items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            canEdit={canEdit}
            onToggle={(completed) => handleUpdateItem(item.id, { completed })}
            onEdit={(content) => handleUpdateItem(item.id, { content })}
            onDelete={() => handleDeleteItem(item.id)}
          />
        ))}
      </div>

      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddItem();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Add an item..."
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            disabled={isAddingItem || !newItemContent.trim()}
          >
            {isAddingItem ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

function ChecklistItemRow({
  item,
  canEdit,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ChecklistItem;
  canEdit: boolean;
  onToggle: (completed: boolean) => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);

  const handleSave = () => {
    if (editContent.trim() && editContent !== item.content) {
      onEdit(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditContent(item.content);
      setIsEditing(false);
    }
  };

  return (
    <div className="group flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50 transition-colors">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={(e) => canEdit && onToggle(e.target.checked)}
        disabled={!canEdit}
        className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
      />

      {isEditing ? (
        <input
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 text-sm bg-transparent border-b border-primary outline-none px-1"
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-pointer ${
            item.completed ? "line-through text-muted-foreground" : ""
          }`}
          onClick={() => {
            if (canEdit) {
              setEditContent(item.content);
              setIsEditing(true);
            }
          }}
        >
          {item.content}
        </span>
      )}

      {canEdit && !isEditing && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
