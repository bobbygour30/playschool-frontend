/*
  # Playschool Admin Dashboard Schema

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text) - Class name (e.g., "Nursery", "Pre-KG")
      - `age_group` (text) - Age range for the class
      - `capacity` (integer) - Maximum students
      - `created_at` (timestamp)
    
    - `faculty`
      - `id` (uuid, primary key)
      - `name` (text) - Full name
      - `email` (text, unique) - Email address
      - `phone` (text) - Contact number
      - `designation` (text) - Role (Teacher, Assistant, etc.)
      - `class_id` (uuid, foreign key) - Assigned class
      - `date_of_joining` (date) - Joining date
      - `salary` (numeric) - Monthly salary
      - `status` (text) - Active/Inactive
      - `created_at` (timestamp)
    
    - `students`
      - `id` (uuid, primary key)
      - `name` (text) - Full name
      - `date_of_birth` (date) - DOB
      - `gender` (text) - Gender
      - `class_id` (uuid, foreign key) - Enrolled class
      - `parent_name` (text) - Parent/Guardian name
      - `parent_email` (text) - Parent email
      - `parent_phone` (text) - Parent contact
      - `address` (text) - Home address
      - `emergency_contact` (text) - Emergency contact number
      - `medical_info` (text) - Medical conditions/allergies
      - `enrollment_date` (date) - Date of enrollment
      - `status` (text) - Active/Inactive/Graduated
      - `vehicle_id` (uuid, foreign key, nullable) - Assigned vehicle
      - `created_at` (timestamp)
    
    - `leads`
      - `id` (uuid, primary key)
      - `child_name` (text) - Prospective student name
      - `child_age` (integer) - Age
      - `parent_name` (text) - Parent/Guardian name
      - `parent_email` (text) - Parent email
      - `parent_phone` (text) - Parent contact
      - `interested_class` (text) - Class interested in
      - `source` (text) - How they found us
      - `status` (text) - New/Contacted/Converted/Lost
      - `notes` (text) - Additional notes
      - `follow_up_date` (date) - Next follow-up date
      - `created_at` (timestamp)
    
    - `vehicles`
      - `id` (uuid, primary key)
      - `vehicle_number` (text, unique) - Registration number
      - `vehicle_type` (text) - Bus/Van
      - `driver_name` (text) - Driver name
      - `driver_phone` (text) - Driver contact
      - `capacity` (integer) - Seating capacity
      - `route` (text) - Route description
      - `status` (text) - Active/Maintenance/Inactive
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage all data
*/

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age_group text NOT NULL,
  capacity integer NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now()
);

-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  designation text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  date_of_joining date NOT NULL,
  salary numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text UNIQUE NOT NULL,
  vehicle_type text NOT NULL,
  driver_name text NOT NULL,
  driver_phone text NOT NULL,
  capacity integer NOT NULL DEFAULT 10,
  route text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  parent_name text NOT NULL,
  parent_email text NOT NULL,
  parent_phone text NOT NULL,
  address text NOT NULL,
  emergency_contact text NOT NULL,
  medical_info text DEFAULT '',
  enrollment_date date NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name text NOT NULL,
  child_age integer NOT NULL,
  parent_name text NOT NULL,
  parent_email text NOT NULL,
  parent_phone text NOT NULL,
  interested_class text NOT NULL,
  source text NOT NULL DEFAULT 'Walk-in',
  status text NOT NULL DEFAULT 'New',
  notes text DEFAULT '',
  follow_up_date date,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for classes
CREATE POLICY "Allow authenticated users to view classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete classes"
  ON classes FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for faculty
CREATE POLICY "Allow authenticated users to view faculty"
  ON faculty FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert faculty"
  ON faculty FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update faculty"
  ON faculty FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete faculty"
  ON faculty FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for students
CREATE POLICY "Allow authenticated users to view students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for leads
CREATE POLICY "Allow authenticated users to view leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for vehicles
CREATE POLICY "Allow authenticated users to view vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (true);