-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- CREATE INDEX IF NOT EXISTS idx_photos_location ON photos (
--   ST_MakePoint(longitude, latitude)
-- ) WHERE longitude IS NOT NULL AND latitude IS NOT NULL;
;

-- Sample data for development
-- This will be inserted after Prisma migrations run