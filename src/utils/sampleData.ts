
// Get sample tasks for the calendar
export const getSampleTasks = () => {
  return [
    {
      id: "1",
      title: "Create Facebook ad for new product launch",
      dueDate: "2023-07-15",
      completed: false,
      type: "facebook" as const,
    },
    {
      id: "2",
      title: "Post weekly Instagram update",
      dueDate: "2023-07-12",
      completed: true,
      type: "instagram" as const,
    },
    {
      id: "3",
      title: "Record TikTok product demo",
      dueDate: "2023-07-14",
      completed: false,
      type: "tiktok" as const,
    },
    {
      id: "4",
      title: "Review marketing analytics",
      dueDate: "2023-07-13",
      completed: false,
      type: "general" as const,
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
      type: "facebook" as const,
    },
    {
      id: "2",
      title: "Post weekly Instagram update",
      dueDate: "2023-07-12",
      completed: true,
      type: "instagram" as const,
    },
    {
      id: "3",
      title: "Record TikTok product demo",
      dueDate: "2023-07-14",
      completed: false,
      type: "tiktok" as const,
    },
    {
      id: "4",
      title: "Review marketing analytics",
      dueDate: "2023-07-13",
      completed: false,
      type: "general" as const,
    },
  ];
};

// Sample sales data
export const getSampleRevenueData = () => {
  return {
    currentYear: {
      year: 2024,
      total: 59084.00,
      monthly: [4920, 5100, 4890, 5320, 5680, 4920, 4800, 5740, 5220, 4310, 4070, 4114],
    },
    previousYear: {
      year: 2023,
      total: 48750.00,
      monthly: [3800, 4200, 3950, 4100, 4300, 4150, 3900, 4250, 4100, 3900, 4000, 4100],
    },
    today: {
      revenue: 0.00,
      orders: 0,
      products: 0,
      profit: 0.00
    },
    yesterday: {
      revenue: 0.00,
      orders: 0,
      products: 0,
      profit: 0.00
    },
    thisMonth: {
      revenue: 4114.00,
      orders: 42,
      products: 68,
      profit: 1845.30
    },
    orders: {
      today: 0,
      thisMonth: 42,
      processing: 12,
      completed: 24,
      cancelled: 6
    },
    products: {
      soldToday: 0,
      soldThisMonth: 68,
      totalInventory: 294
    },
    grossProfit: {
      today: 0.00,
      thisMonth: 1845.30,
      thisYear: 27040.50
    }
  };
};

// Sample daily revenue data
export const getSampleDailyRevenueData = (month = 6, year = 2024) => {
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => ({
    date: `${i + 1}/${month}/${year}`,
    revenue: Math.floor(Math.random() * 300),
    profit: Math.floor(Math.random() * 150),
  }));
};
