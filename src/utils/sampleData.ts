
// Get sample tasks for the calendar
export const getSampleTasks = () => {
  return [
    {
      id: "1",
      title: "Create Facebook ad for new product launch",
      dueDate: "2023-07-15",
      completed: false,
      type: "facebook",
    },
    {
      id: "2",
      title: "Post weekly Instagram update",
      dueDate: "2023-07-12",
      completed: true,
      type: "instagram",
    },
    {
      id: "3",
      title: "Record TikTok product demo",
      dueDate: "2023-07-14",
      completed: false,
      type: "tiktok",
    },
    {
      id: "4",
      title: "Review marketing analytics",
      dueDate: "2023-07-13",
      completed: false,
      type: "general",
    },
  ];
};

// Get sample notes for the calendar
export const getSampleNotes = () => {
  return [
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
};

// Get sample marketing tasks (for fallback)
export const getSampleMarketingTasks = () => {
  return [
    {
      id: "1",
      title: "Create Facebook ad for new product launch",
      dueDate: "2023-07-15",
      completed: false,
      type: "facebook",
    },
    {
      id: "2",
      title: "Post weekly Instagram update",
      dueDate: "2023-07-12",
      completed: true,
      type: "instagram",
    },
    {
      id: "3",
      title: "Record TikTok product demo",
      dueDate: "2023-07-14",
      completed: false,
      type: "tiktok",
    },
    {
      id: "4",
      title: "Review marketing analytics",
      dueDate: "2023-07-13",
      completed: false,
      type: "general",
    },
  ];
};
