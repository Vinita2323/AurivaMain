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
    popular: true
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
    popular: true
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
    popular: true
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
    popular: true
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
    popular: true
  }
];
