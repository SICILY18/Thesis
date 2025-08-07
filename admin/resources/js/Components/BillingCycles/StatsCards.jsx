import React from 'react';

const StatsCards = ({ stats, formatAmount }) => {
    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-blue-600 font-medium">Total Cycles</h3>
                <p className="text-2xl font-bold">{stats.totalCycles}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-green-600 font-medium">Active</h3>
                <p className="text-2xl font-bold">{stats.activeCycles}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-yellow-600 font-medium">Inactive</h3>
                <p className="text-2xl font-bold">{stats.inactiveCycles}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-red-600 font-medium">Total Amount</h3>
                <p className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</p>
            </div>
        </div>
    );
};

export default React.memo(StatsCards); 