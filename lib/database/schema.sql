-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE ride_status AS ENUM ('requested', 'assigned', 'arriving', 'in_progress', 'completed', 'canceled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE driver_status AS ENUM ('offline', 'online', 'busy');
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE notification_type AS ENUM ('ride_request', 'ride_update', 'payment', 'system', 'promotion');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role NOT NULL DEFAULT 'passenger',
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_of_birth DATE,
    emergency_contact TEXT,
    emergency_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table (additional driver-specific info)
CREATE TABLE drivers (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    license_number TEXT UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    vehicle_make TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_color TEXT NOT NULL,
    vehicle_plate TEXT UNIQUE NOT NULL,
    status driver_status DEFAULT 'offline',
    documents_verified BOOLEAN DEFAULT FALSE,
    background_check_verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_rides INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    current_location GEOGRAPHY(POINT),
    current_heading DECIMAL(5,2),
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    passenger_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(user_id) ON DELETE SET NULL,
    status ride_status DEFAULT 'requested',
    pickup_address TEXT NOT NULL,
    pickup_location GEOGRAPHY(POINT) NOT NULL,
    dropoff_address TEXT NOT NULL,
    dropoff_location GEOGRAPHY(POINT) NOT NULL,
    distance_km DECIMAL(8,2),
    estimated_duration_min INTEGER,
    fare_estimate DECIMAL(10,2),
    fare_final DECIMAL(10,2),
    surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
    passenger_notes TEXT,
    driver_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    pickup_at TIMESTAMP WITH TIME ZONE,
    dropoff_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    canceled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver locations table for real-time tracking
CREATE TABLE driver_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID REFERENCES drivers(user_id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT) NOT NULL,
    heading DECIMAL(5,2),
    speed_kmh DECIMAL(5,2),
    accuracy_meters DECIMAL(8,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    status payment_status DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    fee_amount DECIMAL(10,2),
    driver_payout DECIMAL(10,2),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_driver_review BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status support_ticket_status DEFAULT 'open',
    priority INTEGER DEFAULT 2,
    assigned_admin_id UUID REFERENCES profiles(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Pricing rules table
CREATE TABLE pricing_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    city TEXT NOT NULL,
    base_fare DECIMAL(10,2) NOT NULL,
    per_km_rate DECIMAL(10,2) NOT NULL,
    per_minute_rate DECIMAL(10,2) NOT NULL,
    minimum_fare DECIMAL(10,2) NOT NULL,
    maximum_fare DECIMAL(10,2),
    surge_threshold_multiplier DECIMAL(3,2) DEFAULT 2.0,
    booking_fee DECIMAL(10,2) DEFAULT 0.00,
    active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ride requests table (for managing ride matching)
CREATE TABLE ride_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(user_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_requested_at ON rides(requested_at);
CREATE INDEX idx_rides_pickup_location ON rides USING GIST(pickup_location);
CREATE INDEX idx_driver_locations_driver_timestamp ON driver_locations(driver_id, timestamp DESC);
CREATE INDEX idx_driver_locations_location ON driver_locations USING GIST(location);
CREATE INDEX idx_payments_ride_id ON payments(ride_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_pricing_rules_city_active ON pricing_rules(city, is_active);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Drivers policies
CREATE POLICY "Drivers can view own data" ON drivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers can update own data" ON drivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all drivers" ON drivers FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can update all drivers" ON drivers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Passengers can view assigned driver" ON drivers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM rides 
        WHERE driver_id = drivers.user_id 
        AND passenger_id = auth.uid() 
        AND status IN ('assigned', 'arriving', 'in_progress')
    )
);

-- Rides policies
CREATE POLICY "Users can view own rides" ON rides FOR SELECT USING (
    passenger_id = auth.uid() OR driver_id = auth.uid()
);
CREATE POLICY "Passengers can create rides" ON rides FOR INSERT WITH CHECK (
    passenger_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'passenger')
);
CREATE POLICY "Drivers can update assigned rides" ON rides FOR UPDATE USING (
    driver_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver')
);
CREATE POLICY "Passengers can update own rides" ON rides FOR UPDATE USING (
    passenger_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'passenger')
);
CREATE POLICY "Admin can view all rides" ON rides FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Driver locations policies
CREATE POLICY "Drivers can insert own location" ON driver_locations FOR INSERT WITH CHECK (
    driver_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver')
);
CREATE POLICY "Drivers can view own locations" ON driver_locations FOR SELECT USING (
    driver_id = auth.uid()
);
CREATE POLICY "Passengers can view assigned driver location" ON driver_locations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM rides 
        WHERE driver_id = driver_locations.driver_id 
        AND passenger_id = auth.uid() 
        AND status IN ('assigned', 'arriving', 'in_progress')
    )
);
CREATE POLICY "Admin can view all locations" ON driver_locations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
    passenger_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM rides WHERE id = payments.ride_id AND driver_id = auth.uid())
);
CREATE POLICY "Admin can view all payments" ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews policies
CREATE POLICY "Users can view reviews about them" ON reviews FOR SELECT USING (
    reviewee_id = auth.uid() OR reviewer_id = auth.uid()
);
CREATE POLICY "Users can create reviews for their rides" ON reviews FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM rides 
        WHERE id = reviews.ride_id 
        AND (passenger_id = auth.uid() OR driver_id = auth.uid())
        AND status = 'completed'
    )
);
CREATE POLICY "Admin can view all reviews" ON reviews FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin can create notifications" ON notifications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tickets" ON support_tickets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admin can view all tickets" ON support_tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Pricing rules policies
CREATE POLICY "Everyone can view active pricing rules" ON pricing_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage pricing rules" ON pricing_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Ride requests policies
CREATE POLICY "Drivers can view requests sent to them" ON ride_requests FOR SELECT USING (driver_id = auth.uid());
CREATE POLICY "Drivers can update their requests" ON ride_requests FOR UPDATE USING (driver_id = auth.uid());
CREATE POLICY "Admin can view all requests" ON ride_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create functions for triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(lat1 float, lon1 float, lat2 float, lon2 float)
RETURNS float AS $$
DECLARE
    radlat1 float;
    radlat2 float;
    theta float;
    radtheta float;
    dist float;
BEGIN
    IF lat1 = lat2 AND lon1 = lon2 THEN
        RETURN 0;
    END IF;
    
    radlat1 = pi() * lat1 / 180;
    radlat2 = pi() * lat2 / 180;
    theta = lon1 - lon2;
    radtheta = pi() * theta / 180;
    dist = sin(radlat1) * sin(radlat2) + cos(radlat1) * cos(radlat2) * cos(radtheta);
    dist = acos(dist);
    dist = dist * 180 / pi();
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344; -- Convert to kilometers
    
    RETURN dist;
END;
$$ LANGUAGE plpgsql;

-- Insert default pricing rules
INSERT INTO pricing_rules (city, base_fare, per_km_rate, per_minute_rate, minimum_fare, maximum_fare, booking_fee) VALUES
('Default', 3.50, 1.20, 0.25, 5.00, 100.00, 1.50);

-- Create admin user function (to be called after user registration)
CREATE OR REPLACE FUNCTION create_admin_user(user_email text, user_password text)
RETURNS uuid AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- This would typically be called via Supabase Auth Admin API
    -- For demo purposes, we'll create a function that can be called from the application
    -- In production, use Supabase's createUser function with admin privileges
    RETURN null;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;