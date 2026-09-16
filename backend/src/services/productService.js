import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Bestseller from '../models/Bestseller.js';
import notificationService from './notificationService.js';
import { HTTP_STATUS } from '../constants/status.js';

export const INITIAL_PRODUCTS_SEED = [
  {
    name: "Artisanal Truffle & Herb Makhana",
    subtitle: "Natural Seasoning • 150g",
    tagline: "Natural Seasoning • 150g",
    slug: "artisanal-truffle-herb-makhana",
    category: "flavoured-makhana",
    flavor: "Natural Seasoning",
    diet: ["gluten-free", "vegan", "low-calorie"],
    price: 249,
    oldPrice: 299,
    discountPercent: 17,
    rating: 5.0,
    reviewsCount: 1,
    weight: "150g",
    weightOptions: [
      { weight: "150g", price: 249, oldPrice: 299, isDefault: true }
    ],
    inStock: true,
    stockCount: 150,
    badge: "BESTSELLER",
    badgeType: "bestseller",
    isBestseller: true,
    image: "/src/assets/user/Premium Makhana.jpg",
    gallery: ["/src/assets/user/Premium Makhana.jpg"],
    description: "Slow roasted premium makhana infused with gourmet natural seasonings.",
    ingredients: "Jumbo Fox Nuts (Phool Makhana), Natural Herbs & Sea Salt.",
    tags: ["Makhana", "Bestseller"],
    status: "ACTIVE"
  },
  {
    name: "Peri Peri Makhana",
    subtitle: "Fiery African Bird's Eye Chilli & Herbs",
    tagline: "Fiery African Bird's Eye Chilli & Herbs",
    slug: "peri-peri-makhana",
    category: "flavoured-makhana",
    flavor: "Peri Peri",
    diet: ["gluten-free", "vegan", "low-calorie"],
    price: 249,
    oldPrice: 299,
    discountPercent: 20,
    rating: 5.0,
    reviewsCount: 310,
    weight: "150g",
    weightOptions: [
      { weight: "100g", price: 179, oldPrice: 219 },
      { weight: "150g", price: 249, oldPrice: 299, isDefault: true },
      { weight: "300g", price: 469, oldPrice: 569 }
    ],
    inStock: true,
    stockCount: 190,
    badge: "BESTSELLER",
    badgeType: "bestseller",
    isBestseller: true,
    image: "/src/assets/user/Types/PeriPeri.jpeg",
    gallery: ["/src/assets/user/Types/PeriPeri.jpeg", "/src/assets/user/Flavored Makhana.jpg"],
    description: "Bold & zesty peri peri botanicals with garlic crisps, oregano, and zesty lemon in our signature air-tight freshness pouch.",
    ingredients: "Jumbo Fox Nuts (Phool Makhana 89%), Olive Mist (6%), Peri Peri Spice Mix (5%).",
    tags: ["Makhana", "Peri Peri", "Spicy", "Bestseller"],
    status: "ACTIVE"
  },
  {
    name: "Cream & Onion Makhana",
    subtitle: "Velvety sweet onion cream glaze",
    tagline: "Velvety sweet onion cream glaze",
    slug: "cream-onion-makhana",
    category: "flavoured-makhana",
    flavor: "Cream & Onion",
    diet: ["gluten-free", "low-calorie"],
    price: 249,
    oldPrice: 299,
    discountPercent: 20,
    rating: 5.0,
    reviewsCount: 175,
    weight: "150g",
    weightOptions: [
      { weight: "100g", price: 179, oldPrice: 219 },
      { weight: "150g", price: 249, oldPrice: 299, isDefault: true },
      { weight: "300g", price: 469, oldPrice: 569 }
    ],
    inStock: true,
    stockCount: 130,
    badge: "POPULAR",
    badgeType: "popular",
    isBestseller: true,
    image: "/src/assets/user/Types/CreamOnion.jpeg",
    gallery: ["/src/assets/user/Types/CreamOnion.jpeg", "/src/assets/user/Healthy Makhana2.jpg"],
    description: "Creamy sour cream combined with roasted spring onions and cracked peppercorns in our signature freshness pouch.",
    ingredients: "Jumbo Fox Nuts (88%), Olive Mist (7%), Sour Cream & Onion Seasoning (5%).",
    tags: ["Makhana", "Cream Onion", "Snack", "Crispy"],
    status: "ACTIVE"
  },
  {
    name: "Tangy Tomato Makhana",
    subtitle: "Ripe sun-dried tomatoes & garden herbs",
    tagline: "Ripe sun-dried tomatoes & garden herbs",
    slug: "tangy-tomato-makhana",
    category: "flavoured-makhana",
    flavor: "Tangy Tomato",
    diet: ["gluten-free", "vegan", "low-calorie"],
    price: 249,
    oldPrice: 299,
    discountPercent: 20,
    rating: 5.0,
    reviewsCount: 185,
    weight: "150g",
    weightOptions: [
      { weight: "100g", price: 179, oldPrice: 219 },
      { weight: "150g", price: 249, oldPrice: 299, isDefault: true },
      { weight: "300g", price: 469, oldPrice: 569 }
    ],
    inStock: true,
    stockCount: 125,
    badge: "BESTSELLER",
    badgeType: "bestseller",
    isBestseller: true,
    image: "/src/assets/user/Types/Tomato.jpeg",
    gallery: ["/src/assets/user/Types/Tomato.jpeg", "/src/assets/user/Flavored Makhana.jpg"],
    description: "Rich Italian sun-dried tomato seasoning blended with basil and Himalayan rock salt.",
    ingredients: "Jumbo Fox Nuts (88%), Sun-dried Tomato Flakes (6%), Olive Mist (6%).",
    tags: ["Makhana", "Tomato", "Tangy", "Bestseller"],
    status: "ACTIVE"
  },
  {
    name: "Roasted & Salted W240 Makhana",
    subtitle: "Buttery jumbo whole makhana",
    tagline: "Buttery jumbo whole makhana",
    slug: "roasted-salted-w240-makhana",
    category: "plain-roasted-makhana",
    flavor: "Himalayan Pink Salt",
    diet: ["gluten-free", "vegan", "keto-friendly"],
    price: 549,
    oldPrice: 649,
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 390,
    weight: "250g",
    weightOptions: [
      { weight: "250g", price: 549, oldPrice: 649, isDefault: true },
      { weight: "500g", price: 999, oldPrice: 1199 }
    ],
    inStock: true,
    stockCount: 160,
    badge: "PREMIUM",
    badgeType: "premium",
    isBestseller: true,
    image: "/src/assets/user/Classic Makhana.jpg",
    gallery: ["/src/assets/user/Classic Makhana.jpg", "/src/assets/user/Types/PeriPeri.jpeg"],
    description: "Jumbo hand-graded 6-suta W240 fox nuts slow-roasted in pure cold-pressed olive mist with coarse mineral Himalayan salt.",
    details: "• Grade: Premium 6-suta W240 hand-sorted jumbo fox nuts\n• Roast: Slow roasted in virgin cold-pressed olive mist\n• Ingredients: 94% Jumbo Fox Nuts, 4% Olive Mist, 2% Himalayan Salt\n• Shelf Life: 9 Months from date of packaging\n• Storage: Store in a cool, airtight container after opening\n• Origin: Sustainably harvested in Bihar, India",
    productDetails: "• Grade: Premium 6-suta W240 hand-sorted jumbo fox nuts\n• Roast: Slow roasted in virgin cold-pressed olive mist\n• Ingredients: 94% Jumbo Fox Nuts, 4% Olive Mist, 2% Himalayan Salt\n• Shelf Life: 9 Months from date of packaging\n• Storage: Store in a cool, airtight container after opening\n• Origin: Sustainably harvested in Bihar, India",
    ingredients: "Grade-1 Jumbo Fox Nuts (94%), Cold-Pressed Olive Mist (4%), Himalayan Rock Salt (2%).",
    tags: ["Jumbo", "Plain", "Healthy", "Keto"],
    status: "ACTIVE"
  },
  {
    name: "Masala Makhana",
    subtitle: "Traditional royal Indian spices",
    tagline: "Traditional royal Indian spices",
    slug: "masala-makhana",
    category: "flavoured-makhana",
    flavor: "Chatpata Masala",
    diet: ["gluten-free", "vegan"],
    price: 249,
    oldPrice: 299,
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 220,
    weight: "150g",
    weightOptions: [
      { weight: "100g", price: 179, oldPrice: 219 },
      { weight: "150g", price: 249, oldPrice: 299, isDefault: true },
      { weight: "300g", price: 469, oldPrice: 569 }
    ],
    inStock: true,
    stockCount: 140,
    badge: "POPULAR",
    badgeType: "popular",
    isBestseller: true,
    image: "/src/assets/user/Flavored Makhana.jpg",
    gallery: ["/src/assets/user/Flavored Makhana.jpg", "/src/assets/user/Types/Tomato.jpeg"],
    description: "Aromatic blend of roasted cumin, dry mango powder, black pepper, and mint.",
    ingredients: "Jumbo Fox Nuts (87%), Chaat Masala Blend (8%), Olive Mist (5%).",
    tags: ["Masala", "Chatpata", "Desi", "Makhana"],
    status: "ACTIVE"
  },
  {
    name: "Pudina Mint Makhana",
    subtitle: "Refreshing mountain mint & sea salt",
    tagline: "Refreshing mountain mint & sea salt",
    slug: "pudina-mint-makhana",
    category: "flavoured-makhana",
    flavor: "Pudina Mint",
    diet: ["gluten-free", "vegan", "low-calorie"],
    price: 249,
    oldPrice: 299,
    discountPercent: 20,
    rating: 4.7,
    reviewsCount: 140,
    weight: "150g",
    weightOptions: [
      { weight: "150g", price: 249, oldPrice: 299, isDefault: true },
      { weight: "300g", price: 469, oldPrice: 569 }
    ],
    inStock: true,
    stockCount: 110,
    badge: "NEW",
    badgeType: "new",
    isBestseller: false,
    image: "/src/assets/user/Healthy Makhana2.jpg",
    gallery: ["/src/assets/user/Healthy Makhana2.jpg", "/src/assets/user/Types/CreamOnion.jpeg"],
    description: "Crisp sun-dried spearmint leaves paired with tangy rock salt for a refreshing cooling burst.",
    ingredients: "Jumbo Fox Nuts (88%), Spearmint Seasoning (6%), Olive Mist (6%).",
    tags: ["Pudina", "Mint", "Cooling", "Makhana"],
    status: "ACTIVE"
  }
];

class ProductService {
  /**
   * Get all active store products with query filtering
   */
  async getAllProducts(filters = {}) {
    // If database is currently disconnected (e.g. initial connection pending), return read-only fallback seed products with stable IDs
    if (mongoose.connection.readyState !== 1) {
      let list = INITIAL_PRODUCTS_SEED.map((p, idx) => ({
        ...p,
        _id: `seed-prod-${p.slug || idx + 1}`,
        id: `seed-prod-${p.slug || idx + 1}`
      }));
      if (filters.category && filters.category !== 'all') {
        list = list.filter(p => p.category === filters.category);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.flavor || '').toLowerCase().includes(q));
      }
      return list;
    }

    const query = { status: { $ne: 'ARCHIVED' } };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.inStock !== undefined) {
      query.inStock = filters.inStock === 'true' || filters.inStock === true;
    }
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [{ name: regex }, { flavor: regex }, { tags: regex }, { subtitle: regex }];
    }

    return await Product.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get product by MongoDB ID or slug
   */
  async getProductById(idOrSlug) {
    if (mongoose.connection.readyState !== 1) {
      const found = INITIAL_PRODUCTS_SEED.find(p => p.slug === idOrSlug || p.id === idOrSlug) || INITIAL_PRODUCTS_SEED[0];
      return { ...found, _id: found.slug, id: found.slug };
    }

    let product = null;
    if (idOrSlug && idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrSlug);
    }
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug });
    }
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }
    return product;
  }

  /**
   * Create a new product in the store catalog
   * Auto-syncs to Bestseller collection if isBestseller is true
   */
  async createProduct(data) {
    if (!data.name || !data.name.trim()) {
      const err = new Error('Product name is required.');
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    // Require active MongoDB connection for data persistence
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database is currently offline. Cannot persist product to database.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }


    // Generate unique slug
    let slug = (data.slug || data.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Calculate prices with intelligent fallbacks
    const priceNum = Number(data.price || data.variants?.[0]?.price || 249);
    const oldPriceNum = Number(data.oldPrice || data.variants?.[0]?.oldPrice || (priceNum > 0 ? Math.round(priceNum * 1.2) : 299));

    // Map weight options from variants or default
    let weightOptions = data.weightOptions;
    if (!weightOptions || weightOptions.length === 0) {
      if (data.variants && data.variants.length > 0) {
        weightOptions = data.variants.map((v, idx) => ({
          weight: v.weight || '150g',
          price: Number(v.price || priceNum),
          oldPrice: Number(v.oldPrice || oldPriceNum),
          isDefault: idx === 0
        }));
      } else {
        weightOptions = [
          { weight: data.weight || '150g', price: priceNum, oldPrice: oldPriceNum, isDefault: true }
        ];
      }
    }

    let discountPercent = Number(data.discountPercent || 0);
    if (!discountPercent && oldPriceNum > priceNum) {
      discountPercent = Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100);
    }

    // High quality signature pouch default image if none provided
    const defaultImage = '/src/assets/user/Types/PeriPeri.jpeg';
    const resolvedImage = data.image && typeof data.image === 'string' && data.image.trim() && !data.image.includes('photo-1599488615731')
      ? data.image.trim()
      : defaultImage;

    const newProduct = await Product.create({
      name: data.name.trim(),
      subtitle: data.subtitle || data.tagline || '',
      tagline: data.tagline || data.subtitle || '',
      slug,
      category: data.category || 'flavoured-makhana',
      flavor: data.flavor || data.name.split(' ')[0] || '',
      diet: data.diet || ['gluten-free', 'vegan', 'low-calorie'],
      price: priceNum,
      oldPrice: oldPriceNum,
      discountPercent,
      rating: Number(data.rating || 5.0),
      reviewsCount: Number(data.reviewsCount || 0),
      weight: data.weight || '150g',
      weightOptions,
      inStock: data.inStock !== false,
      stockCount: Number(data.stockCount ?? 150),
      badge: data.badge || (data.isBestseller ? 'BESTSELLER' : ''),
      badgeType: data.badgeType || (data.isBestseller ? 'bestseller' : 'popular'),
      isBestseller: Boolean(data.isBestseller),
      image: resolvedImage,
      gallery: Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery : [resolvedImage],
      description: data.description || '',
      details: data.details || data.productDetails || '',
      productDetails: data.productDetails || data.details || '',
      ingredients: data.ingredients || '',
      tags: data.tags || [data.name, data.category].filter(Boolean),
      status: data.status || 'ACTIVE'
    });

    // Auto-sync into Bestseller collection if isBestseller is true
    if (data.isBestseller) {
      try {
        const highestOrder = await Bestseller.findOne().sort({ displayOrder: -1 }).select('displayOrder');
        const nextOrder = (highestOrder?.displayOrder ?? 0) + 1;
        await Bestseller.create({
          product: newProduct._id,
          productName: newProduct.name,
          displayOrder: nextOrder,
          isActive: true
        });
      } catch (err) {
        console.warn('[Auto-Bestseller] Product already in bestsellers or duplicate note:', err.message);
      }
    }

    return newProduct;
  }

  /**
   * Update existing product catalog details
   */
  async updateProduct(productId, updateData) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot update product while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    if (updateData.variants && (!updateData.weightOptions || updateData.weightOptions.length === 0)) {
      updateData.weightOptions = updateData.variants.map((v, idx) => ({
        weight: v.weight || '150g',
        price: Number(v.price || updateData.price || product.price),
        oldPrice: Number(v.oldPrice || updateData.oldPrice || product.oldPrice || 0),
        isDefault: idx === 0
      }));
    }

    if (updateData.price !== undefined && updateData.price !== '') {
      updateData.price = Number(updateData.price);
    }
    if (updateData.oldPrice !== undefined && updateData.oldPrice !== '') {
      updateData.oldPrice = Number(updateData.oldPrice);
    }
    if (updateData.stockCount !== undefined && updateData.stockCount !== '') {
      updateData.stockCount = Number(updateData.stockCount);
      if (updateData.inStock === undefined) {
        updateData.inStock = updateData.stockCount > 0;
      }
    }

    if (updateData.price && updateData.oldPrice && updateData.oldPrice > updateData.price && !updateData.discountPercent) {
      updateData.discountPercent = Math.round(((updateData.oldPrice - updateData.price) / updateData.oldPrice) * 100);
    }

    Object.assign(product, updateData);
    await product.save();

    if (updateData.stockCount !== undefined) {
      notificationService.checkAndNotifyLowStock(product).catch(() => {});
    }

    // Sync Bestseller status
    if (updateData.isBestseller !== undefined) {
      if (updateData.isBestseller) {
        const existing = await Bestseller.findOne({ product: product._id });
        if (!existing) {
          const highestOrder = await Bestseller.findOne().sort({ displayOrder: -1 }).select('displayOrder');
          const nextOrder = (highestOrder?.displayOrder ?? 0) + 1;
          await Bestseller.create({
            product: product._id,
            productName: product.name,
            displayOrder: nextOrder,
            isActive: true
          });
        }
      } else {
        await Bestseller.deleteOne({ product: product._id });
      }
    }

    return product;
  }

  /**
   * Delete product and clean up references
   */
  async deleteProduct(productId) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot delete product while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const name = product.name;
    await Product.deleteOne({ _id: productId });
    await Bestseller.deleteOne({ product: productId });

    return { message: `Product "${name}" was deleted successfully from catalog and bestsellers.` };
  }

  /**
   * Toggle in-stock status
   */
  async toggleProductStatus(productId) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot change product status while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    product.inStock = !product.inStock;
    product.status = product.inStock ? 'ACTIVE' : 'INACTIVE';
    await product.save();

    return product;
  }

  /**
   * Update stock count
   */
  async updateStock(productId, stockCount) {
    if (mongoose.connection.readyState !== 1) {
      const err = new Error('Database connection is not available. Cannot update stock while database is offline.');
      err.statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const count = Math.max(0, Number(stockCount));
    product.stockCount = count;
    product.inStock = count > 0;
    if (!product.inStock) {
      product.status = 'INACTIVE';
    } else if (product.status === 'INACTIVE') {
      product.status = 'ACTIVE';
    }
    await product.save();

    // Check and trigger Admin low-stock notification if below threshold
    notificationService.checkAndNotifyLowStock(product).catch(() => {});

    return product;
  }

  /**
   * Seed default catalog products if collection is empty
   */
  async seedInitialProducts() {
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        await Product.insertMany(INITIAL_PRODUCTS_SEED);
        console.log(`[Product Seeding] Successfully seeded ${INITIAL_PRODUCTS_SEED.length} initial store products.`);
      }
    } catch (error) {
      console.error('[Product Seeding Error] Could not seed products:', error.message);
    }
  }
}

export const productService = new ProductService();
export default productService;
