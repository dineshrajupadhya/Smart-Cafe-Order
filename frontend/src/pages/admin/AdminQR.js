import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiPrinter, FiCheck, FiX } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminQR = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/qr/tables');
      setTables(res.data.tables);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (tableNumber) => {
    try {
      setGenerating(tableNumber);
      const res = await api.post('/qr/table/generate', { tableNumber });
      setTables(prev => prev.map(t =>
        t.tableNumber === tableNumber ? { ...t, qrCode: res.data.qrCode } : t
      ));
      toast.success(`QR code generated for Table ${tableNumber}`);
    } catch (err) {
      toast.error('Failed to generate QR code');
    } finally {
      setGenerating(null);
    }
  };

  const generateAllQR = async () => {
    try {
      setGenerating('all');
      for (const table of tables) {
        await api.post('/qr/table/generate', { tableNumber: table.tableNumber });
      }
      const res = await api.get('/qr/tables');
      setTables(res.data.tables);
      toast.success('All QR codes generated!');
    } catch (err) {
      toast.error('Failed to generate some QR codes');
    } finally {
      setGenerating(null);
    }
  };

  const printQR = (table) => {
    setSelectedTable(table);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const printAll = () => {
    setSelectedTable(null);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-700',
      occupied: 'bg-red-100 text-red-700',
      reserved: 'bg-yellow-100 text-yellow-700',
      maintenance: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-dark-800">Table QR Codes</h1>
          <p className="text-dark-500 text-sm mt-1">Generate and manage QR codes for each table</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAllQR} disabled={generating === 'all'} className="btn-primary flex items-center gap-2">
            {generating === 'all' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <FiRefreshCw size={16} />
            )}
            Generate All
          </button>
          <button onClick={printAll} className="btn-outline flex items-center gap-2">
            <FiPrinter size={16} />
            Print All
          </button>
        </div>
      </div>

      <div className="card p-4 mb-6 bg-blue-50 border-blue-200 no-print">
        <p className="text-sm text-blue-700">
          <strong>How it works:</strong> Customers scan the QR code at their table → redirected to{' '}
          <code className="bg-blue-100 px-1 rounded">your-site.com/scan?table=NUMBER</code> → they see the menu → table number is auto-set at checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 no-print">
        {tables.map(table => (
          <div key={table._id} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-dark-800">Table {table.tableNumber}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(table.status)}`}>
                {table.status}
              </span>
            </div>

            <div className="text-xs text-dark-400 mb-3 space-y-1">
              <p>Section: <span className="capitalize font-medium text-dark-600">{table.section}</span></p>
              <p>Capacity: <span className="font-medium text-dark-600">{table.capacity} seats</span></p>
            </div>

            {table.qrCode ? (
              <div className="bg-white border rounded-lg p-3 mb-3 flex items-center justify-center">
                <img src={table.qrCode} alt={`QR Table ${table.tableNumber}`} className="w-32 h-32" />
              </div>
            ) : (
              <div className="bg-dark-50 border border-dashed rounded-lg p-6 mb-3 flex items-center justify-center">
                <p className="text-sm text-dark-400">No QR code generated</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => generateQR(table.tableNumber)}
                disabled={generating === table.tableNumber}
                className="flex-1 btn-outline text-xs py-2 flex items-center justify-center gap-1"
              >
                {generating === table.tableNumber ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary-500"></div>
                ) : (
                  <FiRefreshCw size={12} />
                )}
                {table.qrCode ? 'Regenerate' : 'Generate'}
              </button>
              {table.qrCode && (
                <button
                  onClick={() => printQR(table)}
                  className="flex-1 btn-outline text-xs py-2 flex items-center justify-center gap-1"
                >
                  <FiPrinter size={12} />
                  Print
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTable && selectedTable.qrCode && (
        <div className="hidden print:block print:p-0">
          <div className="text-center p-8 border-2 border-dashed border-gray-300">
            <div className="mb-4">
              <span className="text-3xl font-bold text-dark-800">Smart Cafe</span>
            </div>
            <img src={selectedTable.qrCode} alt={`Table ${selectedTable.tableNumber}`} className="w-48 h-48 mx-auto mb-4" />
            <p className="text-2xl font-bold text-dark-800">Table {selectedTable.tableNumber}</p>
            <p className="text-sm text-dark-500 mt-1">Scan to view menu & order</p>
          </div>
        </div>
      )}

      {selectedTable === null && tables.some(t => t.qrCode) && (
        <div className="hidden print:block print:p-0">
          {tables.filter(t => t.qrCode).map(table => (
            <div key={table._id} className="text-center p-6 border-2 border-dashed border-gray-300 mb-4 page-break">
              <div className="mb-3">
                <span className="text-2xl font-bold text-dark-800">Smart Cafe</span>
              </div>
              <img src={table.qrCode} alt={`Table ${table.tableNumber}`} className="w-40 h-40 mx-auto mb-3" />
              <p className="text-xl font-bold text-dark-800">Table {table.tableNumber}</p>
              <p className="text-xs text-dark-500 mt-1">Scan to view menu & order</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminQR;
