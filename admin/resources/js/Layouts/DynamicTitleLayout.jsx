import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import Footer from '../Components/Footer';

const DynamicTitleLayout = ({ children }) => {
    const { props } = usePage();
    const title = props.title || 'Staff Panel';

    return (
        <>
            <Head title={title} />
            <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                {children}
                </main>
                <Footer />
            </div>
        </>
    );
};

export default DynamicTitleLayout; 