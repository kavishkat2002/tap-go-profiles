export type ProfileType = "personal" | "business" | "restaurant";

export interface Profile {
  id: string;
  type: ProfileType;
  slug: string;
  name: string;
  image?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  services?: string[];
  menuCategories?: MenuCategory[];
  views?: number;
  createdAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export const DEMO_PROFILES: Profile[] = [
  {
    id: "1",
    type: "personal",
    slug: "jane-doe",
    name: "Jane Doe",
    description: "Product Designer & Creative Strategist",
    phone: "+1234567890",
    whatsapp: "+1234567890",
    email: "jane@example.com",
    website: "https://janedoe.com",
    socialLinks: {
      linkedin: "https://linkedin.com/in/janedoe",
      instagram: "https://instagram.com/janedoe",
      twitter: "https://twitter.com/janedoe",
    },
    views: 342,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    type: "business",
    slug: "urban-cuts",
    name: "Urban Cuts Salon",
    description: "Premium hair salon & grooming studio in downtown.",
    phone: "+1987654321",
    whatsapp: "+1987654321",
    email: "hello@urbancuts.com",
    website: "https://urbancuts.com",
    address: "123 Main St, New York, NY",
    services: ["Haircut", "Beard Trim", "Hair Coloring", "Styling"],
    views: 1205,
    createdAt: "2024-02-01",
  },
  {
    id: "3",
    type: "restaurant",
    slug: "sakura-kitchen",
    name: "Sakura Kitchen",
    description: "Authentic Japanese cuisine with a modern twist.",
    phone: "+1122334455",
    whatsapp: "+1122334455",
    email: "info@sakurakitchen.com",
    address: "456 Oak Ave, San Francisco, CA",
    menuCategories: [
      {
        id: "c1",
        name: "Starters",
        items: [
          { id: "i1", name: "Edamame", price: 5.99, description: "Steamed soybeans with sea salt" },
          { id: "i2", name: "Miso Soup", price: 4.99, description: "Traditional fermented soybean soup" },
        ],
      },
      {
        id: "c2",
        name: "Main Course",
        items: [
          { id: "i3", name: "Salmon Teriyaki", price: 18.99, description: "Grilled salmon with teriyaki glaze" },
          { id: "i4", name: "Chicken Katsu", price: 15.99, description: "Crispy breaded chicken cutlet" },
          { id: "i5", name: "Veggie Ramen", price: 14.99, description: "Rich miso broth with seasonal vegetables" },
        ],
      },
      {
        id: "c3",
        name: "Drinks",
        items: [
          { id: "i6", name: "Matcha Latte", price: 5.50, description: "Premium ceremonial grade matcha" },
          { id: "i7", name: "Sake", price: 8.99, description: "House-selected cold sake" },
        ],
      },
    ],
    views: 890,
    createdAt: "2024-03-10",
  },
];
