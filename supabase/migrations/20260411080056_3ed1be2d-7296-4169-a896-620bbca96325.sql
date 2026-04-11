CREATE TYPE public.profile_type AS ENUM ('personal', 'business', 'restaurant');

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.profile_type NOT NULL DEFAULT 'personal',
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  facebook TEXT,
  instagram TEXT,
  linkedin TEXT,
  twitter TEXT,
  services TEXT[],
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profiles" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Menu categories are publicly viewable" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Profile owners can manage categories" ON public.menu_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);
CREATE POLICY "Profile owners can update categories" ON public.menu_categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);
CREATE POLICY "Profile owners can delete categories" ON public.menu_categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);

CREATE POLICY "Menu items are publicly viewable" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Profile owners can manage items" ON public.menu_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.menu_categories mc
    JOIN public.profiles p ON p.id = mc.profile_id
    WHERE mc.id = category_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Profile owners can update items" ON public.menu_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.menu_categories mc
    JOIN public.profiles p ON p.id = mc.profile_id
    WHERE mc.id = category_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Profile owners can delete items" ON public.menu_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.menu_categories mc
    JOIN public.profiles p ON p.id = mc.profile_id
    WHERE mc.id = category_id AND p.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_slug ON public.profiles(slug);
CREATE INDEX idx_profiles_type ON public.profiles(type);
CREATE INDEX idx_menu_categories_profile ON public.menu_categories(profile_id);
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);

CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET views = views + 1 WHERE slug = profile_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;