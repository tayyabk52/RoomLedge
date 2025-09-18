-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bill_calculations (
  bill_id uuid NOT NULL,
  user_id uuid NOT NULL,
  owed_paisa bigint NOT NULL DEFAULT 0,
  covered_paisa bigint NOT NULL DEFAULT 0,
  net_paisa bigint NOT NULL DEFAULT 0,
  remaining_paisa bigint NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bill_calculations_pkey PRIMARY KEY (bill_id, user_id),
  CONSTRAINT bill_calculations_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bill_categories (
  bill_id uuid NOT NULL,
  category_id integer NOT NULL,
  CONSTRAINT bill_categories_pkey PRIMARY KEY (bill_id, category_id),
  CONSTRAINT bill_categories_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id)
);
CREATE TABLE public.bill_coverage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bill_id uuid NOT NULL,
  payer_user_id uuid NOT NULL,
  covered_user_id uuid NOT NULL,
  amount_paisa bigint NOT NULL CHECK (amount_paisa >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bill_coverage_pkey PRIMARY KEY (id),
  CONSTRAINT bill_coverage_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_coverage_payer_user_id_fkey FOREIGN KEY (payer_user_id) REFERENCES public.profiles(id),
  CONSTRAINT bill_coverage_covered_user_id_fkey FOREIGN KEY (covered_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bill_extras (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bill_id uuid NOT NULL,
  extra_type USER-DEFINED NOT NULL,
  name text NOT NULL,
  amount_paisa bigint NOT NULL CHECK (amount_paisa >= 0),
  split_rule USER-DEFINED NOT NULL DEFAULT 'proportional'::extras_split_rule,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bill_extras_pkey PRIMARY KEY (id),
  CONSTRAINT bill_extras_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id)
);
CREATE TABLE public.bill_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bill_id uuid NOT NULL,
  user_id uuid NOT NULL,
  item_name text NOT NULL,
  price_paisa bigint NOT NULL CHECK (price_paisa > 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bill_items_pkey PRIMARY KEY (id),
  CONSTRAINT bill_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bill_participants (
  bill_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT bill_participants_pkey PRIMARY KEY (bill_id, user_id),
  CONSTRAINT bill_participants_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bill_payers (
  bill_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount_paid numeric NOT NULL CHECK (amount_paid >= 0::numeric),
  CONSTRAINT bill_payers_pkey PRIMARY KEY (bill_id, user_id),
  CONSTRAINT bill_payers_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_payers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bill_receipts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bill_id uuid NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bill_receipts_pkey PRIMARY KEY (id),
  CONSTRAINT bill_receipts_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id)
);
CREATE TABLE public.bill_settlements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bill_id uuid NOT NULL,
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  method USER-DEFINED NOT NULL,
  note text,
  settled_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bill_settlements_pkey PRIMARY KEY (id),
  CONSTRAINT bill_settlements_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_settlements_from_user_fkey FOREIGN KEY (from_user) REFERENCES public.profiles(id),
  CONSTRAINT bill_settlements_to_user_fkey FOREIGN KEY (to_user) REFERENCES public.profiles(id)
);
CREATE TABLE public.bill_suggested_transfers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bill_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  amount_paisa bigint NOT NULL CHECK (amount_paisa > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bill_suggested_transfers_pkey PRIMARY KEY (id),
  CONSTRAINT bill_suggested_transfers_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.bills(id),
  CONSTRAINT bill_suggested_transfers_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.profiles(id),
  CONSTRAINT bill_suggested_transfers_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bills (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  title text NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount > 0::numeric),
  currency USER-DEFINED NOT NULL DEFAULT 'PKR'::room_currency,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  status USER-DEFINED NOT NULL DEFAULT 'open'::bill_status,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_advanced boolean NOT NULL DEFAULT false,
  CONSTRAINT bills_pkey PRIMARY KEY (id),
  CONSTRAINT bills_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT bills_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.expense_categories (
  id integer NOT NULL DEFAULT nextval('expense_categories_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id uuid,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.recurring_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency USER-DEFINED NOT NULL DEFAULT 'PKR'::room_currency,
  frequency USER-DEFINED NOT NULL DEFAULT 'monthly'::recurrence_freq,
  next_run_date date,
  CONSTRAINT recurring_templates_pkey PRIMARY KEY (id),
  CONSTRAINT recurring_templates_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.room_members (
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT room_members_pkey PRIMARY KEY (room_id, user_id),
  CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id),
  CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  invite_code character NOT NULL UNIQUE,
  base_currency USER-DEFINED NOT NULL DEFAULT 'PKR'::room_currency,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);