import React from 'react';

const LoadingSkeleton = () => {
    return (
        <div className="animate-pulse">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 p-4 rounded-lg">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="animate-pulse">
                    {/* Table Header */}
                    <div className="bg-gray-50 px-6 py-3">
                        <div className="grid grid-cols-8 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-4 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>

                    {/* Table Rows */}
                    {[...Array(5)].map((_, rowIndex) => (
                        <div key={rowIndex} className="border-t border-gray-200 px-6 py-4">
                            <div className="grid grid-cols-8 gap-4">
                                {[...Array(8)].map((_, colIndex) => (
                                    <div key={colIndex} className="h-4 bg-gray-100 rounded"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton; 