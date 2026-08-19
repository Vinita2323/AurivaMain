import classicMakhanaImg from '../assets/user/Classic Makhana.jpg';
import flavoredMakhanaImg from '../assets/user/Flavored Makhana.jpg';
import premiumMakhanaImg from '../assets/user/Premium Makhana.jpg';
import comboMakhanaImg from '../assets/user/combo Makhana.jpg';
import healthyMakhanaImg from '../assets/user/Healthy Makhana2.jpg';

export const CATEGORIES = [
  {
    id: "classic-makhana",
    name: "Classic Makhana",
    subtext: "Pure & Lightly Salted",
    count: 14,
    order: 1,
    status: "Active",
    slug: "classic-makhana",
    description: "Crispy, handpicked & slow-roasted classic fox nuts with pure Himalayan crystal salt.",
    image: classicMakhanaImg,
    badge: "Bestseller",
    popular: true,
    subcategories: [
      { id: "sub-1", name: "Himalayan Pink Salt", status: "Active", order: 1 },
      { id: "sub-2", name: "Black Pepper Roast", status: "Active", order: 2 },
      { id: "sub-3", name: "Lightly Salted", status: "Active", order: 3 }
    ]
  },
  {
    id: "flavoured-makhana",
    name: "Flavoured Makhana",
    subtext: "Botanical Spices",
    count: 22,
    order: 2,
    status: "Active",
    slug: "flavoured-makhana",
    description: "Infused with artisanal Indian and international herbs and spice blends.",
    image: flavoredMakhanaImg,
    badge: "Popular",
    popular: true,
    subcategories: [
      { id: "sub-4", name: "Peri Peri", status: "Active", order: 1 },
      { id: "sub-5", name: "Tangy Tomato", status: "Active", order: 2 },
      { id: "sub-6", name: "Cream & Onion", status: "Active", order: 3 },
      { id: "sub-7", name: "Desi Masala", status: "Active", order: 4 },
      { id: "sub-8", name: "Pudina Fresh", status: "Active", order: 5 },
      { id: "sub-9", name: "Gourmet Cheese", status: "Active", order: 6 },
      { id: "sub-10", name: "Smoky Tandoori", status: "Active", order: 7 }
    ]
  },
  {
    id: "premium-makhana",
    name: "Premium Makhana",
    subtext: "Jumbo Selected",
    count: 16,
    order: 3,
    status: "Active",
    slug: "premium-makhana",
    description: "Extra large 6-suta hand-sorted jumbo lotus seeds roasted in cold-pressed virgin olive mist.",
    image: premiumMakhanaImg,
    badge: "Jumbo Size",
    popular: true,
    subcategories: [
      { id: "sub-11", name: "Jumbo California Almonds", status: "Active", order: 1 },
      { id: "sub-12", name: "W240 Roasted Cashews", status: "Active", order: 2 },
      { id: "sub-13", name: "Cold-Pressed Olive Mist", status: "Active", order: 3 }
    ]
  },
  {
    id: "makhana-combos",
    name: "Makhana Combos",
    subtext: "Value & Gift Packs",
    count: 12,
    order: 4,
    status: "Active",
    slug: "makhana-combos",
    description: "Curated variety boxes, family mega packs, and luxury festive gifting assortments.",
    image: comboMakhanaImg,
    badge: "Value Packs",
    popular: true,
    subcategories: [
      { id: "sub-14", name: "Trio Flavor Box", status: "Active", order: 1 },
      { id: "sub-15", name: "Family Mega Tub (4-in-1)", status: "Active", order: 2 },
      { id: "sub-16", name: "Festive Luxury Assortment", status: "Active", order: 3 }
    ]
  },
  {
    id: "healthy-fitness-makhana",
    name: "Healthy / Fitness Makhana",
    subtext: "High Protein & Low Cal",
    count: 18,
    order: 5,
    status: "Active",
    slug: "healthy-fitness-makhana",
    description: "Zero-oil roasted superfood snacks with high satiety, enriched with plant protein.",
    image: healthyMakhanaImg,
    badge: "High Protein",
    popular: true,
    subcategories: [
      { id: "sub-17", name: "7-in-1 Super Seeds Mix", status: "Active", order: 1 },
      { id: "sub-18", name: "Zero-Oil Roasted Protein", status: "Active", order: 2 },
      { id: "sub-19", name: "Diet Satiety Fox Nuts", status: "Active", order: 3 }
    ]
  }
];
