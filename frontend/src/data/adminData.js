export const INITIAL_ORDERS = [
  {
    id: "AV10294",
    customer: "Vini Sharma",
    email: "vini.sharma@gmail.com",
    phone: "+91 9876543210",
    date: "12 May 2024",
    time: "10:30 AM",
    items: [
      { id: "makhana-classic", name: "Classic Makhana", weight: "250g", qty: 1, price: 249, image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200&auto=format&fit=crop&q=80" },
      { id: "makhana-peri-peri", name: "Peri Peri Makhana", weight: "250g", qty: 1, price: 249, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80" },
      { id: "makhana-cheese", name: "Cheese Makhana", weight: "250g", qty: 1, price: 249, image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&auto=format&fit=crop&q=80" }
    ],
    subtotal: 747,
    discount: 149,
    couponApplied: "AURIVA20",
    deliveryFee: 40,
    tax: 31,
    total: 669,
    paymentMethod: "UPI (Google Pay)",
    paymentStatus: "Paid",
    deliveryType: "Quick Commerce",
    status: "Out for Delivery",
    timeline: [
      { status: "Order Received", time: "10:30 AM, 12 May", done: true, current: false },
      { status: "Packed", time: "11:15 AM, 12 May", done: true, current: false },
      { status: "Ready for Dispatch", time: "12:05 PM, 12 May", done: true, current: false },
      { status: "Out for Delivery", time: "02:30 PM, 12 May", done: true, current: true },
      { status: "Delivered", time: "Est. 03:15 PM, 12 May", done: false, current: false }
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
    address: {
      type: "Home",
      street: "32, Green Park, A-Block, Near Lotus Lake",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452001",
      phone: "9876543210"
    }
  },
  {
    id: "AV10220",
    customer: "Rahul Verma",
    email: "rahul.v@outlook.com",
    phone: "+91 9822334455",
    date: "08 May 2024",
    time: "03:40 PM",
    items: [
      { id: "makhana-himalayan-salt", name: "Himalayan Salt Makhana", weight: "500g", qty: 1, price: 469, image: "https://images.unsplash.com/photo-1518843025960-d60217f226f5?w=200&auto=format&fit=crop&q=80" },
      { id: "dry-fruit-almonds", name: "Jumbo California Almonds", weight: "500g", qty: 1, price: 499, image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=200&auto=format&fit=crop&q=80" }
    ],
    subtotal: 968,
    discount: 100,
    couponApplied: "FLAT100",
    deliveryFee: 0,
    tax: 43,
    total: 911,
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    deliveryType: "Courier",
    courierName: "Delhivery Express",
    awbNumber: "DLV889302194",
    status: "Delivered",
    timeline: [
      { status: "Order Received", time: "03:40 PM, 08 May", done: true, current: false },
      { status: "Packed", time: "05:10 PM, 08 May", done: true, current: false },
      { status: "Dispatched", time: "09:00 AM, 09 May", done: true, current: false },
      { status: "Delivered", time: "04:15 PM, 10 May", done: true, current: true }
    ],
    address: {
      type: "Work",
      street: "Tower B, Infinity Tech Hub, Powai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400076",
      phone: "9822334455"
    }
  },
  {
    id: "AV10098",
    customer: "Neha Patil",
    email: "neha.patil@yahoo.com",
    phone: "+91 9733445566",
    date: "28 Apr 2024",
    time: "11:20 AM",
    items: [
      { id: "makhana-masala", name: "Masala Makhana", weight: "250g", qty: 2, price: 498, image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&auto=format&fit=crop&q=80" },
      { id: "seeds-super-mix", name: "7-in-1 Super Seeds Mix", weight: "350g", qty: 1, price: 349, image: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=200&auto=format&fit=crop&q=80" }
    ],
    subtotal: 847,
    discount: 169,
    couponApplied: "AURIVA20",
    deliveryFee: 0,
    tax: 34,
    total: 712,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    deliveryType: "Courier",
    courierName: "BlueDart Air",
    awbNumber: "BD99281045",
    status: "Delivered",
    timeline: [
      { status: "Order Received", time: "11:20 AM, 28 Apr", done: true, current: false },
      { status: "Packed", time: "01:00 PM, 28 Apr", done: true, current: false },
      { status: "Dispatched", time: "06:00 PM, 28 Apr", done: true, current: false },
      { status: "Delivered", time: "02:45 PM, 30 Apr", done: true, current: true }
    ],
    address: {
      type: "Home",
      street: "Flat 402, Green Meadows, Baner",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411045",
      phone: "9733445566"
    }
  },
  {
    id: "AV10074",
    customer: "Ankit Joshi",
    email: "ankit.j@gmail.com",
    phone: "+91 9844556677",
    date: "25 Apr 2024",
    time: "07:15 PM",
    items: [
      { id: "granola-berry-bliss", name: "Wild Berry Artisanal Granola", weight: "400g", qty: 2, price: 778, image: "https://images.unsplash.com/photo-1517093707547-0e6d628d098e?w=200&auto=format&fit=crop&q=80" },
      { id: "dry-fruit-cashews", name: "Roasted & Salted W240 Cashews", weight: "500g", qty: 1, price: 549, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80" }
    ],
    subtotal: 1327,
    discount: 265,
    couponApplied: "AURIVA20",
    deliveryFee: 0,
    tax: 53,
    total: 1115,
    paymentMethod: "Net Banking",
    paymentStatus: "Paid",
    deliveryType: "Quick Commerce",
    status: "Packed",
    address: {
      type: "Home",
      street: "15, Jubilee Hills Road No. 36",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      phone: "9844556677"
    }
  },
  {
    id: "AV10016",
    customer: "Priya Sundaram",
    email: "priya.sundar@gmail.com",
    phone: "+91 9955667788",
    date: "22 Apr 2024",
    time: "01:10 PM",
    items: [
      { id: "trail-mix-energy", name: "Power Energy Trail Mix", weight: "350g", qty: 1, price: 429, image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=200&auto=format&fit=crop&q=80" },
      { id: "protein-edamame-bites", name: "Crispy Roasted Edamame", weight: "200g", qty: 2, price: 598, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80" }
    ],
    subtotal: 1027,
    discount: 205,
    couponApplied: "WELCOME20",
    deliveryFee: 0,
    tax: 41,
    total: 863,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    deliveryType: "Courier",
    status: "Processing",
    address: {
      type: "Home",
      street: "44, Anna Salai, T. Nagar",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600017",
      phone: "9955667788"
    }
  }
];

export const ADMIN_STATS = {
  totalRevenue: 1245320,
  todayOrders: 256,
  totalCustomers: 8542,
  repeatCustomers: 2145,
  repeatRate: "34%",
  revenueGrowth: "+18.4%",
  ordersGrowth: "+12.1%",
  customersGrowth: "+24.6%"
};

export const REVENUE_CHART_DATA = [
  { month: "Jan", revenue: 640000, orders: 1200 },
  { month: "Feb", revenue: 780000, orders: 1450 },
  { month: "Mar", revenue: 910000, orders: 1800 },
  { month: "Apr", revenue: 1050000, orders: 2100 },
  { month: "May", revenue: 1245320, orders: 2560 }
];

export const BANNERS_DATA = [
  {
    id: "b-1",
    title: "Real Ingredients. Real Nutrition.",
    subtitle: "Premium makhana and healthy snacks crafted for better everyday choices.",
    cta: "Shop Now",
    link: "/shop",
    tag: "Hero Banner",
    status: "Active",
    startDate: "01 May 2024",
    endDate: "31 Dec 2024"
  },
  {
    id: "b-2",
    title: "October Reward: 20% OFF",
    subtitle: "Claim 20% off on your next wellness refill order",
    cta: "Claim Offer",
    link: "/shop",
    tag: "Promotional",
    status: "Active",
    startDate: "01 Oct 2024",
    endDate: "31 Oct 2024"
  },
  {
    id: "b-3",
    title: "Exclusive Offers: Up to 30% OFF",
    subtitle: "Special bundles on Peri Peri and Cheese makhana tubs",
    cta: "Shop Offers",
    link: "/shop?filter=offers",
    tag: "Flash Sale",
    status: "Active",
    startDate: "10 May 2024",
    endDate: "30 May 2024"
  }
];
