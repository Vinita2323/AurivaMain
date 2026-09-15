import Address from '../models/Address.js';

/**
 * Retrieve all saved addresses for an authenticated user
 * Sorted with default address first, followed by newest created.
 */
export const getUserAddresses = async (userId) => {
  return await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

/**
 * Retrieve a single address by ID belonging strictly to the user
 */
export const getAddressById = async (userId, addressId) => {
  return await Address.findOne({ _id: addressId, user: userId });
};

/**
 * Add a new delivery address
 */
export const createAddress = async (userId, addressData) => {
  const existingCount = await Address.countDocuments({ user: userId });

  // If this is the user's first address or requested as default, mark as default
  const shouldBeDefault = existingCount === 0 || Boolean(addressData.isDefault);

  if (shouldBeDefault && existingCount > 0) {
    // Demote any previously default address
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const newAddress = new Address({
    user: userId,
    fullName: addressData.fullName.trim(),
    phoneNumber: addressData.phoneNumber.trim(),
    addressLine1: addressData.addressLine1.trim(),
    addressLine2: (addressData.addressLine2 || '').trim(),
    landmark: (addressData.landmark || '').trim(),
    city: addressData.city.trim(),
    state: (addressData.state || 'Madhya Pradesh').trim(),
    postalCode: addressData.postalCode.trim(),
    country: (addressData.country || 'India').trim(),
    addressType: (addressData.addressType || 'home').toLowerCase(),
    latitude: addressData.latitude || null,
    longitude: addressData.longitude || null,
    isDefault: shouldBeDefault
  });

  return await newAddress.save();
};

/**
 * Update an existing address belonging to the user
 */
export const updateAddress = async (userId, addressId, updateData) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    const error = new Error('Address not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.isDefault && !address.isDefault) {
    // Unset other defaults
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    address.isDefault = true;
  }

  const allowedFields = [
    'fullName',
    'phoneNumber',
    'addressLine1',
    'addressLine2',
    'landmark',
    'city',
    'state',
    'postalCode',
    'country',
    'addressType',
    'latitude',
    'longitude'
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (typeof updateData[field] === 'string') {
        address[field] = updateData[field].trim();
      } else {
        address[field] = updateData[field];
      }
    }
  }

  return await address.save();
};

/**
 * Delete an address belonging to the user
 * If deleting the default address, automatically designate the next available address as default.
 */
export const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    const error = new Error('Address not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const wasDefault = address.isDefault;
  await Address.deleteOne({ _id: addressId, user: userId });

  if (wasDefault) {
    const nextAddress = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return { deletedId: addressId };
};

/**
 * Set an address as the default address
 */
export const setDefaultAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    const error = new Error('Address not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  // Atomically unset all other defaults for user
  await Address.updateMany({ user: userId }, { $set: { isDefault: false } });

  address.isDefault = true;
  return await address.save();
};

export default {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
