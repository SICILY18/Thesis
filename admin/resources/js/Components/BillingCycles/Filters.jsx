import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

const accountTypes = [
    { label: 'All', value: 'All' },
    { label: 'Residential', value: 'residential' },
    { label: 'Commercial', value: 'commercial' }
];

const Filters = ({ filters, onFiltersChange }) => {
    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <Dropdown
                    value={filters.accountType}
                    options={accountTypes}
                    onChange={(e) => onFiltersChange({ ...filters, accountType: e.value })}
                    className="w-full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <InputText
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    placeholder="Search by name or account number"
                    className="w-full"
                />
            </div>
        </div>
    );
};

export default React.memo(Filters); 