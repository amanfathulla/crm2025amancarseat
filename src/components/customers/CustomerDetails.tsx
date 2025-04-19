import { Button } from "@/components/ui/button";
import { Customer } from "@/types/customer";
import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";

interface CustomerDetailsProps {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

const getTimePeriod = (timeString: string) => {
  const time = new Date(`2000-01-01T${timeString}`);
  const hours = time.getHours();
  
  if (hours >= 6 && hours < 12) return "Pagi";
  if (hours >= 12 && hours < 18) return "Petang";
  if (hours >= 18 && hours < 24) return "Malam";
  return "Lewat Malam";
};

export function CustomerDetails({ customer, onEdit, onDelete, index }: CustomerDetailsProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "processing":
        return <Badge variant="secondary">In Process</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AccordionItem value={customer.id} className="border-b">
      <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4">
        <span className="flex items-center text-base font-medium">
          <span className="inline-block w-8 text-right mr-3 text-muted-foreground">{index}.</span>
          {customer.name}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-4 py-2 grid gap-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="font-medium mb-1">Contact Information</div>
              <div>Email: {customer.email}</div>
              <div>Phone: {customer.phone || 'N/A'}</div>
              <div>Location: {customer.location || 'N/A'}</div>
            </div>
            
            <div>
              <div className="font-medium mb-1">Product Details</div>
              <div>Car Model: {customer.car_model || 'N/A'}</div>
              <div>Product: {customer.product || 'N/A'}</div>
              <div>Variation: {customer.product_variation || 'N/A'}</div>
            </div>
            
            <div>
              <div className="font-medium mb-1">Order Information</div>
              <div>Order Date: {formatDate(customer.order_date)}</div>
              <div>Status: {getStatusBadge(customer.order_status || 'processing')}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <div className="font-medium mb-1">Sales Amount</div>
              <div>{formatCurrency(customer.sales_amount)}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Gross Profit</div>
              <div>{formatCurrency(customer.gross_profit)}</div>
            </div>
            <div>
              <div className="font-medium mb-1">Jumlah Dibayar</div>
              <div>{formatCurrency(customer.paid_amount)}</div>
            </div>
          </div>
          
          {customer.order_time && (
            <div className="mt-2">
              <div className="font-medium mb-1">Masa Tempahan</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {customer.order_time} 
                  {` (${getTimePeriod(customer.order_time)})`}
                </Badge>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit Customer
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
