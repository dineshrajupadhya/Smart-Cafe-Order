import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FiCoffee, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import api from '../../services/api';

const QRScan = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNumber = searchParams.get('table');
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tableNumber) {
      setError('No table number found in QR code');
      setLoading(false);
      return;
    }

    const fetchTable = async () => {
      try {
        const res = await api.get(`/qr/tables/${tableNumber}`);
        setTableInfo(res.data.table);
        localStorage.setItem('scannedTable', tableNumber);
      } catch (err) {
        setError('Invalid table or table not found');
      } finally {
        setLoading(false);
      }
    };

    fetchTable();
  }, [tableNumber]);

  const handleViewMenu = () => {
    localStorage.setItem('scannedTable', tableNumber);
    navigate('/menu');
  };

  const handleOrderNow = () => {
    localStorage.setItem('scannedTable', tableNumber);
    navigate('/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-dark-800 mb-2">Invalid QR Code</h1>
          <p className="text-dark-500 mb-6">{error}</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Go to Home <FiArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50">
      <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center w-full">
          <div className="w-24 h-24 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FiCoffee size={40} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-dark-800 mb-2">Welcome to Smart Cafe!</h1>

          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md mb-6">
            <span className="text-dark-500">You are at</span>
            <span className="text-2xl font-bold text-primary-500">Table {tableNumber}</span>
          </div>

          {tableInfo && (
            <div className="bg-white rounded-xl p-4 shadow-md mb-8 text-left">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-dark-400">Section</span>
                  <p className="font-medium capitalize">{tableInfo.section}</p>
                </div>
                <div>
                  <span className="text-dark-400">Capacity</span>
                  <p className="font-medium">{tableInfo.capacity} seats</p>
                </div>
                <div>
                  <span className="text-dark-400">Status</span>
                  <p className="font-medium capitalize">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      tableInfo.status === 'available' ? 'bg-green-500' :
                      tableInfo.status === 'occupied' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></span>
                    {tableInfo.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-dark-500 mb-8">Browse our menu and place your order directly from your phone.</p>

          <div className="space-y-3">
            <button
              onClick={handleOrderNow}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-lg"
            >
              <FiShoppingBag size={20} />
              Order Now
            </button>

            <button
              onClick={handleViewMenu}
              className="w-full bg-white text-primary-500 border-2 border-primary-500 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
            >
              View Menu First
              <FiArrowRight size={16} />
            </button>
          </div>

          <p className="text-xs text-dark-400 mt-8">
            Your table number will be automatically set when you checkout.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScan;
