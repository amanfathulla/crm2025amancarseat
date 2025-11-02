
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

// Import sidebar components
import { SidebarItem } from "./sidebar/SidebarItem";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { MarketingNotesSection } from "./sidebar/MarketingNotesSection";
import { MobileToggle } from "./sidebar/MobileToggle";
import { useSidebarItems } from "./sidebar/useSidebarItems";

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [orderCounts, setOrderCounts] = useState({
    processing: 0,
    completed: 0,
    cancelled: 0
  });
  
  const [showMarketingNotes, setShowMarketingNotes] = useState(false);
  
  useEffect(() => {
    // Set the initial sidebar state based on screen size
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        const { data: processingData, error: processingError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'processing');
        
        const { data: completedData, error: completedError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'completed');
        
        const { data: cancelledData, error: cancelledError } = await supabase
          .from('customers')
          .select('id')
          .eq('order_status', 'cancelled');
        
        if (processingError || completedError || cancelledError) {
          console.error("Error fetching order counts", processingError || completedError || cancelledError);
          return;
        }
        
        setOrderCounts({
          processing: processingData?.length || 0,
          completed: completedData?.length || 0,
          cancelled: cancelledData?.length || 0
        });
      } catch (error) {
        console.error("Error fetching order counts:", error);
      }
    };
    
    fetchOrderCounts();
    
    const subscription = supabase
      .channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchOrderCounts();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setExpanded(!expanded);
    }
  };

  const sidebarItems = useSidebarItems(orderCounts);
  
  const sidebarVisible = isMobile ? mobileOpen : true;
  const sidebarWidth = expanded && !isMobile ? "w-64" : "w-16";

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col",
          "border-r shadow-sm transition-all duration-300 ease-in-out",
          "bg-black text-white",
          sidebarWidth,
          isMobile && "transition-transform",
          isMobile && !mobileOpen && "-translate-x-full",
          isMobile && mobileOpen && "w-64 translate-x-0"
        )}
      >
        <SidebarHeader 
          expanded={expanded}
          isMobile={isMobile}
          toggleSidebar={toggleSidebar}
        />
        
        <nav className="flex flex-col gap-2 px-2 py-3 flex-1 overflow-y-auto">
          {/* Main navigation items */}
          {sidebarItems.map((item) => (
            <SidebarItem 
              key={item.path} 
              item={item} 
              expanded={expanded} 
              isMobile={isMobile}
              onClick={() => isMobile && setMobileOpen(false)}
            />
          ))}
          
          <MarketingNotesSection
            expanded={expanded}
            isMobile={isMobile}
            showMarketingNotes={showMarketingNotes}
            setShowMarketingNotes={setShowMarketingNotes}
          />
        </nav>
        
        <SidebarFooter expanded={expanded} isMobile={isMobile} />
      </aside>
      
      {isMobile && !mobileOpen && (
        <MobileToggle toggleSidebar={toggleSidebar} />
      )}
    </>
  );
}
