
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type DeleteProductDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSuccess: () => void;
};

const DeleteProductDialog = ({
  isOpen,
  onClose,
  productId,
  productName,
  onSuccess,
}: DeleteProductDialogProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      // First, delete the product variations
      const { error: variationsError } = await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", productId);

      if (variationsError) throw variationsError;

      // Then delete the product
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Produk dibuang",
        description: "Produk telah berjaya dibuang",
      });
      onSuccess();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Ralat",
        description: "Terdapat masalah semasa membuang produk",
        variant: "destructive",
      });
    } finally {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Buang Produk</AlertDialogTitle>
          <AlertDialogDescription>
            Adakah anda pasti mahu membuang <strong>{productName}</strong>? Tindakan ini tidak boleh dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
            Buang
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProductDialog;
