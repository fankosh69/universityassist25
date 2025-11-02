-- Add delivery tracking and enhanced shortlist management features

-- Add delivery status tracking
ALTER TABLE program_shortlists 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
ADD COLUMN IF NOT EXISTS delivery_error TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cc_delivery_status JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN program_shortlists.delivery_status IS 'Main recipient delivery status: pending, sent, delivered, failed, bounced';
COMMENT ON COLUMN program_shortlists.cc_delivery_status IS 'Array of CC delivery statuses: [{email: string, status: string, delivered_at: timestamp}]';
COMMENT ON COLUMN program_shortlists.delivery_error IS 'Error message if delivery failed';

-- Add index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_shortlists_status ON program_shortlists(status);
CREATE INDEX IF NOT EXISTS idx_shortlists_delivery_status ON program_shortlists(delivery_status);