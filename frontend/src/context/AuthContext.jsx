import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS } from '../data/adminData';
import { userAuthApi, addressApi, orderApi } from '../utils/api';
import confetti from 'canvas-confetti';

const AuthContext = createContext();

const INITIAL_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Vini Sharma",
    email: "vini.sharma@gmail.com",
    phone: "+91 9876543210",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rewardsPoints: 2450,
    tier: "Gold Wellness Member",
    memberSince: "Jan 2024",
    totalOrders: 6,
    totalSpent: 4890,
    city: "Indore",
    state: "Madhya Pradesh",
    status: "Active"
  },
  {
    id: "cust-2",
    name: "Rahul Verma",
    email: "rahul.v@outlook.com",
    phone: "+91 9822334455",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rewardsPoints: 1200,
    tier: "Silver Member",
    memberSince: "Mar 2024",
    totalOrders: 3,
    totalSpent: 2650,
    city: "Mumbai",
    state: "Maharashtra",
    status: "Active"
  }
];

export const formatAddress = (a) => ({
  id: a._id || a.id,
  _id: a._id || a.id,
  type: a.addressType ? (a.addressType.charAt(0).toUpperCase() + a.addressType.slice(1)) : (a.type || 'Home'),
  addressType: (a.addressType || a.type || 'home').toLowerCase(),
  isDefault: Boolean(a.isDefault),
  street: a.addressLine1
    ? a.addressLine1 + (a.addressLine2 ? `, ${a.addressLine2}` : '') + (a.landmark ? `, Near ${a.landmark}` : '')
    : (a.street || ''),
  addressLine1: a.addressLine1 || a.street || '',
  addressLine2: a.addressLine2 || '',
  landmark: a.landmark || '',
  city: a.city || '',
  state: a.state || 'Madhya Pradesh',
  pincode: a.postalCode || a.pincode || '',
  postalCode: a.postalCode || a.pincode || '',
  phone: a.phoneNumber || a.phone || '',
  phoneNumber: a.phoneNumber || a.phone || '',
  name: a.fullName || a.name || ''
});

export const formatOrder = (o) => {
  const mapStatusToDisplay = (s) => {
    if (!s) return 'Order Received';
    const u = String(s).toUpperCase().replace(/\s+/g, '_');
    if (u === 'CONFIRMED' || u === 'ORDER_RECEIVED') return 'Order Received';
    if (u === 'PACKED' || u === 'PROCESSING') return 'Packed';
    if (u === 'SHIPPED' || u === 'READY_FOR_DISPATCH') return 'Ready for Dispatch';
    if (u === 'OUT_FOR_DELIVERY') return 'Out for Delivery';
    if (u === 'DELIVERED') return 'Delivered';
    if (u === 'CANCELLED' || u === 'CANCELED') return 'Cancelled';
    return s;
  };

  return {
    id: o.orderNumber || o.id || o._id,
    _id: o._id,
    orderNumber: o.orderNumber || o.id,
    customer: o.shippingAddress?.fullName || o.customer || "Customer",
    email: o.email || "customer@aurivafoods.com",
    phone: o.shippingAddress?.phoneNumber || o.phone || "+91 9876543210",
    date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (o.date || 'Today'),
    time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (o.time || 'Just now'),
    items: o.items || [],
    subtotal: o.pricing?.subtotal ?? o.subtotal ?? 0,
    discount: o.pricing?.discount ?? o.discount ?? 0,
    couponApplied: o.pricing?.couponCode || o.couponApplied || 'None',
    deliveryFee: o.pricing?.deliveryFee ?? o.deliveryFee ?? 0,
    tax: o.pricing?.tax ?? o.tax ?? 0,
    total: o.pricing?.total ?? o.total ?? 0,
    paymentMethod: o.payment?.method || o.paymentMethod || 'COD',
    paymentStatus: o.payment?.status || 'PENDING',
    transactionId: o.payment?.transactionId || '',
    deliveryType: o.delivery?.type || o.deliveryType || "Standard Express Courier",
    status: mapStatusToDisplay(o.status),
    rawStatus: o.status,
    courierName: o.courierName || o.delivery?.type || '',
    awbNumber: o.awbNumber || '',
    deliveryNotes: o.deliveryNotes || '',
    dispatchedAt: o.dispatchedAt || null,
    cancelReason: o.cancelReason || '',
    cancelledBy: o.cancelledBy || null,
    cancelledAt: o.cancelledAt || null,
    timeline: o.timeline && o.timeline.length > 0 ? o.timeline : [
      { status: "Order Received", time: "Order Placed", done: true, current: false },
      { status: "Packed", time: "Warehouse Hub", done: true, current: false },
      { status: "Ready for Dispatch", time: "In process", done: true, current: false },
      { status: "Out for Delivery", time: "Live", done: true, current: true },
      { status: "Delivered", time: "Estimated in 25 mins", done: false, current: false }
    ],
    rider: o.rider || {
      name: "Rohan Kumar",
      phone: "+91 9811122334",
      rating: 4.9,
      vehicle: "MP09-AB-1234",
      eta: "25 mins",
      distance: "2.5 km away",
      lat: 22.7196,
      lng: 75.8577
    },
    address: o.shippingAddress ? {
      type: o.shippingAddress.addressType ? (o.shippingAddress.addressType.charAt(0).toUpperCase() + o.shippingAddress.addressType.slice(1)) : 'Home',
      street: o.shippingAddress.addressLine1 + (o.shippingAddress.addressLine2 ? `, ${o.shippingAddress.addressLine2}` : '') + (o.shippingAddress.landmark ? `, Near ${o.shippingAddress.landmark}` : ''),
      city: o.shippingAddress.city,
      state: o.shippingAddress.state,
      pincode: o.shippingAddress.postalCode,
      phone: o.shippingAddress.phoneNumber,
      name: o.shippingAddress.fullName
    } : o.address
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_user');
      if (saved === 'null') return null;
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CUSTOMERS[0];
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('auriva_user_token') || null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ORDERS;
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_registered_customers');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [addresses, setAddresses] = useState(() => {
    return [
      {
        id: "addr-1",
        type: "Home",
        isDefault: true,
        street: "32, Green Park, A-Block, Near Lotus Lake",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001",
        phone: "9876543210",
        name: "Vini Sharma"
      },
      {
        id: "addr-2",
        type: "Work",
        isDefault: false,
        street: "Tech Tower 4, 3rd Floor, Vijay Nagar",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452010",
        phone: "9876543210",
        name: "Vini Sharma"
      }
    ];
  });

  const [selectedAddressId, setSelectedAddressId] = useState("addr-1");

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('auriva_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('auriva_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('auriva_user_token', token);
      } else {
        localStorage.removeItem('auriva_user_token');
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    try {
      localStorage.setItem('auriva_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('auriva_registered_customers', JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  // Synchronize addresses and orders with backend whenever user is authenticated
  useEffect(() => {
    if (token) {
      addressApi.getAddresses()
        .then(res => {
          if (res?.data?.addresses && res.data.addresses.length > 0) {
            const formatted = res.data.addresses.map(formatAddress);
            setAddresses(formatted);
            const def = formatted.find(a => a.isDefault);
            if (def) setSelectedAddressId(def.id);
            else setSelectedAddressId(formatted[0].id);
          }
        })
        .catch(err => console.warn('[AuthContext] Backend addresses load note:', err.message));

      orderApi.getUserOrders()
        .then(res => {
          if (res?.data?.orders && res.data.orders.length > 0) {
            const formatted = res.data.orders.map(formatOrder);
            setOrders(formatted);
          }
        })
        .catch(err => console.warn('[AuthContext] Backend orders load note:', err.message));
    }
  }, [token]);

  /**
   * Request OTP from backend API
   */
  const requestOtp = async (phoneNumber) => {
    try {
      const response = await userAuthApi.sendOtp(phoneNumber);
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to send OTP'
      };
    }
  };

  /**
   * Verify OTP and Login / Register User
   */
  const verifyOtpAndLogin = async (phoneNumber, otp) => {
    try {
      const response = await userAuthApi.verifyOtp(phoneNumber, otp);
      if (response && response.data) {
        const { token: receivedToken, user: receivedUser } = response.data;
        setToken(receivedToken);
        
        // Enrich user with UI fields if needed
        const formattedUser = {
          id: receivedUser._id || receivedUser.id || `cust-${Date.now()}`,
          name: receivedUser.name || `User ${receivedUser.phone?.slice(-4) || ''}`,
          email: receivedUser.email || '',
          phone: receivedUser.phone ? `+91 ${receivedUser.phone}` : phoneNumber,
          avatar: receivedUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          rewardsPoints: 500,
          tier: "Gold Wellness Member",
          memberSince: "Member",
          role: receivedUser.role || 'USER',
          status: receivedUser.status || 'ACTIVE'
        };

        setUser(formattedUser);
        setCustomers(prev => {
          const exists = prev.some(c => c.phone === formattedUser.phone);
          return exists ? prev : [formattedUser, ...prev];
        });

        return { success: true, user: formattedUser };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      // Offline fallback for seamless testing
      if (err.isNetworkError) {
        return loginWithPhone(phoneNumber);
      }
      return {
        success: false,
        message: err.message || 'Verification failed'
      };
    }
  };

  const loginWithPhone = (phoneNumber) => {
    const digitsOnly = (phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (digitsOnly.length < 10) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }

    const existing = customers.find(c => {
      const cDigits = (c.phone || '').replace(/\D/g, '').slice(-10);
      return cDigits === digitsOnly;
    });

    if (existing) {
      setUser(existing);
      return { success: true, user: existing };
    }

    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: `Member ${digitsOnly.slice(-4)}`,
      email: `user.${digitsOnly}@aurivafoods.com`,
      phone: `+91 ${digitsOnly}`,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      rewardsPoints: 500,
      tier: "Gold Wellness Member",
      memberSince: "Just now",
      totalOrders: 0,
      totalSpent: 0,
      city: "Indore",
      state: "Madhya Pradesh",
      status: "Active"
    };

    setCustomers(prev => [newCustomer, ...prev]);
    setUser(newCustomer);
    return { success: true, user: newCustomer };
  };

  const loginWithDemo = (customerId) => {
    const target = customers.find(c => c.id === customerId) || INITIAL_CUSTOMERS.find(c => c.id === customerId);
    if (target) {
      setUser(target);
      return { success: true, user: target };
    }
    return { success: false, message: 'Demo customer not found.' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('auriva_user');
      localStorage.removeItem('auriva_user_token');
    } catch (e) {
      console.error(e);
    }
  };

  const addAddress = async (addr) => {
    if (token) {
      try {
        const payload = {
          fullName: addr.name || addr.fullName || user?.name || 'Customer',
          phoneNumber: addr.phone || addr.phoneNumber || user?.phone || '9999999999',
          addressLine1: addr.addressLine1 || addr.street || '',
          addressLine2: addr.addressLine2 || '',
          landmark: addr.landmark || '',
          city: addr.city || '',
          state: addr.state || 'Madhya Pradesh',
          postalCode: addr.postalCode || addr.pincode || '',
          addressType: (addr.addressType || addr.type || 'home').toLowerCase(),
          isDefault: Boolean(addr.isDefault || addresses.length === 0)
        };
        const res = await addressApi.addAddress(payload);
        if (res?.data?.address) {
          const newFormatted = formatAddress(res.data.address);
          setAddresses(prev => {
            if (newFormatted.isDefault) {
              return [newFormatted, ...prev.map(a => ({ ...a, isDefault: false }))];
            }
            return [...prev, newFormatted];
          });
          setSelectedAddressId(newFormatted.id);
          return newFormatted.id;
        }
      } catch (err) {
        console.error('[AuthContext] Backend addAddress failed:', err);
        throw err;
      }
    }
    const newAddr = {
      ...addr,
      id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0
    };
    setAddresses(prev => [...prev, newAddr]);
    if (addresses.length === 0) {
      setSelectedAddressId(newAddr.id);
    }
    return newAddr.id;
  };

  const updateAddress = async (id, updatedData) => {
    if (token && !String(id).startsWith('addr-')) {
      try {
        const payload = {
          fullName: updatedData.name || updatedData.fullName,
          phoneNumber: updatedData.phone || updatedData.phoneNumber,
          addressLine1: updatedData.addressLine1 || updatedData.street,
          addressLine2: updatedData.addressLine2,
          landmark: updatedData.landmark,
          city: updatedData.city,
          state: updatedData.state,
          postalCode: updatedData.postalCode || updatedData.pincode,
          addressType: updatedData.addressType || (updatedData.type ? updatedData.type.toLowerCase() : undefined)
        };
        const res = await addressApi.updateAddress(id, payload);
        if (res?.data?.address) {
          const formatted = formatAddress(res.data.address);
          setAddresses(prev => prev.map(a => a.id === id ? formatted : a));
          return formatted;
        }
      } catch (err) {
        console.error('[AuthContext] Backend updateAddress failed:', err);
        throw err;
      }
    }
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
  };

  const deleteAddress = async (id) => {
    if (token && !String(id).startsWith('addr-')) {
      try {
        await addressApi.deleteAddress(id);
      } catch (err) {
        console.error('[AuthContext] Backend deleteAddress failed:', err);
        throw err;
      }
    }
    setAddresses(prev => {
      const filtered = prev.filter(a => a.id !== id);
      if (selectedAddressId === id && filtered.length > 0) {
        setSelectedAddressId(filtered[0].id);
      }
      return filtered;
    });
  };

  const setPrimaryAddress = async (id) => {
    setSelectedAddressId(id);
    if (token && !String(id).startsWith('addr-')) {
      try {
        await addressApi.setDefaultAddress(id);
      } catch (err) {
        console.warn('[AuthContext] Backend setDefaultAddress note:', err.message);
      }
    }
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };

  const placeOrder = async (orderPayload) => {
    // If authenticated, place real order via backend API
    if (token) {
      const targetAddress = orderPayload.address || addresses.find(a => a.id === selectedAddressId) || addresses[0];
      let addressId = targetAddress?._id;
      if (!addressId && targetAddress?.id && /^[0-9a-fA-F]{24}$/.test(String(targetAddress.id))) {
        addressId = targetAddress.id;
      }

      // Auto-persist mock/local address to backend DB if it does not have a real MongoDB ID
      if (!addressId && targetAddress) {
        try {
          const addrPayload = {
            fullName: targetAddress.name || targetAddress.fullName || user?.name || 'Customer',
            phoneNumber: targetAddress.phone || targetAddress.phoneNumber || user?.phone || '9876543210',
            addressLine1: targetAddress.street || targetAddress.addressLine1 || 'Main Street',
            addressLine2: targetAddress.addressLine2 || '',
            landmark: targetAddress.landmark || '',
            city: targetAddress.city || 'Indore',
            state: targetAddress.state || 'Madhya Pradesh',
            postalCode: targetAddress.pincode || targetAddress.postalCode || '452001',
            addressType: (targetAddress.type || 'home').toLowerCase()
          };
          const newAddrRes = await addressApi.addAddress(addrPayload);
          if (newAddrRes?.data?.address?._id) {
            addressId = newAddrRes.data.address._id;
            const formattedAddr = formatAddress(newAddrRes.data.address);
            setAddresses(prev => [formattedAddr, ...prev.filter(a => a.id !== targetAddress.id)]);
            setSelectedAddressId(formattedAddr.id);
          }
        } catch (addrErr) {
          console.warn('[AuthContext] Auto-sync address error:', addrErr.message);
        }
      }

      let normalizedPayment = 'COD';
      const rawPayment = orderPayload.paymentMethod || '';
      if (rawPayment.includes('UPI')) normalizedPayment = 'UPI';
      else if (rawPayment.includes('Card')) normalizedPayment = 'CARD';
      else if (rawPayment.includes('Net')) normalizedPayment = 'NETBANKING';

      const payload = {
        addressId,
        paymentMethod: normalizedPayment,
        paymentDetails: {
          transactionId: orderPayload.paymentDetails?.transactionId || '',
          upiApp: orderPayload.selectedUpiApp || ''
        },
        couponCode: orderPayload.couponApplied || undefined,
        idempotencyKey: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      };

      const res = await orderApi.placeOrder(payload);
      if (res && res.data && res.data.order) {
        const formatted = formatOrder(res.data.order);
        setOrders(prev => [formatted, ...prev]);

        // Trigger confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#1B3B29', '#E5C358', '#0E2A1B']
          });
        } catch {
          // ignore
        }

        return formatted.id;
      }
    }

    // Fallback simulation for offline testing
    const newOrderId = `AV${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: newOrderId,
      customer: user?.name || orderPayload.name || "Guest Customer",
      email: user?.email || orderPayload.email || "guest@aurivafoods.com",
      phone: user?.phone || orderPayload.phone || "+91 9876543210",
      date: dateStr,
      time: timeStr,
      items: orderPayload.items,
      subtotal: orderPayload.subtotal,
      discount: orderPayload.discount,
      couponApplied: orderPayload.couponApplied || 'None',
      deliveryFee: orderPayload.deliveryFee,
      tax: orderPayload.tax,
      total: orderPayload.total,
      paymentMethod: orderPayload.paymentMethod || 'UPI',
      paymentStatus: "Paid",
      deliveryType: orderPayload.deliveryType || "Quick Commerce",
      status: "Out for Delivery",
      timeline: [
        { status: "Order Received", time: `${timeStr}, ${dateStr}`, done: true, current: false },
        { status: "Packed", time: "Just now", done: true, current: false },
        { status: "Ready for Dispatch", time: "In process", done: true, current: false },
        { status: "Out for Delivery", time: "Live", done: true, current: true },
        { status: "Delivered", time: "Estimated in 25 mins", done: false, current: false }
      ],
      rider: {
        name: "Rohan Kumar",
        phone: "+91 9811122334",
        rating: 4.9,
        vehicle: "MP09-AB-1234",
        eta: "25 mins",
        distance: "2.5 km away",
        lat: 22.7196,
        lng: 75.8577
      },
      address: orderPayload.address || addresses.find(a => a.id === selectedAddressId) || addresses[0]
    };

    setOrders(prev => [newOrder, ...prev]);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#1B3B29', '#E5C358', '#0E2A1B']
      });
    } catch {
      // ignore
    }

    return newOrderId;
  };

  const updateOrderStatus = (orderId, newStatus, extraData = {}) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const standardStatuses = ["Order Received", "Packed", "Ready for Dispatch", "Out for Delivery", "Delivered"];
      const statusIdx = standardStatuses.indexOf(newStatus);

      const updatedTimeline = order.timeline ? order.timeline.map(step => {
        const stepIdx = standardStatuses.indexOf(step.status);
        if (stepIdx <= statusIdx && stepIdx !== -1) {
          return {
            ...step,
            done: true,
            current: stepIdx === statusIdx,
            time: step.done ? step.time : `${timeStr}, ${dateStr}`
          };
        } else {
          return {
            ...step,
            done: false,
            current: false
          };
        }
      }) : [];

      return {
        ...order,
        status: newStatus,
        timeline: updatedTimeline.length > 0 ? updatedTimeline : order.timeline,
        courierName: extraData.courierName || order.courierName,
        awbNumber: extraData.awbNumber || order.awbNumber,
        rider: extraData.rider ? { ...order.rider, ...extraData.rider } : order.rider,
        deliveryNotes: extraData.deliveryNotes || order.deliveryNotes
      };
    }));
  };

  const cancelOrder = async (orderId, reason = "Customer requested cancellation") => {
    // 1. Optimistic UI update
    setOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId) ? { ...o, status: "Cancelled", cancelReason: reason } : o));

    // 2. Real API call if authenticated
    if (token) {
      try {
        const res = await orderApi.cancelOrder(orderId, reason);
        if (res?.data?.order) {
          const formatted = formatOrder(res.data.order);
          setOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId) ? formatted : o));
          return formatted;
        }
      } catch (err) {
        console.warn('[AuthContext] Backend cancelOrder note:', err.message);
        throw err;
      }
    }
  };

  const updateProfile = (data) => {
    setUser(prev => prev ? ({ ...prev, ...data }) : null);
  };

  const updateCustomer = (id, data) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: Boolean(user),
      orders,
      customers,
      addresses,
      selectedAddressId,
      setSelectedAddressId,
      requestOtp,
      verifyOtpAndLogin,
      loginWithPhone,
      loginWithDemo,
      logout,
      addAddress,
      updateAddress,
      deleteAddress,
      setPrimaryAddress,
      placeOrder,
      updateOrderStatus,
      cancelOrder,
      updateProfile,
      updateCustomer
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
