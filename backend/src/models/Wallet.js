import mongoose from 'mongoose';

/**
 * One store-credit wallet per customer. The balance is only ever changed through
 * services/walletService.js (atomic $inc), never by assigning a number.
 */
const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Wallet balance cannot be negative']
    }
  },
  { timestamps: true }
);

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;
