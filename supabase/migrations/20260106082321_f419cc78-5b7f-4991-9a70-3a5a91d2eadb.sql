
-- Create leads table for Lead Management
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for full access
CREATE POLICY "Allow select leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow delete leads" ON public.leads FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
