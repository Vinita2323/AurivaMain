import * as addressService from '../services/addressService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/status.js';

export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getUserAddresses(req.user._id);
    return sendSuccess(res, 'Addresses retrieved successfully', { addresses });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req, res, next) => {
  try {
    const address = await addressService.createAddress(req.user._id, req.body);
    return sendSuccess(
      res,
      'Delivery address added successfully',
      { address },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const address = await addressService.updateAddress(
      req.user._id,
      req.params.id,
      req.body
    );
    return sendSuccess(res, 'Address updated successfully', { address });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const result = await addressService.deleteAddress(
      req.user._id,
      req.params.id
    );
    return sendSuccess(res, 'Address deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await addressService.setDefaultAddress(
      req.user._id,
      req.params.id
    );
    return sendSuccess(res, 'Default address updated successfully', { address });
  } catch (error) {
    next(error);
  }
};

export default {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
