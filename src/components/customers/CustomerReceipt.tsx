
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";

export function CustomerReceipt() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract customer ID from search params
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
  
  const generatePDF = () => {
    const receiptElement = document.getElementById('customer-receipt');
    if (!receiptElement) return;
    
    const options = {
      margin: 10,
      filename: `ACS-Receipt-${customer?.name.replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    toast({
      title: "Generating receipt...",
      description: "Please wait while we prepare your PDF",
    });
    
    html2pdf().from(receiptElement).set(options).save()
      .then(() => {
        toast({
          title: "Success",
          description: "Receipt has been generated and downloaded",
        });
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        toast({
          title: "Error",
          description: "Failed to generate receipt",
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
        <h1 className="text-2xl font-bold">Customer Receipt</h1>
      </div>
      
      {isLoading ? (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-pulse text-center">
                <p>Loading receipt...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !customer ? (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p>No customer selected. Please select a customer to view their receipt.</p>
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
          <Card className="w-full mb-4">
            <CardContent className="p-0">
              <div 
                id="customer-receipt" 
                className="p-6 relative"
              >
                <div className="flex items-center justify-between mb-8 border-b pb-4">
                  <div className="flex items-center">
                    {/* ACS Logo */}
                    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">
                      ACS
                    </div>
                    <div className="ml-4">
                      <h2 className="text-2xl font-bold">Official Receipt</h2>
                      <p className="text-gray-500">ACS Enterprise</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Receipt #{customer.id.substring(0, 8)}</p>
                    <p className="text-gray-500">{formatDate(customer.created_at)}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Customer Information:</h3>
                  <p><strong>Name:</strong> {customer.name}</p>
                  {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
                  {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                  {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
                  {customer.city && <p><strong>City:</strong> {customer.city}</p>}
                  {customer.state && <p><strong>State:</strong> {customer.state}</p>}
                </div>
                
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Order Details:</h3>
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Item</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">
                            {customer.product || "Product"} 
                            {customer.product_variation && ` - ${customer.product_variation}`}
                            {customer.car_model && ` (${customer.car_model})`}
                          </td>
                          <td className="p-2 text-right">
                            {formatCurrency(customer.sales_amount || 0)}
                          </td>
                        </tr>
                        <tr className="border-t bg-gray-50">
                          <td className="p-2 font-bold">Total</td>
                          <td className="p-2 text-right font-bold">
                            {formatCurrency(customer.paid_amount || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Payment Status:</h3>
                  <div className={`inline-block px-3 py-1 rounded-full ${
                    customer.order_status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : customer.order_status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.order_status?.charAt(0).toUpperCase() + customer.order_status?.slice(1)}
                  </div>
                </div>
                
                <div className="mt-12 border-t pt-4">
                  <p className="text-center text-gray-500 text-sm">
                    Thank you for your business!<br />
                    ACS Enterprise - Quality Products & Services
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={generatePDF}>
                <Download className="mr-2 h-4 w-4" /> Download Receipt
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
