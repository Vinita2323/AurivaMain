import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Recipe title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Recipe description is required'],
      trim: true
    },
    image: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['Healthy Snacks', 'Quick Bites', 'Desserts', 'Savory Chaats', 'Fitness & Protein'],
      default: 'Healthy Snacks'
    },
    prepTime: {
      type: String,
      default: '10 mins'
    },
    cookTime: {
      type: String,
      default: '5 mins'
    },
    servings: {
      type: String,
      default: '2 servings'
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Chef Level'],
      default: 'Easy'
    },
    calories: {
      type: String,
      default: '180 kcal'
    },
    ingredients: {
      type: [String],
      default: []
    },
    instructions: {
      type: [String],
      default: []
    },
    recommendedProduct: {
      type: String,
      default: 'Peri Peri Roasted Makhana'
    },
    isFeatured: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT'],
      default: 'ACTIVE'
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate slug from title
recipeSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;
