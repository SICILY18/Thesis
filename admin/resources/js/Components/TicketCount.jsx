import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TicketCount = () => {
    const [newTicketsCount, setNewTicketsCount] = useState(0);
    const [viewedTickets, setViewedTickets] = useState(() => {
        const saved = localStorage.getItem('viewedTickets');
        return new Set(saved ? JSON.parse(saved) : []);
    });

    const fetchNewTicketsCount = async () => {
        try {
            const response = await axios.get('/admin/tickets/data');
            if (response.data.success) {
                const savedViewedTickets = new Set(JSON.parse(localStorage.getItem('viewedTickets') || '[]'));
                
                const pendingTickets = response.data.data.filter(ticket => {
                    const normalized = (ticket.status || '').toLowerCase();
                    const isPending = normalized === 'pending' || normalized === 'open';
                    const isUnviewed = !savedViewedTickets.has(ticket.ticket_id);
                    return isPending && isUnviewed;
                });
                setNewTicketsCount(pendingTickets.length);

                const newViewedTickets = new Set(savedViewedTickets);
                response.data.data.forEach(ticket => {
                    const normalized = (ticket.status || '').toLowerCase();
                    if (normalized !== 'pending' && normalized !== 'open') {
                        newViewedTickets.add(ticket.ticket_id);
                    }
                });
                localStorage.setItem('viewedTickets', JSON.stringify([...newViewedTickets]));
                setViewedTickets(newViewedTickets);
            }
        } catch (error) {
            console.error('Error fetching new tickets count:', error);
        }
    };

    useEffect(() => {
        fetchNewTicketsCount();
        const ticketsInterval = setInterval(fetchNewTicketsCount, 3000);
        return () => clearInterval(ticketsInterval);
    }, []);

    if (newTicketsCount === 0) return null;

    return (
        <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {newTicketsCount}
        </span>
    );
};

export default TicketCount; 