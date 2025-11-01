-- Drop and recreate the function with proper search_path
DROP FUNCTION IF EXISTS update_messages_search_vector() CASCADE;

CREATE OR REPLACE FUNCTION update_messages_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS messages_search_update ON ai_messages;
CREATE TRIGGER messages_search_update
  BEFORE INSERT OR UPDATE OF content ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_search_vector();