
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface OrderStatusProps {
  orderStatus: string;
  orderDate: string;
  onSelectChange: (name: string, value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function OrderStatus({
  orderStatus,
  orderDate,
  onSelectChange,
  onChange,
}: OrderStatusProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="order_date">Order Date</Label>
        <Input
          id="order_date"
          name="order_date"
          type="date"
          value={orderDate}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="order_status">Order Status</Label>
        <Select
          value={orderStatus}
          onValueChange={(value) => onSelectChange("order_status", value)}
        >
          <SelectTrigger id="order_status" className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="processing">
              <div className="flex items-center">
                <Badge variant="secondary" className="mr-2">Processing</Badge>
                <span>Order In Process</span>
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center">
                <Badge variant="default" className="mr-2">Completed</Badge>
                <span>Order Completed</span>
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center">
                <Badge variant="destructive" className="mr-2">Cancelled</Badge>
                <span>Order Cancelled</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
