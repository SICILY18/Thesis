import React from 'react';

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel, confirmButtonText = 'Confirm' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="flex items-center mb-4">
                    <span className="material-symbols-outlined text-yellow-500 mr-2">warning</span>
                    <h3 className="text-lg font-semibold">Confirm Action</h3>
                </div>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog; 