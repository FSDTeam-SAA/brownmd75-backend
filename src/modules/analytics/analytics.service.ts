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

const AnalyticsService = {
  dashboardAnalytics,
};

export default AnalyticsService;
