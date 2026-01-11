import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import html2pdf from "html2pdf.js";

const PAYMENT_STATUS_OPTIONS = [
  { value: "deposit", label: "Deposit", description: "Bayaran Deposit" },
  { value: "fullpayment", label: "Full Payment", description: "Bayaran Penuh" },
  { value: "cod", label: "COD (+RM20)", description: "Cash On Delivery (+RM20)" },
];

export function CustomerInvoice() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>("fullpayment");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    setCustomerId(id);
    
    if (id) {
      fetchCustomerDetails(id);
    } else {
      setIsLoading(false);
    }
  }, [location.search]);
  
  const fetchCustomerDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setCustomer(data);
      // Set initial payment status from customer data if exists
      if (data?.order_status) {
        // Map order_status to payment_status if needed
        setPaymentStatus(data.order_status === 'completed' ? 'fullpayment' : 'deposit');
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast({
        title: "Error",
        description: "Could not load customer details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentStatusChange = async (value: string) => {
    setPaymentStatus(value);
    
    // Reset deposit amount when changing status
    if (value !== "deposit") {
      setDepositAmount(0);
    }
    
    // Only save immediately for non-deposit options
    if (value !== "deposit") {
      await savePaymentStatus(value, 0);
    }
  };

  const handleDepositAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    setDepositAmount(value);
  };

  const saveDepositAmount = async () => {
    await savePaymentStatus("deposit", depositAmount);
  };

  const savePaymentStatus = async (status: string, deposit: number) => {
    setIsSaving(true);
    
    try {
      let newPaidAmount = customer.sales_amount || 0;
      
      if (status === "deposit") {
        newPaidAmount = deposit;
      } else if (status === "cod") {
        newPaidAmount = (customer.sales_amount || 0) + 20;
      }
      
      const { error } = await supabase
        .from('customers')
        .update({ 
          order_status: status === 'fullpayment' ? 'completed' : 'processing',
          paid_amount: newPaidAmount
        })
        .eq('id', customerId);
        
      if (error) throw error;
      
      setCustomer((prev: any) => ({
        ...prev,
        paid_amount: newPaidAmount
      }));
      
      toast({
        title: "Status Updated",
        description: `Payment status updated to ${PAYMENT_STATUS_OPTIONS.find(o => o.value === status)?.label}`,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPaymentStatusLabel = () => {
    const option = PAYMENT_STATUS_OPTIONS.find(o => o.value === paymentStatus);
    return option?.description || "Bayaran Penuh";
  };

  // Use paid_amount as the main amount (locked from customer creation)
  const getCustomerPaidAmount = () => {
    return customer?.paid_amount || 0;
  };

  const calculateTotal = () => {
    const baseAmount = getCustomerPaidAmount();
    if (paymentStatus === "cod") {
      return baseAmount + 20;
    }
    return baseAmount;
  };

  const calculateRemainingBalance = () => {
    const total = getCustomerPaidAmount();
    if (paymentStatus === "deposit") {
      return total - depositAmount;
    }
    return 0;
  };
  
  const generatePDF = () => {
    const invoiceElement = document.getElementById('customer-invoice');
    if (!invoiceElement) return;
    
    const options = {
      margin: 10,
      filename: `ACS-Invoice-${customer?.name.replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    toast({
      title: "Generating invoice...",
      description: "Please wait while we prepare your PDF",
    });
    
    html2pdf().from(invoiceElement).set(options).save()
      .then(() => {
        toast({
          title: "Success",
          description: "Invoice has been generated and downloaded",
        });
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        toast({
          title: "Error",
          description: "Failed to generate invoice",
          variant: "destructive",
        });
      });
  };
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Customer Invoice</h1>
      </div>
      
      {isLoading ? (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-pulse text-center">
                <p>Loading invoice...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !customer ? (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p>No customer selected. Please select a customer to view their invoice.</p>
              <Button 
                onClick={() => navigate('/customers')}
                variant="secondary" 
                className="mt-4"
              >
                Go to Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Payment Status Selector */}
          <Card className="w-full mb-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-status">Status Pembayaran</Label>
                  <Select 
                    value={paymentStatus} 
                    onValueChange={handlePaymentStatusChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="payment-status" className="w-full">
                      <SelectValue placeholder="Pilih status pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deposit Amount Input */}
                {paymentStatus === "deposit" && (
                  <div className="space-y-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Label htmlFor="deposit-amount">Jumlah Deposit (RM)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="deposit-amount"
                        type="number"
                        value={depositAmount || ""}
                        onChange={handleDepositAmountChange}
                        placeholder="Masukkan jumlah deposit"
                        className="flex-1"
                      />
                      <Button 
                        onClick={saveDepositAmount}
                        disabled={isSaving || depositAmount <= 0}
                      >
                        {isSaving ? "Saving..." : "Simpan"}
                      </Button>
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">Jumlah Penuh: <span className="font-semibold">{formatCurrency(calculateTotal())}</span></p>
                      <p className="text-gray-600">Deposit: <span className="font-semibold text-green-600">{formatCurrency(depositAmount)}</span></p>
                      <p className="text-gray-600">Baki: <span className="font-semibold text-red-600">{formatCurrency(calculateRemainingBalance())}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full mb-4">
            <CardContent className="p-0">
              <div 
                id="customer-invoice" 
                className="p-6 relative bg-white"
              >
                <div className="flex items-center justify-between mb-8 border-b pb-4">
                  <div className="flex items-center">
                    <img
                      src="/lovable-uploads/2a080884-e251-46d5-a2c1-c5d1018f76f5.png"
                      alt="ACS Logo"
                      className="h-16 w-auto"
                    />
                    <div className="ml-4">
                      <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                      <p className="text-gray-500">ACS Legacy</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Invoice #{customer.id.substring(0, 8)}</p>
                    <p className="text-gray-500">{formatDate(new Date().toISOString())}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-bold mb-2 text-gray-900">Bill To:</h3>
                    <p className="text-gray-700"><strong>Name:</strong> {customer.name}</p>
                    {customer.phone && <p className="text-gray-700"><strong>Phone:</strong> {customer.phone}</p>}
                    {customer.email && <p className="text-gray-700"><strong>Email:</strong> {customer.email}</p>}
                    {customer.address && <p className="text-gray-700"><strong>Address:</strong> {customer.address}</p>}
                    {customer.city && <p className="text-gray-700"><strong>City/State:</strong> {customer.city}</p>}
                    {customer.car_model && <p className="text-gray-700"><strong>Car Model:</strong> {customer.car_model}</p>}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold mb-2 text-gray-900">Order Details:</h3>
                    <p className="text-gray-700">Order Date: {formatDate(customer.order_date || customer.created_at)}</p>
                    <p className="text-gray-700">Order Time: {customer.order_time || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-800 text-white">
                        <tr>
                          <th className="p-3 text-left">Description</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Amount (RM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3 text-gray-700">
                            <div className="font-medium">{customer.product || "Product"}</div>
                            {customer.product_variation && (
                              <div className="text-sm text-gray-500">Variation: {customer.product_variation}</div>
                            )}
                          </td>
                          <td className="p-3 text-center text-gray-700">1</td>
                          <td className="p-3 text-right text-gray-700">
                            {formatCurrency(getCustomerPaidAmount())}
                          </td>
                        </tr>
                        {paymentStatus === "cod" && (
                          <tr className="border-t bg-yellow-50">
                            <td className="p-3 text-gray-700">
                              <div className="font-medium">COD Charge</div>
                              <div className="text-sm text-gray-500">Cash On Delivery Fee</div>
                            </td>
                            <td className="p-3 text-center text-gray-700">1</td>
                            <td className="p-3 text-right text-gray-700">RM20.00</td>
                          </tr>
                        )}
                        <tr className="border-t bg-gray-100">
                          <td colSpan={2} className="p-3 font-bold text-gray-900">Subtotal</td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            {formatCurrency(getCustomerPaidAmount())}
                          </td>
                        </tr>
                        {paymentStatus === "cod" && (
                          <tr className="border-t bg-gray-100">
                            <td colSpan={2} className="p-3 font-bold text-gray-900">Jumlah + COD</td>
                            <td className="p-3 text-right font-bold text-gray-900">
                              {formatCurrency(calculateTotal())}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-bold mb-2 text-gray-900">Payment Status:</h3>
                    <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                      paymentStatus === 'fullpayment' 
                        ? 'bg-green-100 text-green-800'
                        : paymentStatus === 'deposit'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getPaymentStatusLabel()}
                    </div>
                    
                    {/* Show deposit details */}
                    {paymentStatus === "deposit" && depositAmount > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-gray-700">Deposit Dibayar: <span className="font-bold text-green-700">{formatCurrency(depositAmount)}</span></p>
                        <p className="text-sm text-gray-700">Baki Tertunggak: <span className="font-bold text-red-700">{formatCurrency(calculateRemainingBalance())}</span></p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold mb-2 text-gray-900">Total Amount:</h3>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(calculateTotal())}</p>
                    
                    {/* Show paid amount for deposit */}
                    {paymentStatus === "deposit" && depositAmount > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Telah Dibayar: {formatCurrency(depositAmount)}</p>
                        <p className="text-lg font-bold text-red-600">Baki: {formatCurrency(calculateRemainingBalance())}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-12 border-t pt-4">
                  <p className="text-center text-gray-500 text-sm">
                    Thank you for your business!<br />
                    ACS Legacy - Quality Products & Services<br />
                    <span className="text-xs">This is a computer-generated invoice.</span>
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={generatePDF}>
                <Download className="mr-2 h-4 w-4" /> Download Invoice
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}