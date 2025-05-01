
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/sonner";
import { FileText, Facebook, Instagram } from "lucide-react";
import {
  MarketingContent,
  MarketingContentType,
  createMarketingNote,
  getMarketingNotes,
} from "@/utils/marketingUtils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

const platformOptions = [
  {
    id: "facebook",
    label: "Facebook",
    icon: <Facebook className="h-4 w-4 mr-2" />,
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4 mr-2" />,
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: <FileText className="h-4 w-4 mr-2" />,
  }
];

const formSchema = z.object({
  title: z.string().optional(),
  description: z.string().min(1, "Note content is required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  content_date: z.string().min(1, "Date is required")
});

export default function MarketingNotes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<MarketingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      platforms: [],
      content_date: format(new Date(), "yyyy-MM-dd")
    },
  });

  // Fetch marketing notes
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        // Get the date range for the next 3 months
        const today = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(today.getMonth() + 3);
        
        const startDate = today.toISOString().split("T")[0];
        const endDate = threeMonthsLater.toISOString().split("T")[0];
        
        const data = await getMarketingNotes(startDate, endDate);
        setNotes(data);
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast({
          title: "Error",
          description: "Failed to load marketing notes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
    
    // Set up subscription for real-time updates
    const subscription = supabase
      .channel("public:marketing_content")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_content" }, fetchNotes)
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [toast]);

  // Group notes by month
  const groupedNotes = notes.reduce<Record<string, MarketingContent[]>>((acc, note) => {
    const dateObj = new Date(note.content_date);
    const monthYear = `${dateObj.toLocaleString("ms-MY", { month: "long" })} ${dateObj.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(note);
    return acc;
  }, {});

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Create a description with platform information
      const platformsText = values.platforms
        .map(p => platformOptions.find(o => o.id === p)?.label)
        .filter(Boolean)
        .join(", ");
        
      // Create the new note
      const newNote = {
        title: values.title || "Marketing Note",
        description: `${values.description}\n\nPlatforms: ${platformsText}`,
        type: "task" as MarketingContentType,
        content_date: values.content_date,
        status: "pending"
      };
      
      const result = await createMarketingNote(newNote);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to create note");
      }
      
      // Reset form
      form.reset({
        title: "",
        description: "",
        platforms: [],
        content_date: format(new Date(), "yyyy-MM-dd")
      });
      
      toast({
        title: "Success",
        description: "Marketing note created successfully",
      });
    } catch (error: any) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create marketing note",
        variant: "destructive", 
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nota Marketing</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your marketing notes across different platforms
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Create Notes Form */}
          <Card className="md:col-span-5">
            <CardHeader>
              <CardTitle>Create New Note</CardTitle>
              <CardDescription>
                Add a new marketing task for your social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief title for your note" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., Ulang siar video review customer minggu ni" 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="platforms"
                    render={() => (
                      <FormItem>
                        <FormLabel>Platforms</FormLabel>
                        <div className="space-y-2">
                          {platformOptions.map((platform) => (
                            <FormField
                              key={platform.id}
                              control={form.control}
                              name="platforms"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={platform.id}
                                    className="flex flex-row items-center space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(platform.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, platform.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== platform.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <div className="flex items-center space-x-2">
                                      {platform.icon}
                                      {platform.label}
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Create Note
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Notes List */}
          <div className="md:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle>Your Marketing Notes</CardTitle>
                <CardDescription>
                  View and manage your upcoming marketing tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-5 w-40 bg-muted rounded-md mb-2"></div>
                        <div className="h-20 bg-muted rounded-md"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedNotes).length > 0 ? (
                      Object.entries(groupedNotes).map(([month, monthNotes]) => (
                        <div key={month} className="space-y-3">
                          <div className="sticky top-0 bg-background z-10 py-2">
                            <h3 className="font-medium text-base">{month}</h3>
                            <Separator className="mt-1" />
                          </div>
                          
                          {monthNotes.map((note) => {
                            const dateObj = new Date(note.content_date);
                            const formattedDate = formatDate(note.content_date);
                            
                            return (
                              <Card key={note.id} className="overflow-hidden">
                                <div className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold">{note.title}</h4>
                                      <p className="text-muted-foreground text-sm mt-1">{formattedDate}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                                      {note.type}
                                    </Badge>
                                  </div>
                                  
                                  <p className="mt-2 whitespace-pre-wrap">{note.description}</p>
                                  
                                  <div className="flex justify-between items-center mt-3">
                                    <div className="flex gap-1.5">
                                      {note.description?.includes("Facebook") && (
                                        <Badge variant="secondary" size="sm" className="bg-blue-100 text-blue-700 border-blue-200">
                                          <Facebook className="h-3 w-3 mr-1" />
                                          Facebook
                                        </Badge>
                                      )}
                                      {note.description?.includes("Instagram") && (
                                        <Badge variant="secondary" size="sm" className="bg-pink-100 text-pink-700 border-pink-200">
                                          <Instagram className="h-3 w-3 mr-1" />
                                          Instagram
                                        </Badge>
                                      )}
                                      {note.description?.includes("TikTok") && (
                                        <Badge variant="secondary" size="sm" className="bg-slate-100 text-slate-700 border-slate-200">
                                          <FileText className="h-3 w-3 mr-1" />
                                          TikTok
                                        </Badge>
                                      )}
                                    </div>
                                    <Badge variant={note.status === "completed" ? "default" : "outline"}>
                                      {note.status}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-3 text-lg font-medium">No marketing notes</h3>
                        <p className="text-muted-foreground">Create your first marketing note to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
