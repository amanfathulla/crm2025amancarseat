import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Customer } from "@/types/customer"
import { formatDate, formatCurrency } from "@/lib/utils"

interface CustomerDetailsProps {
  customer: Customer
  onEdit: () => void
  onDelete: () => void
  index: number
  isSelected?: boolean
  onSelect?: (customerId: string) => void
}

export function CustomerDetails({
  customer,
  onEdit,
  onDelete,
  index,
  isSelected = false,
  onSelect,
}: CustomerDetailsProps) {
  return (
    <AccordionItem value={`item-${index}`} className="border-b">
      <div className="flex items-center gap-4">
        {onSelect && (
          <div className="pl-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(customer.id)}
              aria-label={`Select ${customer.name}`}
            />
          </div>
        )}
        <AccordionTrigger className="hover:no-underline hover:bg-accent/50 px-4 py-2 [&[data-state=open]]:bg-accent/50 flex-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <span className="w-8 text-right">{index}.</span>
              <div className="flex flex-col">
                <span className="font-medium">{customer.name}</span>
                <span className="text-sm text-muted-foreground">{customer.email}</span>
              </div>
              {customer.order_status && (
                <Badge
                  variant={
                    customer.order_status === "processing"
                      ? "secondary"
                      : customer.order_status === "completed"
                      ? "default"
                      : "destructive"
                  }
                >
                  {customer.order_status}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </AccordionTrigger>
      </div>
      <AccordionContent className="px-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Customer Information</h4>
            <p>
              <strong>Phone:</strong> {customer.phone}
            </p>
            <p>
              <strong>Location:</strong> {customer.location}
            </p>
            <p>
              <strong>Car Model:</strong> {customer.car_model}
            </p>
            <p>
              <strong>Product:</strong> {customer.product}
            </p>
            <p>
              <strong>Product Variation:</strong> {customer.product_variation}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Order Details</h4>
            <p>
              <strong>Sales Amount:</strong> {formatCurrency(customer.sales_amount)}
            </p>
            <p>
              <strong>Gross Profit:</strong> {formatCurrency(customer.gross_profit)}
            </p>
            <p>
              <strong>Paid Amount:</strong> {formatCurrency(customer.paid_amount)}
            </p>
            <p>
              <strong>Order Date:</strong> {formatDate(customer.order_date)}
            </p>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
