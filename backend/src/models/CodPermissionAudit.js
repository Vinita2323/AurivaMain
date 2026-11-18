import mongoose from 'mongoose';

/**
 * Append-only record of every admin change to a customer's Cash-on-Delivery permission.
 * (The project has no generic audit log; this is the minimal dedicated one.)
 */
const codPermissionAuditSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    adminName: { type: String, default: '' },
    adminEmail: { type: String, default: '' },
    action: { type: String, enum: ['ENABLE', 'DISABLE'], required: true },
    previousEnabled: { type: Boolean, required: true },
    newEnabled: { type: Boolean, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

codPermissionAuditSchema.index({ customer: 1, createdAt: -1 });

export const CodPermissionAudit = mongoose.model('CodPermissionAudit', codPermissionAuditSchema);
export default CodPermissionAudit;
