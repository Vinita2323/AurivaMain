import codPermissionService from '../services/codPermissionService.js';
import { sendSuccess, sendError } from '../utils/response.js';

const handle = (fn) => async (req, res, next) => {
  try {
    return await fn(req, res);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.message, error.code ? { code: error.code } : null, error.statusCode);
    return next(error);
  }
};

/** GET /api/v1/admin/cod-permissions */
export const listCodCustomers = handle(async (req, res) => {
  const { search, codStatus, filter, page, limit } = req.query;
  const data = await codPermissionService.listCustomers({ search, codStatus, filter, page, limit });
  return sendSuccess(res, 'Customers retrieved successfully', data);
});

/** GET /api/v1/admin/cod-permissions/:id */
export const getCodCustomer = handle(async (req, res) => {
  const data = await codPermissionService.getCustomerDetail(req.params.id);
  return sendSuccess(res, 'Customer retrieved successfully', data);
});

/** PATCH /api/v1/admin/cod-permissions/:id   body: { enabled: boolean, reason: string } */
export const updateCodPermission = handle(async (req, res) => {
  const { enabled, reason } = req.body || {};
  const data = await codPermissionService.setCodPermission(req.params.id, req.user, { enabled, reason });
  return sendSuccess(res, `Cash on Delivery ${enabled ? 'enabled' : 'disabled'} for this customer`, data);
});

export default { listCodCustomers, getCodCustomer, updateCodPermission };
