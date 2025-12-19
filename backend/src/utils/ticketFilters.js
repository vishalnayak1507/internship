export function getStatusFilter(status, startDate, endDate) {
  if (["open", "resolved", "closed"].includes(status)) {
    return {
      status,
      lastModifiedAt: { $gte: new Date(startDate), $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }
    };
  }
  if (status === "in progress") {
    return {
      status,
      createdAt: { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }
    };
  }
  return {};
}

export function getSlaBreachedFilter(startDate, endDate) {
  return {
    slaStatusFlag: true,
    status: { $in: ["in progress", "resolved"] },
    createdAt: { $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) }
  };
}
