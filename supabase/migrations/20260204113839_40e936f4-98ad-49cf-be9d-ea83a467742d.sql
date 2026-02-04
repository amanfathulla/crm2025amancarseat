-- Add input validation constraints for customers table
ALTER TABLE customers 
  ADD CONSTRAINT customers_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 200),
  ADD CONSTRAINT customers_positive_amounts CHECK (
    (sales_amount IS NULL OR sales_amount >= 0) AND 
    (paid_amount IS NULL OR paid_amount >= 0) AND 
    (gross_profit IS NULL OR gross_profit >= 0)
  );

-- Add input validation constraints for leads table  
ALTER TABLE leads
  ADD CONSTRAINT leads_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 200);

-- Add input validation constraints for products table
ALTER TABLE products
  ADD CONSTRAINT products_positive_price CHECK (price > 0),
  ADD CONSTRAINT products_positive_cost CHECK (cost IS NULL OR cost >= 0);

-- Add input validation constraints for product_variations table
ALTER TABLE product_variations
  ADD CONSTRAINT variations_positive_price CHECK (price > 0),
  ADD CONSTRAINT variations_positive_cost CHECK (cost >= 0);