import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS } from '../data/adminData';
import confetti from 'canvas-confetti';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auriva_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      name: "Vini Sharma",
      email: "vini.sharma@gmail.com",
      phone: "9876543210",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      rewardsPoints: 2450,
      tier: "Gold Wellness Member",
      memberSince: "Jan 2024"
    };
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
      localStorage.setItem('auriva_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('auriva_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  const addAddress = (addr) => {
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

  const updateAddress = (id, updatedData) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
  };

  const deleteAddress = (id) => {
    setAddresses(prev => {
      const filtered = prev.filter(a => a.id !== id);
      if (selectedAddressId === id && filtered.length > 0) {
        setSelectedAddressId(filtered[0].id);
      }
      return filtered;
    });
  };

  const setPrimaryAddress = (id) => {
    setSelectedAddressId(id);
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };

  const placeOrder = (orderPayload) => {
    const newOrderId = `AV${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: newOrderId,
      customer: user.name,
      email: user.email,
      phone: user.phone,
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

    // Give loyalty reward points (10% of total)
    const pointsEarned = Math.round(orderPayload.total * 0.1);
    setUser(prev => ({
      ...prev,
      rewardsPoints: prev.rewardsPoints + pointsEarned
    }));

    // Trigger celebration confetti
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

  const updateProfile = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      orders,
      addresses,
      selectedAddressId,
      setSelectedAddressId,
      addAddress,
      updateAddress,
      deleteAddress,
      setPrimaryAddress,
      placeOrder,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
