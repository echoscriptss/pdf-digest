CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','closed');

CREATE OR REPLACE FUNCTION private.is_higher_tier(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','manager','crm','team_lead')
  )
$$;

CREATE TABLE public.airport_reference (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airport_code text NOT NULL UNIQUE,
  airport_name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'USA',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.airport_reference TO authenticated;
GRANT ALL ON public.airport_reference TO service_role;
ALTER TABLE public.airport_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view airports" ON public.airport_reference
  FOR SELECT TO authenticated USING (true);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_name text NOT NULL,
  company text NOT NULL,
  job_title text,
  email text NOT NULL,
  phone_number text NOT NULL,
  linkedin_url text NOT NULL,
  airport_code text NOT NULL,
  meeting_date date NOT NULL,
  crm_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.lead_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_agent_id_idx ON public.leads (agent_id);
CREATE INDEX leads_status_idx ON public.leads (status);
CREATE INDEX leads_email_idx ON public.leads (lower(email));
CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own leads, higher tiers view all" ON public.leads
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid() OR crm_id = auth.uid() OR private.is_higher_tier(auth.uid()));

CREATE POLICY "Agents create own leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid() OR private.is_higher_tier(auth.uid()));

CREATE POLICY "Owners and higher tiers update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR crm_id = auth.uid() OR private.is_higher_tier(auth.uid()))
  WITH CHECK (agent_id = auth.uid() OR crm_id = auth.uid() OR private.is_higher_tier(auth.uid()));

CREATE POLICY "Owners and higher tiers delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING (agent_id = auth.uid() OR private.is_higher_tier(auth.uid()));

CREATE TRIGGER leads_touch_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.lead_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_comments_lead_id_idx ON public.lead_comments (lead_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_comments TO authenticated;
GRANT ALL ON public.lead_comments TO service_role;
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments visible with the lead" ON public.lead_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
      AND (l.agent_id = auth.uid() OR l.crm_id = auth.uid() OR private.is_higher_tier(auth.uid()))
  ));

CREATE POLICY "Users add their own comments" ON public.lead_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
      AND (l.agent_id = auth.uid() OR l.crm_id = auth.uid() OR private.is_higher_tier(auth.uid()))
  ));

CREATE POLICY "Users update their own comments" ON public.lead_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete their own comments" ON public.lead_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR private.is_higher_tier(auth.uid()));

CREATE TRIGGER lead_comments_touch_updated_at BEFORE UPDATE ON public.lead_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.airport_reference (airport_code, airport_name, city, state) VALUES
('ATL','Hartsfield-Jackson Atlanta International','Atlanta','GA'),
('LAX','Los Angeles International','Los Angeles','CA'),
('ORD','O''Hare International','Chicago','IL'),
('DFW','Dallas/Fort Worth International','Dallas','TX'),
('DEN','Denver International','Denver','CO'),
('JFK','John F. Kennedy International','New York','NY'),
('SFO','San Francisco International','San Francisco','CA'),
('SEA','Seattle-Tacoma International','Seattle','WA'),
('LAS','Harry Reid International','Las Vegas','NV'),
('MCO','Orlando International','Orlando','FL'),
('EWR','Newark Liberty International','Newark','NJ'),
('CLT','Charlotte Douglas International','Charlotte','NC'),
('PHX','Phoenix Sky Harbor International','Phoenix','AZ'),
('IAH','George Bush Intercontinental','Houston','TX'),
('MIA','Miami International','Miami','FL'),
('BOS','Boston Logan International','Boston','MA'),
('MSP','Minneapolis-St Paul International','Minneapolis','MN'),
('FLL','Fort Lauderdale-Hollywood International','Fort Lauderdale','FL'),
('DTW','Detroit Metropolitan Wayne County','Detroit','MI'),
('PHL','Philadelphia International','Philadelphia','PA'),
('LGA','LaGuardia','New York','NY'),
('BWI','Baltimore/Washington International','Baltimore','MD'),
('SLC','Salt Lake City International','Salt Lake City','UT'),
('SAN','San Diego International','San Diego','CA'),
('IAD','Washington Dulles International','Washington','DC'),
('DCA','Ronald Reagan Washington National','Washington','DC'),
('TPA','Tampa International','Tampa','FL'),
('PDX','Portland International','Portland','OR'),
('STL','St. Louis Lambert International','St. Louis','MO'),
('AUS','Austin-Bergstrom International','Austin','TX'),
('MSY','Louis Armstrong New Orleans International','New Orleans','LA'),
('RDU','Raleigh-Durham International','Raleigh','NC'),
('SMF','Sacramento International','Sacramento','CA'),
('SJC','Norman Y. Mineta San Jose International','San Jose','CA'),
('SNA','John Wayne Airport','Santa Ana','CA'),
('MCI','Kansas City International','Kansas City','MO'),
('CLE','Cleveland Hopkins International','Cleveland','OH'),
('PIT','Pittsburgh International','Pittsburgh','PA'),
('CVG','Cincinnati/Northern Kentucky International','Cincinnati','OH'),
('IND','Indianapolis International','Indianapolis','IN'),
('CMH','John Glenn Columbus International','Columbus','OH'),
('NSH','Nashville International','Nashville','TN'),
('MKE','Milwaukee Mitchell International','Milwaukee','WI'),
('OAK','Oakland International','Oakland','CA'),
('HNL','Daniel K. Inouye International','Honolulu','HI'),
('ANC','Ted Stevens Anchorage International','Anchorage','AK'),
('JAX','Jacksonville International','Jacksonville','FL'),
('OKC','Will Rogers World Airport','Oklahoma City','OK'),
('OMA','Eppley Airfield','Omaha','NE'),
('BUF','Buffalo Niagara International','Buffalo','NY');