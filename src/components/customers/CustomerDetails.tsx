import { Button } from "@/components/ui/button";
import { Customer } from "@/types/customer";
import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/utils";
import { FileText, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CustomerDetailsProps {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  className?: string; 
}

const getTimePeriod = (timeString: string) => {
  const time = new Date(`2000-01-01T${timeString}`);
  const hours = time.getHours();
  
  if (hours >= 6 && hours < 12) return "Pagi";
  if (hours >= 12 && hours < 18) return "Petang";
  if (hours >= 18 && hours < 24) return "Malam";
  return "Lewat Malam";
};

export function CustomerDetails({ customer, onEdit, onDelete, index, className }: CustomerDetailsProps) {
  const navigate = useNavigate();
  
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
  
  const handleGenerateReceipt = () => {
    navigate(`/customers/receipt?id=${customer.id}`);
  };

  const handleGenerateInvoice = () => {
    navigate(`/customers/invoice?id=${customer.id}`);
  };

  return (
    <AccordionItem value={customer.id} className={`border-b ${className || ''}`}>
      <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4">
        <div className="flex items-center justify-between w-full text-base font-medium">
          <span className="flex items-center">
            <span className="inline-block w-8 text-right mr-3 text-muted-foreground">{index}.</span>
            {customer.name}
          </span>
          
          <div className="flex gap-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateReceipt();
              }}
              title="Generate Receipt"
            >
              <Receipt className="h-4 w-4 mr-1" /> Resit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateInvoice();
              }}
              title="Generate Invoice"
            >
              <FileText className="h-4 w-4 mr-1" /> Invoice
            </Button>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-4 py-2 grid gap-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="font-medium mb-1">Contact Information</div>
              <div>Nama: {customer.name || 'N/A'}</div>
              <div>Email: {customer.email || 'N/A'}</div>
              <div>Phone: {customer.phone || 'N/A'}</div>
              <div>Lokasi: {customer.location || 'N/A'}</div>
              {customer.address && <div>Alamat Lengkap: {customer.address}</div>}
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
              {customer.order_time && (
                <div className="flex items-center gap-1">
                  Masa Tempahan: 
                  <Badge variant="secondary" className="ml-1">
                    {customer.order_time} ({getTimePeriod(customer.order_time)})
                  </Badge>
                </div>
              )}
              <div className="mt-1">Status: {getStatusBadge(customer.order_status || 'processing')}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-2 p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium mb-1 text-muted-foreground">Sales Amount</div>
              <div className="text-lg font-semibold">{formatCurrency(customer.sales_amount)}</div>
            </div>
            <div>
              <div className="font-medium mb-1 text-muted-foreground">Jumlah Dibayar</div>
              <div className="text-lg font-semibold text-green-600">{formatCurrency(customer.paid_amount)}</div>
            </div>
            <div>
              <div className="font-medium mb-1 text-muted-foreground">Gross Profit</div>
              <div className={`text-lg font-semibold ${customer.gross_profit < 0 ? 'text-destructive' : ''}`}>
                {formatCurrency(customer.gross_profit)}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit Status
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
