import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

interface ContactMessage {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
}

const AdminContacts: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response: any = await apiService.getContacts();
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load contact messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const response: any = await apiService.deleteContact(id);
            if (response.success) {
                toast.success('Message deleted successfully');
                setMessages(messages.filter(m => m._id !== id));
                if (selectedMessage?._id === id) setSelectedMessage(null);
            }
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <AdminLayout>
            <div className="container-fluid px-4 py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">Contact Messages</h2>
                        <p className="text-muted">Manage user inquiries and feedback</p>
                    </div>
                    <button
                        className="btn btn-outline-primary"
                        onClick={fetchMessages}
                        disabled={loading}
                    >
                        <i className={`bi bi-arrow-clockwise me-2 ${loading ? 'spin' : ''}`}></i>
                        Refresh
                    </button>
                </div>

                <div className="row g-4">
                    {/* Messages Table */}
                    <div className={selectedMessage ? 'col-lg-7' : 'col-12'}>
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3 border-0">Sender</th>
                                                <th className="py-3 border-0">Subject</th>
                                                <th className="py-3 border-0">Date</th>
                                                <th className="px-4 py-3 border-0 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-5">
                                                        <div className="spinner-border text-primary" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : messages.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-5 text-muted">
                                                        No messages found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                messages.map((msg) => (
                                                    <tr
                                                        key={msg._id}
                                                        style={{ cursor: 'pointer' }}
                                                        className={selectedMessage?._id === msg._id ? 'table-primary shadow-sm' : ''}
                                                        onClick={() => setSelectedMessage(msg)}
                                                    >
                                                        <td className="px-4">
                                                            <div className="fw-bold text-dark">{msg.name}</div>
                                                            <div className="small text-muted">{msg.email}</div>
                                                        </td>
                                                        <td>
                                                            <span className="text-dark fw-medium">{msg.subject}</span>
                                                        </td>
                                                        <td className="small text-muted">
                                                            {formatDate(msg.createdAt)}
                                                        </td>
                                                        <td className="px-4 text-end">
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <button
                                                                    className="btn btn-sm btn-light text-primary"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedMessage(msg);
                                                                    }}
                                                                    title="View Message"
                                                                >
                                                                    <i className="bi bi-eye"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-light text-danger"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(msg._id);
                                                                    }}
                                                                    title="Delete Message"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Message Content Viewer */}
                    {selectedMessage && (
                        <div className="col-lg-5">
                            <div
                                className="card border-0 shadow-lg sticky-top"
                                style={{ borderRadius: '15px', top: '2rem', zIndex: 10 }}
                            >
                                <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0">Message Details</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setSelectedMessage(null)}
                                    ></button>
                                </div>
                                <div className="card-body p-4">
                                    <div className="mb-4">
                                        <label className="small fw-bold text-muted text-uppercase mb-1">From</label>
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                                                style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                                            >
                                                {selectedMessage.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{selectedMessage.name}</div>
                                                <a href={`mailto:${selectedMessage.email}`} className="text-decoration-none small">
                                                    {selectedMessage.email}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="small fw-bold text-muted text-uppercase mb-1">Subject</label>
                                        <div className="p-3 bg-light rounded-3 fw-bold text-dark">
                                            {selectedMessage.subject}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="small fw-bold text-muted text-uppercase mb-1">Message</label>
                                        <div
                                            className="p-3 bg-light rounded-3"
                                            style={{ minHeight: '150px', whiteSpace: 'pre-wrap' }}
                                        >
                                            {selectedMessage.message}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center pt-2">
                                        <span className="small text-muted">
                                            Received: {formatDate(selectedMessage.createdAt)}
                                        </span>
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={() => handleDelete(selectedMessage._id)}
                                        >
                                            <i className="bi bi-trash me-2"></i>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminContacts;
