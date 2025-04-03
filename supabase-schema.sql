-- create users table (handled by supabase auth

-- create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) on DELETE CASCADE,
    items JSONB NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('processing', 'shipped', 'delivered', 'completed')),
    wallet_address TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    is_test_purchase BOOLEAN NOT NULL DEFAULT false,
    tracking_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- create product reviews table
CREATE TABLE public.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) on DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- create RLS policies for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON public.orders
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create RLS policies for  product reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product reviews"
    ON public.product_reviews
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own reviews"
    ON public.product_reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for orders table
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column()