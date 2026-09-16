import chaatImg from '../assets/user/Flavored Makhana.jpg';
import periImg from '../assets/user/Premium Makhana.jpg';
import kheerImg from '../assets/user/Classic Makhana.jpg';
import comboImg from '../assets/user/combo Makhana.jpg';
import healthyImg from '../assets/user/Healthy Makhana2.jpg';

export const INITIAL_RECIPES = [
  {
    id: "recipe-1",
    slug: "makhana-chaat",
    title: "Makhana Chaat",
    category: "Savory Chaats",
    description: "A tangy, spicy, and crunchy street-style Indian chaat made with crispy roasted makhana, fresh pomegranate, sev, and mint-tamarind chutney.",
    image: chaatImg,
    prepTime: "10 mins",
    cookTime: "5 mins",
    servings: "2-3 servings",
    difficulty: "Easy",
    calories: "160 kcal",
    recommendedProduct: "Classic Salted Makhana",
    isFeatured: true,
    status: "ACTIVE",
    order: 1,
    ingredients: [
      "2 cups Auriva Roasted Makhana",
      "1/2 cup finely chopped onions & tomatoes",
      "1/4 cup fresh pomegranate pearls",
      "2 tbsp spicy green mint-coriander chutney",
      "2 tbsp sweet & tangy tamarind date chutney",
      "1/4 cup roasted peanuts",
      "1/2 tsp roasted cumin powder & chaat masala",
      "2 tbsp fresh nylon sev & chopped coriander leaves",
      "Lemon juice to taste"
    ],
    instructions: [
      "In a large bowl, lightly warm or dry roast Auriva Makhana for 1 minute for maximum crunch.",
      "Add chopped onions, tomatoes, roasted peanuts, and pomegranate pearls.",
      "Drizzle the green mint chutney and sweet tamarind chutney over the makhana.",
      "Sprinkle chaat masala, roasted cumin powder, and a squeeze of fresh lemon juice.",
      "Toss gently and garnish with crispy sev and fresh coriander. Serve immediately for optimal crunch!"
    ]
  },
  {
    id: "recipe-2",
    slug: "peri-peri-makhana",
    title: "Peri Peri Makhana",
    category: "Healthy Snacks",
    description: "Zesty, fiery, and addictive roasted makhana infused with exotic African bird's eye chili, paprika, and garlic herb seasoning.",
    image: periImg,
    prepTime: "5 mins",
    cookTime: "5 mins",
    servings: "2 servings",
    difficulty: "Easy",
    calories: "145 kcal",
    recommendedProduct: "Peri Peri Roasted Makhana",
    isFeatured: true,
    status: "ACTIVE",
    order: 2,
    ingredients: [
      "2 cups Auriva Raw or Plain Roasted Makhana",
      "1 tsp pure cold-pressed olive oil or A2 ghee",
      "1.5 tsp Peri Peri spice mix (paprika, garlic, oregano, dried red chili)",
      "1/4 tsp pink Himalayan salt",
      "1/2 tsp nutritional yeast or Parmesan (optional)"
    ],
    instructions: [
      "Heat olive oil or ghee in a heavy-bottomed pan on low flame.",
      "Add the Peri Peri seasoning and pink salt, stirring for 10 seconds so the spices bloom aromatically.",
      "Add the Auriva Makhana and toss continuously for 3-4 minutes until every fox nut is coated evenly.",
      "Turn off the heat and let it cool for 2 minutes to achieve maximum crispy crunch. Enjoy as a guilt-free tea-time snack!"
    ]
  },
  {
    id: "recipe-3",
    slug: "makhana-kheer",
    title: "Makhana Kheer",
    category: "Desserts",
    description: "A rich, creamy, and royal festive pudding simmered in almond milk, scented with saffron, cardamom, and toasted pistachios.",
    image: kheerImg,
    prepTime: "10 mins",
    cookTime: "20 mins",
    servings: "4 servings",
    difficulty: "Medium",
    calories: "220 kcal",
    recommendedProduct: "Classic Jumbo Makhana",
    isFeatured: true,
    status: "ACTIVE",
    order: 3,
    ingredients: [
      "2 cups Auriva Classic Makhana",
      "3 cups whole milk or oat/almond milk",
      "3 tbsp organic jaggery powder or honey",
      "8-10 saffron strands soaked in warm milk",
      "1/2 tsp freshly ground green cardamom powder",
      "2 tbsp slivered almonds, cashews & pistachios",
      "1 tsp pure desi ghee"
    ],
    instructions: [
      "Roast the makhana in ghee until crisp. Coarsely crush half of the makhana in a mixer or with a rolling pin, keeping the rest whole.",
      "Bring milk to a gentle boil in a heavy pot and reduce heat to low-medium.",
      "Add the crushed and whole roasted makhana to the milk. Simmer for 10-12 minutes until the milk thickens.",
      "Stir in the saffron milk, cardamom powder, and sweeten with jaggery or honey.",
      "Garnish with slivered dry fruits. Serve warm or chill in the refrigerator for 2 hours before serving."
    ]
  },
  {
    id: "recipe-4",
    slug: "tangy-tomato-makhana-bhel",
    title: "Tangy Tomato Makhana Bhel",
    category: "Quick Bites",
    description: "A light 5-minute wholesome evening snack packed with antioxidants, crispy makhana, diced cucumbers, and a splash of lime.",
    image: comboImg,
    prepTime: "5 mins",
    cookTime: "0 mins",
    servings: "2 servings",
    difficulty: "Easy",
    calories: "130 kcal",
    recommendedProduct: "Tangy Tomato Makhana",
    isFeatured: false,
    status: "ACTIVE",
    order: 4,
    ingredients: [
      "2 cups Auriva Tangy Tomato Makhana",
      "1 small cucumber finely diced",
      "1 small tomato deseeded and chopped",
      "2 tbsp boiled sweet corn",
      "1 green chili finely chopped",
      "1 tsp chaat masala",
      "Juice of half a fresh lime"
    ],
    instructions: [
      "Take a large mixing bowl and combine diced cucumbers, tomatoes, sweet corn, and green chili.",
      "Sprinkle chaat masala and drizzle fresh lime juice.",
      "Right before serving, add the Auriva Tangy Tomato Makhana so it stays crunchy.",
      "Toss quickly and serve immediately."
    ]
  },
  {
    id: "recipe-5",
    slug: "truffle-herb-makhana-crunch",
    title: "Artisanal Truffle & Herb Bowl",
    category: "Healthy Snacks",
    description: "Gourmet roasted fox nuts tossed in aromatic Italian herbs, roasted garlic, and a hint of white truffle oil.",
    image: healthyImg,
    prepTime: "5 mins",
    cookTime: "5 mins",
    servings: "2 servings",
    difficulty: "Easy",
    calories: "150 kcal",
    recommendedProduct: "Artisanal Truffle & Herb Makhana",
    isFeatured: false,
    status: "ACTIVE",
    order: 5,
    ingredients: [
      "2 cups Auriva Plain Roasted Makhana",
      "1 tsp extra virgin olive oil",
      "A few drops of white truffle oil",
      "1/2 tsp dried rosemary & thyme",
      "1/4 tsp garlic powder",
      "Flaky sea salt & freshly cracked black pepper"
    ],
    instructions: [
      "Warm the olive oil on low heat and stir in the dried herbs and garlic powder.",
      "Add makhana and toss for 2 minutes until warm and fragrant.",
      "Remove from flame, drizzle truffle oil, and sprinkle flaky sea salt with cracked black pepper.",
      "Serve as an upscale movie snack or gourmet party appetizer."
    ]
  }
];
