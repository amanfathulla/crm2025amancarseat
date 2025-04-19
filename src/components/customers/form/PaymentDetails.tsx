
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PaymentDetailsProps {
  productVariation: string;
  salesAmount: number;
  grossProfit: number;
  paidAmount: number;
  orderTime?: string;
  onPaidAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getTimePeriod: (timeString: string) => string;
}

export function PaymentDetails({
  productVariation,
  salesAmount,
  grossProfit,
  paidAmount,
  orderTime,
  onPaidAmountChange,
  getTimePeriod,
}: PaymentDetailsProps) {
  if (!productVariation) return null;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="paid_amount">Jumlah Dibayar Pelanggan</Label>
        <div className="relative">
          <span className="absolute left-3 top-2.5">RM</span>
          <Input
            id="paid_amount"
            type="number"
            step="0.01"
            min="0"
            value={paidAmount}
            onChange={onPaidAmountChange}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-md">
        <div className="text-sm font-medium mb-2">Order Summary</div>
        <div className="flex justify-between mb-1">
          <span>Selected Variation:</span>
          <span>{productVariation}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Sales Amount:</span>
          <span>RM {salesAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Gross Profit:</span>
          <span className={grossProfit < 0 ? 'text-destructive' : ''}>
            RM {grossProfit.toFixed(2)}
          </span>
        </div>
        
        {orderTime && (
          <div className="flex justify-between mt-2 pt-2 border-t border-muted-foreground/20">
            <span>Masa Tempahan:</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {orderTime} 
                {` (${getTimePeriod(orderTime)})`}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
