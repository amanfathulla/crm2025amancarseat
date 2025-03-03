
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ListTodoIcon, FacebookIcon, InstagramIcon, YoutubeIcon, PlusIcon, X as XIcon, PencilIcon, CheckIcon } from "lucide-react";
import { useMarketingTasks } from "@/hooks/useMarketingTasks";
import { MarketingTask } from "@/types/marketing";

export function MarketingTasks() {
  const { 
    tasks, 
    isLoading, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion 
  } = useMarketingTasks();
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskType, setNewTaskType] = useState<MarketingTask["type"]>("general");
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<MarketingTask["type"] | "all">("all");
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskType, setEditTaskType] = useState<MarketingTask["type"]>("general");

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;

    const newTask: Omit<MarketingTask, "id"> = {
      title: newTaskTitle,
      dueDate: newTaskDueDate || new Date().toISOString().split("T")[0],
      completed: false,
      type: newTaskType,
    };

    addTask(newTask);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskType("general");
  };

  const handleToggleTaskCompletion = (id: number, completed: boolean) => {
    toggleTaskCompletion(id, !completed);
  };

  const handleDeleteTask = (id: number) => {
    deleteTask(id);
  };

  const startEditing = (task: MarketingTask) => {
    setEditingTask(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDueDate(task.dueDate);
    setEditTaskType(task.type);
  };

  const saveEdit = () => {
    if (editTaskTitle.trim() === "" || editingTask === null) return;
    
    updateTask(editingTask, {
      title: editTaskTitle,
      dueDate: editTaskDueDate,
      type: editTaskType,
    });
    
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "upcoming") return !task.completed;
    return true;
  }).filter((task) => {
    if (typeFilter === "all") return true;
    return task.type === typeFilter;
  });

  // Get the icon for the task type
  const getTaskTypeIcon = (type: MarketingTask["type"]) => {
    switch (type) {
      case "facebook":
        return <FacebookIcon className="h-4 w-4 text-blue-600" />;
      case "instagram":
        return <InstagramIcon className="h-4 w-4 text-pink-600" />;
      case "tiktok":
        return <YoutubeIcon className="h-4 w-4" />;
      default:
        return <ListTodoIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <ListTodoIcon className="mr-2 h-5 w-5" />
          Marketing Tasks
        </CardTitle>
        <div className="flex space-x-2">
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as "all" | "upcoming" | "completed")}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as MarketingTask["type"] | "all")}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex space-x-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1"
          />
          <Input
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
            className="w-40"
          />
          <Select value={newTaskType} onValueChange={(value) => setNewTaskType(value as MarketingTask["type"])}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddTask}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No tasks match your filters</p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 border rounded-md ${
                  task.completed ? "bg-muted/40" : ""
                }`}
              >
                {editingTask === task.id ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Task title"
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Input
                        type="date"
                        value={editTaskDueDate}
                        onChange={(e) => setEditTaskDueDate(e.target.value)}
                        className="w-full"
                      />
                      <Select value={editTaskType} onValueChange={(value) => setEditTaskType(value as MarketingTask["type"])}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingTask(null)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        <CheckIcon className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleTaskCompletion(task.id, task.completed)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.title}
                          </span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getTaskTypeIcon(task.type)}
                            <span className="text-xs capitalize">{task.type}</span>
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEditing(task)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
