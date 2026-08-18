import classicMakhanaImg from '../assets/user/Classic Makhana.jpg';
import flavoredMakhanaImg from '../assets/user/Flavored Makhana.jpg';
import premiumMakhanaImg from '../assets/user/Premium Makhana.jpg';
import comboMakhanaImg from '../assets/user/combo Makhana.jpg';
import healthyMakhanaImg from '../assets/user/Healthy Makhana2.jpg';

export const CATEGORIES = [
  {
    id: "classic-makhana",
    name: "CLASSIC MAKHANA",
    subtext: "Pure & Lightly Salted",
    count: 14,
    slug: "classic-makhana",
    description: "Crispy, handpicked & slow-roasted classic fox nuts with pure Himalayan crystal salt.",
    image: classicMakhanaImg,
    badge: "Bestseller",
    popular: true
  },
  {
    id: "flavoured-makhana",
    name: "FLAVOURED MAKHANA",
    subtext: "Botanical Spices",
    count: 22,
    slug: "flavoured-makhana",
    description: "Infused with artisanal Indian and international herbs and spice blends.",
    image: flavoredMakhanaImg,
    badge: "Popular",
    popular: true
  },
  {
    id: "premium-makhana",
    name: "PREMIUM MAKHANA",
    subtext: "Jumbo Selected",
    count: 16,
    slug: "premium-makhana",
    description: "Extra large 6-suta hand-sorted jumbo lotus seeds roasted in cold-pressed virgin olive mist.",
    image: premiumMakhanaImg,
    badge: "Jumbo Size",
    popular: true
  },
  {
    id: "makhana-combos",
    name: "MAKHANA COMBOS",
    subtext: "Value & Gift Packs",
    count: 12,
    slug: "makhana-combos",
    description: "Curated variety boxes, family mega packs, and luxury festive gifting assortments.",
    image: comboMakhanaImg,
    badge: "Value Packs",
    popular: true
  },
  {
    id: "healthy-fitness-makhana",
    name: "HEALTHY / FITNESS MAKHANA",
    subtext: "High Protein & Low Cal",
    count: 18,
    slug: "healthy-fitness-makhana",
    description: "Zero-oil roasted superfood snacks with high satiety, enriched with plant protein.",
    image: healthyMakhanaImg,
    badge: "High Protein",
    popular: true
  }
];
