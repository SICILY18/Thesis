import React, { useEffect } from 'react';

export default function FormRecovery({ formId, onRecover }) {
    useEffect(() => {
        // Check for saved form data
        const savedData = localStorage.getItem(`form-${formId}`);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                onRecover(data);
                // Clear the saved data after recovery
                localStorage.removeItem(`form-${formId}`);
            } catch (error) {
                console.error('Error recovering form data:', error);
            }
        }
    }, [formId]);

    return null; // This is a utility component, it doesn't render anything
} 