import Equipment from "../equipment/equipment.model";
import { Order } from "../order/order.model";
import { User } from "../user/user.model";

const dashboardAnalytics = async () => {
  const [totalUsers, totalEquipments, totalOrders, revenueResult] =
    await Promise.all([
      User.countDocuments(),
      Equipment.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        {
          $match: { paymentStatus: "paid" },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

  const totalRevenue =
    revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  return {
    totalUsers,
    totalEquipments,
    totalOrders,
    totalRevenue,
  };
};

const monthlyRevenueChart = async (query: any) => {
  const type = query.type || "monthly"; // monthly, yearly, weekly

  // MONTH NAMES
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // WEEKDAY NAMES
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (type === "weekly") {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6); // last 7 days

    // Aggregate by day
    const aggregation = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: last7Days },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const result: { date: string; day: string; revenue: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));

      const formattedDate = date.toISOString().split("T")[0];
      const dayName = weekDays[date.getDay()];

      const found = aggregation.find(
        (item) =>
          item._id.year === date.getFullYear() &&
          item._id.month === date.getMonth() + 1 &&
          item._id.day === date.getDate(),
      );

      result.push({
        date: formattedDate,
        day: dayName,
        revenue: found ? found.revenue : 0,
      });
    }

    return result;
  }

  // YEARLY FILTER (monthly revenue for selected year)
  if (type === "yearly") {
    const year = query.year ? Number(query.year) : new Date().getFullYear();

    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31`);

    const aggregation = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // Fill missing months
    const allMonths = monthNames.map((name, i) => ({
      month: name,
      revenue: 0,
    }));

    aggregation.forEach((item) => {
      allMonths[item._id.month - 1].revenue = item.revenue;
    });

    return allMonths;
  }

  // DEFAULT → Current year monthly
  const currentYear = new Date().getFullYear();
  const start = new Date(`${currentYear}-01-01`);
  const end = new Date(`${currentYear}-12-31`);

  const aggregation = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  // Fill missing months
  const allMonths = monthNames.map((name, i) => ({
    month: name,
    revenue: 0,
  }));

  aggregation.forEach((item) => {
    allMonths[item._id.month - 1].revenue = item.revenue;
  });

  return allMonths;
};



const AnalyticsService = {
  dashboardAnalytics,
  monthlyRevenueChart,
};

export default AnalyticsService;
