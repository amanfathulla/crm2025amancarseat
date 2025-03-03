
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NotebookIcon, PlusIcon, XIcon } from "lucide-react";

// Sample data for notes
const sampleNotes = [
  {
    id: 1,
    title: "Q3 Marketing Strategy",
    content: "Focus on product awareness and user acquisition through social media.",
    date: "July 10, 2023",
  },
  {
    id: 2,
    title: "Content Ideas",
    content: "Tutorial videos, customer success stories, product updates.",
    date: "July 8, 2023",
  },
];

export function MarketingNotes() {
  const [notes, setNotes] = useState(sampleNotes);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const addNote = () => {
    if (newNoteTitle.trim() === "") return;
    
    const newNote = {
      id: Date.now(),
      title: newNoteTitle,
      content: newNoteContent,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
    
    setNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setIsAddingNote(false);
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <NotebookIcon className="mr-2 h-5 w-5" />
          Marketing Notes
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddingNote(!isAddingNote)}
        >
          {isAddingNote ? "Cancel" : "Add Note"}
        </Button>
      </CardHeader>
      <CardContent>
        {isAddingNote && (
          <div className="mb-6 space-y-3 p-3 border rounded-md">
            <Input
              placeholder="Note Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
            <Textarea
              placeholder="Note Content"
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
            />
            <Button size="sm" onClick={addNote}>
              <PlusIcon className="h-4 w-4 mr-1" /> Add Note
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border p-3 rounded-md"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-medium">{note.title}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteNote(note.id)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-2">{note.date}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
